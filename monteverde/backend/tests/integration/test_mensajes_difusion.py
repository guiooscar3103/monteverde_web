import os
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-difusion-monteverde-32bytes!'

from config import Config
Config.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
Config.SQLALCHEMY_ECHO = False

import unittest
import json
from app import create_app
from src.extensions import db
from src.models.usuario import Usuario, familia_estudiante
from src.models.curso import Curso
from src.models.estudiante import Estudiante
from src.models.materia import Materia
from src.models.docente_asignacion import DocenteAsignacion
from src.models.mensaje import Mensaje


class MensajesDifusionDocenteTestCase(unittest.TestCase):
    """
    Suite de pruebas de integración para:
    1. Obtención de estudiantes por curso con sus familias asociadas y validación de asignación.
    2. Envío de difusión masiva al curso con deduplicación por DISTINCT familia_id y atomicidad.
    """

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key-difusion-monteverde-32bytes!'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # Cursos
            self.curso_1a = Curso(nombre='Primero A', nivel='1', letra='A')
            self.curso_2b = Curso(nombre='Segundo B', nivel='2', letra='B')
            self.curso_3c = Curso(nombre='Tercero C', nivel='3', letra='C')  # Curso NO asignado al docente
            db.session.add_all([self.curso_1a, self.curso_2b, self.curso_3c])
            db.session.flush()

            # Materias
            self.mat_mate = Materia(nombre='Matemáticas')
            db.session.add(self.mat_mate)
            db.session.flush()

            # Estudiantes en 1A:
            # - Lucas González (Hermano 1)
            # - Laura González (Hermano 2)
            # - Mateo Gómez
            # - Juan SinFamilia
            self.est_lucas = Estudiante(nombre='Lucas González', curso_id=self.curso_1a.id)
            self.est_laura = Estudiante(nombre='Laura González', curso_id=self.curso_1a.id)
            self.est_mateo = Estudiante(nombre='Mateo Gómez', curso_id=self.curso_1a.id)
            self.est_sin_fam = Estudiante(nombre='Juan SinFamilia', curso_id=self.curso_1a.id)

            # Estudiante en 3C (curso ajeno)
            self.est_carlos = Estudiante(nombre='Carlos Ajeno', curso_id=self.curso_3c.id)

            db.session.add_all([self.est_lucas, self.est_laura, self.est_mateo, self.est_sin_fam, self.est_carlos])
            db.session.flush()

            # Docente
            self.docente = Usuario(
                nombre='Profesor Roberto',
                email='roberto.docente@monteverde.edu.co',
                password='password123',
                rol='docente',
                activo=True
            )
            # Familias
            # Familia González: tiene a Lucas y a Laura en 1A (vía Many-to-Many)
            self.fam_gonzalez = Usuario(
                nombre='Familia González',
                email='familia.gonzalez@monteverde.edu.co',
                password='password123',
                rol='familia',
                activo=True
            )
            # Familia Gómez: tiene a Mateo en 1A (vía Legacy estudiante_id)
            self.fam_gomez = Usuario(
                nombre='Familia Gómez',
                email='familia.gomez@monteverde.edu.co',
                password='password123',
                rol='familia',
                estudiante_id=self.est_mateo.id,
                activo=True
            )
            # Familia Pérez: tiene a Carlos en 3C
            self.fam_perez = Usuario(
                nombre='Familia Pérez',
                email='familia.perez@monteverde.edu.co',
                password='password123',
                rol='familia',
                activo=True
            )

            db.session.add_all([self.docente, self.fam_gonzalez, self.fam_gomez, self.fam_perez])
            db.session.flush()

            # Asociaciones Many-to-Many
            self.fam_gonzalez.estudiantes.extend([self.est_lucas, self.est_laura])
            self.fam_perez.estudiantes.append(self.est_carlos)

            # Asignación de docente a curso 1A y 2B
            self.asig = DocenteAsignacion(
                docente_id=self.docente.id,
                curso_id=self.curso_1a.id,
                materia_id=self.mat_mate.id
            )
            db.session.add(self.asig)
            db.session.commit()

            # Guardar IDs escalares
            self.curso_1a_id = self.curso_1a.id
            self.curso_2b_id = self.curso_2b.id
            self.curso_3c_id = self.curso_3c.id
            self.docente_id = self.docente.id
            self.fam_gonzalez_id = self.fam_gonzalez.id
            self.fam_gomez_id = self.fam_gomez.id

            # Tokens
            self.token_docente = self._login('roberto.docente@monteverde.edu.co', 'password123')
            self.token_familia = self._login('familia.gonzalez@monteverde.edu.co', 'password123')

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _login(self, email, password):
        res = self.client.post('/api/auth/login', json={'email': email, 'password': password})
        data = json.loads(res.data)
        return data.get('token')

    # ========================================================
    # Pruebas: GET /api/estudiantes/por-curso/<curso_id>
    # ========================================================

    def test_obtener_estudiantes_por_curso_asignado_con_familias(self):
        """Docente consulta estudiantes de su curso 1A: recibe estudiantes con sus familias vinculadas"""
        headers = {'Authorization': f'Bearer {self.token_docente}'}
        res = self.client.get(f'/api/estudiantes/por-curso/{self.curso_1a_id}', headers=headers)
        self.assertEqual(res.status_code, 200)

        data = json.loads(res.data)
        self.assertTrue(data['success'])
        estudiantes = data['data']
        self.assertEqual(len(estudiantes), 4)

        # Lucas tiene a Familia González
        lucas = next(e for e in estudiantes if e['nombre'] == 'Lucas González')
        self.assertEqual(len(lucas['familias']), 1)
        self.assertEqual(lucas['familias'][0]['nombre'], 'Familia González')

        # Laura también tiene a Familia González
        laura = next(e for e in estudiantes if e['nombre'] == 'Laura González')
        self.assertEqual(len(laura['familias']), 1)
        self.assertEqual(laura['familias'][0]['nombre'], 'Familia González')

        # Mateo tiene a Familia Gómez (legacy)
        mateo = next(e for e in estudiantes if e['nombre'] == 'Mateo Gómez')
        self.assertEqual(len(mateo['familias']), 1)
        self.assertEqual(mateo['familias'][0]['nombre'], 'Familia Gómez')

        # Juan no tiene familias
        juan = next(e for e in estudiantes if e['nombre'] == 'Juan SinFamilia')
        self.assertEqual(len(juan['familias']), 0)

    def test_obtener_estudiantes_curso_no_asignado_rechazado_403(self):
        """Docente intenta consultar estudiantes de curso 3C no asignado -> 403 Forbidden"""
        headers = {'Authorization': f'Bearer {self.token_docente}'}
        res = self.client.get(f'/api/estudiantes/por-curso/{self.curso_3c_id}', headers=headers)
        self.assertEqual(res.status_code, 403)

        data = json.loads(res.data)
        self.assertFalse(data['success'])
        self.assertIn('No tienes asignado este curso', data['message'])

    # ========================================================
    # Pruebas: POST /api/mensajes/enviar-curso (Difusión Masiva)
    # ========================================================

    def test_enviar_difusion_curso_deduplica_familias_con_multiples_hijos(self):
        """
        En el curso 1A están Lucas y Laura (ambos de Familia González) y Mateo (Familia Gómez).
        La difusión masiva debe generar EXACTAMENTE 2 mensajes (uno para González y uno para Gómez).
        """
        headers = {'Authorization': f'Bearer {self.token_docente}'}
        payload = {
            'curso_id': self.curso_1a_id,
            'asunto': 'Aviso de Entrega de Notas',
            'cuerpo': 'Estimados acudientes, este viernes tendremos entrega de informes.'
        }
        res = self.client.post('/api/mensajes/enviar-curso', json=payload, headers=headers)
        self.assertEqual(res.status_code, 201)

        data = json.loads(res.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['destinatarios_count'], 2)
        self.assertIn('2 acudientes', data['message'])

        # Verificar en base de datos
        with self.app.app_context():
            mensajes = Mensaje.query.filter_by(emisor_id=self.docente_id).all()
            self.assertEqual(len(mensajes), 2)
            receptores_ids = [m.receptor_id for m in mensajes]
            self.assertIn(self.fam_gonzalez_id, receptores_ids)
            self.assertIn(self.fam_gomez_id, receptores_ids)
            # Verificar que Familia González solo recibió 1 mensaje
            gonzalez_msgs = [m for m in mensajes if m.receptor_id == self.fam_gonzalez_id]
            self.assertEqual(len(gonzalez_msgs), 1)

    def test_enviar_difusion_curso_no_asignado_rechazado_403(self):
        """Docente intenta enviar difusión a curso 3C que NO tiene asignado -> 403 Forbidden"""
        headers = {'Authorization': f'Bearer {self.token_docente}'}
        payload = {
            'curso_id': self.curso_3c_id,
            'asunto': 'Difusión no autorizada',
            'cuerpo': 'Este mensaje no debería enviarse.'
        }
        res = self.client.post('/api/mensajes/enviar-curso', json=payload, headers=headers)
        self.assertEqual(res.status_code, 403)

        data = json.loads(res.data)
        self.assertFalse(data['success'])
        self.assertIn('No tienes asignado este curso', data['message'])

    def test_enviar_difusion_sin_cuerpo_rechazado_400(self):
        """Envío de difusión con campos faltantes -> 400 Bad Request"""
        headers = {'Authorization': f'Bearer {self.token_docente}'}
        payload = {
            'curso_id': self.curso_1a_id,
            'asunto': 'Sin cuerpo',
            'cuerpo': ''
        }
        res = self.client.post('/api/mensajes/enviar-curso', json=payload, headers=headers)
        self.assertEqual(res.status_code, 400)

    def test_enviar_difusion_rol_no_docente_rechazado_403(self):
        """Usuario con rol familia intentando enviar difusión a curso -> 403 Forbidden"""
        headers = {'Authorization': f'Bearer {self.token_familia}'}
        payload = {
            'curso_id': self.curso_1a_id,
            'asunto': 'Intento de difusión',
            'cuerpo': 'Mensaje'
        }
        res = self.client.post('/api/mensajes/enviar-curso', json=payload, headers=headers)
        self.assertEqual(res.status_code, 403)


if __name__ == '__main__':
    unittest.main()
