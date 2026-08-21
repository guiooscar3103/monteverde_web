import os
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-mensajes-monteverde-32bytes!'

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


class MensajesContactosDocenteTestCase(unittest.TestCase):
    """
    Suite de pruebas de integración para el filtrado de contactos
    de familias por curso en el módulo de mensajería del docente.
    """

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key-mensajes-monteverde-32bytes!'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # Cursos
            self.curso_1a = Curso(nombre='Primero A', nivel='1', letra='A')
            self.curso_2b = Curso(nombre='Segundo B', nivel='2', letra='B')
            self.curso_3c = Curso(nombre='Tercero C', nivel='3', letra='C')  # Curso NO asignado al docente 1
            db.session.add_all([self.curso_1a, self.curso_2b, self.curso_3c])
            db.session.flush()

            # Materias
            self.mat_mate = Materia(nombre='Matemáticas')
            self.mat_lengua = Materia(nombre='Lenguaje')
            db.session.add_all([self.mat_mate, self.mat_lengua])
            db.session.flush()

            # Estudiantes
            # Estudiantes en 1A
            self.est1_1a = Estudiante(nombre='Lucas Castro', curso_id=self.curso_1a.id)
            self.est2_1a = Estudiante(nombre='Mateo Gómez', curso_id=self.curso_1a.id)
            # Estudiantes en 2B
            self.est3_2b = Estudiante(nombre='Sofía Castro', curso_id=self.curso_2b.id)  # Hermana de Lucas
            self.est4_2b = Estudiante(nombre='Valentina López', curso_id=self.curso_2b.id)
            # Estudiantes en 3C
            self.est5_3c = Estudiante(nombre='Carlos Pérez', curso_id=self.curso_3c.id)
            db.session.add_all([self.est1_1a, self.est2_1a, self.est3_2b, self.est4_2b, self.est5_3c])
            db.session.flush()

            # Usuarios Docentes
            self.docente1 = Usuario(
                nombre='Profesor Andrés',
                email='andres.docente@monteverde.edu.co',
                password='password123',
                rol='docente',
                activo=True
            )
            self.docente2_sin_cursos = Usuario(
                nombre='Profesora Clara',
                email='clara.docente@monteverde.edu.co',
                password='password123',
                rol='docente',
                activo=True
            )
            # Familias
            # Familia Castro (tiene a Lucas en 1A y a Sofía en 2B vía many-to-many)
            self.fam_castro = Usuario(
                nombre='Familia Castro Ruiz',
                email='familia.castro@monteverde.edu.co',
                password='password123',
                rol='familia',
                activo=True
            )
            # Familia Gómez (tiene a Mateo en 1A vía legacy estudiante_id)
            self.fam_gomez = Usuario(
                nombre='Familia Gómez',
                email='familia.gomez@monteverde.edu.co',
                password='password123',
                rol='familia',
                estudiante_id=self.est2_1a.id,
                activo=True
            )
            # Familia López (tiene a Valentina en 2B)
            self.fam_lopez = Usuario(
                nombre='Familia López',
                email='familia.lopez@monteverde.edu.co',
                password='password123',
                rol='familia',
                activo=True
            )
            # Familia Pérez (tiene a Carlos en 3C - curso no asignado a docente1)
            self.fam_perez = Usuario(
                nombre='Familia Pérez',
                email='familia.perez@monteverde.edu.co',
                password='password123',
                rol='familia',
                activo=True
            )

            db.session.add_all([
                self.docente1, self.docente2_sin_cursos,
                self.fam_castro, self.fam_gomez, self.fam_lopez, self.fam_perez
            ])
            db.session.flush()

            # Relacionar Many-to-Many
            self.fam_castro.estudiantes.extend([self.est1_1a, self.est3_2b])
            self.fam_lopez.estudiantes.append(self.est4_2b)
            self.fam_perez.estudiantes.append(self.est5_3c)

            # Asignaciones Docente 1 (Tiene 1A y 2B)
            self.asig1 = DocenteAsignacion(
                docente_id=self.docente1.id,
                curso_id=self.curso_1a.id,
                materia_id=self.mat_mate.id
            )
            self.asig2 = DocenteAsignacion(
                docente_id=self.docente1.id,
                curso_id=self.curso_2b.id,
                materia_id=self.mat_lengua.id
            )
            db.session.add_all([self.asig1, self.asig2])
            db.session.commit()

            # Guardar IDs escalares para evitar DetachedInstanceError
            self.curso_1a_id = self.curso_1a.id
            self.curso_2b_id = self.curso_2b.id
            self.curso_3c_id = self.curso_3c.id
            self.docente1_id = self.docente1.id
            self.docente2_id = self.docente2_sin_cursos.id
            self.fam_castro_id = self.fam_castro.id

            # Tokens
            self.token_docente1 = self._login('andres.docente@monteverde.edu.co', 'password123')
            self.token_docente2 = self._login('clara.docente@monteverde.edu.co', 'password123')
            self.token_familia = self._login('familia.castro@monteverde.edu.co', 'password123')

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _login(self, email, password):
        res = self.client.post('/api/auth/login', json={'email': email, 'password': password})
        data = json.loads(res.data)
        return data.get('token')

    def test_listar_todos_los_contactos_de_cursos_asignados(self):
        """Docente consulta contactos sin filtro de curso: obtiene familias de 1A y 2B, pero NO de 3C"""
        headers = {'Authorization': f'Bearer {self.token_docente1}'}
        res = self.client.get('/api/mensajes/contactos-docente', headers=headers)
        self.assertEqual(res.status_code, 200)

        data = json.loads(res.data)
        self.assertTrue(data['success'])
        contactos = data['data']

        # Deben estar Castro (1A y 2B), Gómez (1A) y López (2B). Pérez (3C) NO debe estar.
        nombres_familias = [c['nombre'] for c in contactos]
        self.assertIn('Familia Castro Ruiz', nombres_familias)
        self.assertIn('Familia Gómez', nombres_familias)
        self.assertIn('Familia López', nombres_familias)
        self.assertNotIn('Familia Pérez', nombres_familias)

        # Verificar agrupación de hermanos en Familia Castro
        castro = next(c for c in contactos if c['nombre'] == 'Familia Castro Ruiz')
        self.assertEqual(len(castro['estudiantes']), 2)
        nombres_hijos = [e['nombre'] for e in castro['estudiantes']]
        self.assertIn('Lucas Castro', nombres_hijos)
        self.assertIn('Sofía Castro', nombres_hijos)

    def test_filtrar_contactos_por_curso_especifico_1a(self):
        """Docente filtra por curso 1A: solo debe ver familias con estudiantes en 1A"""
        headers = {'Authorization': f'Bearer {self.token_docente1}'}
        res = self.client.get(f'/api/mensajes/contactos-docente?curso_id={self.curso_1a_id}', headers=headers)
        self.assertEqual(res.status_code, 200)

        data = json.loads(res.data)
        contactos = data['data']
        nombres_familias = [c['nombre'] for c in contactos]

        self.assertIn('Familia Castro Ruiz', nombres_familias)
        self.assertIn('Familia Gómez', nombres_familias)
        self.assertNotIn('Familia López', nombres_familias)  # López está en 2B

        # Familia Castro solo debe mostrar a Lucas (estudiante de 1A) en este filtro
        castro = next(c for c in contactos if c['nombre'] == 'Familia Castro Ruiz')
        self.assertEqual(len(castro['estudiantes']), 1)
        self.assertEqual(castro['estudiantes'][0]['nombre'], 'Lucas Castro')

    def test_filtrar_contactos_por_curso_especifico_2b(self):
        """Docente filtra por curso 2B: solo debe ver familias con estudiantes en 2B"""
        headers = {'Authorization': f'Bearer {self.token_docente1}'}
        res = self.client.get(f'/api/mensajes/contactos-docente?curso_id={self.curso_2b_id}', headers=headers)
        self.assertEqual(res.status_code, 200)

        data = json.loads(res.data)
        contactos = data['data']
        nombres_familias = [c['nombre'] for c in contactos]

        self.assertIn('Familia Castro Ruiz', nombres_familias)
        self.assertIn('Familia López', nombres_familias)
        self.assertNotIn('Familia Gómez', nombres_familias)

        # Familia Castro solo debe mostrar a Sofía (estudiante de 2B) en este filtro
        castro = next(c for c in contactos if c['nombre'] == 'Familia Castro Ruiz')
        self.assertEqual(len(castro['estudiantes']), 1)
        self.assertEqual(castro['estudiantes'][0]['nombre'], 'Sofía Castro')

    def test_docente_consulta_curso_no_asignado_retorna_403(self):
        """Docente intenta consultar curso 3C que NO tiene asignado -> 403 Forbidden"""
        headers = {'Authorization': f'Bearer {self.token_docente1}'}
        res = self.client.get(f'/api/mensajes/contactos-docente?curso_id={self.curso_3c_id}', headers=headers)
        self.assertEqual(res.status_code, 403)

        data = json.loads(res.data)
        self.assertFalse(data['success'])
        self.assertIn('No tienes asignado este curso', data['message'])

    def test_docente_sin_cursos_asignados_retorna_lista_vacia(self):
        """Docente sin cursos asignados obtiene lista vacía sin error"""
        headers = {'Authorization': f'Bearer {self.token_docente2}'}
        res = self.client.get('/api/mensajes/contactos-docente', headers=headers)
        self.assertEqual(res.status_code, 200)

        data = json.loads(res.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['data'], [])

    def test_acceso_sin_token_rechazado_401(self):
        """Petición sin autenticación es rechazada con 401"""
        res = self.client.get('/api/mensajes/contactos-docente')
        self.assertEqual(res.status_code, 401)

    def test_acceso_rol_no_docente_rechazado_403(self):
        """Usuario con rol familia intentando acceder al endpoint recibe 403"""
        headers = {'Authorization': f'Bearer {self.token_familia}'}
        res = self.client.get('/api/mensajes/contactos-docente', headers=headers)
        self.assertEqual(res.status_code, 403)


if __name__ == '__main__':
    unittest.main()
