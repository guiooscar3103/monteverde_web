import os
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-tareas-bimestre-monteverde-32b!'

from config import Config
Config.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
Config.SQLALCHEMY_ECHO = False

import unittest
import json
from datetime import datetime, timedelta
from app import create_app
from src.extensions import db
from src.models.usuario import Usuario
from src.models.curso import Curso
from src.models.estudiante import Estudiante
from src.models.materia import Materia
from src.models.docente_asignacion import DocenteAsignacion
from src.models.bimestre import Bimestre
from src.models.indicador_logro import IndicadorLogro
from src.models.tarea import Tarea
from src.models.entrega import Entrega
from src.models.calificacion_bimestre import CalificacionBimestre


class TareaCalificacionesBimestreTestCase(unittest.TestCase):
    """
    Suite de integración para la sincronización automática de Tareas con
    Calificaciones Bimestrales (Gestión Académica):
    - Creación y edición con califica_bimestre (True / False)
    - Validación de número de nota (1, 2, 3) y pertenencia del indicador
    - Integridad de casillas académicas (HTTP 409 Conflict ante duplicados)
    - Sincronización atómica (UPSERT) en calificaciones_bimestre al calificar entregas
    - Trazabilidad de tarea_id en calificaciones_bimestre
    """

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key-tareas-bimestre-monteverde-32b!'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # 1. Cursos y Materia
            self.curso = Curso(nombre='Primero A', nivel='1', letra='A')
            self.mat = Materia(nombre='Matemáticas')
            db.session.add_all([self.curso, self.mat])
            db.session.flush()

            # 2. Docente con asignación
            self.docente = Usuario(
                nombre='Profesor Carlos',
                email='docente.carlos@monteverde.edu.co',
                password='password123',
                rol='docente',
                activo=True
            )
            db.session.add(self.docente)
            db.session.flush()

            self.asig = DocenteAsignacion(
                docente_id=self.docente.id,
                curso_id=self.curso.id,
                materia_id=self.mat.id
            )
            db.session.add(self.asig)

            # 3. Estudiante
            self.est = Estudiante(nombre='Santiago González', curso_id=self.curso.id)
            db.session.add(self.est)
            db.session.flush()

            # 4. Bimestre e Indicador de Logro (Bimestres 2026 son precreados en app.py)
            self.bimestre = Bimestre.query.filter_by(orden=1).first()
            if not self.bimestre:
                self.bimestre = Bimestre(nombre='Bimestre 1', anio=2026, orden=1)
                db.session.add(self.bimestre)
                db.session.flush()

            self.ind1 = IndicadorLogro(
                docente_id=self.docente.id,
                curso_id=self.curso.id,
                materia_id=self.mat.id,
                bimestre_id=self.bimestre.id,
                numero=1,
                descripcion='Comprende conceptos básicos de fracciones y sumas.'
            )
            self.ind2 = IndicadorLogro(
                docente_id=self.docente.id,
                curso_id=self.curso.id,
                materia_id=self.mat.id,
                bimestre_id=self.bimestre.id,
                numero=2,
                descripcion='Aplica algoritmos de multiplicación y división.'
            )
            db.session.add_all([self.ind1, self.ind2])
            db.session.commit()

            self.curso_id = self.curso.id
            self.materia_id = self.mat.id
            self.docente_id = self.docente.id
            self.estudiante_id = self.est.id
            self.bimestre_id = self.bimestre.id
            self.ind1_id = self.ind1.id
            self.ind2_id = self.ind2.id

            self.token_docente = self._login('docente.carlos@monteverde.edu.co', 'password123')

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _login(self, email, password):
        res = self.client.post('/api/auth/login', json={'email': email, 'password': password})
        data = json.loads(res.data)
        return data.get('token')

    # ========================================================
    # Tests: Creación y Vinculación Bimestral
    # ========================================================

    def test_crear_tarea_sin_calificacion_bimestral_exitosa(self):
        """Tarea regular sin vinculación a nota bimestral (califica_bimestre=False)"""
        headers = {'Authorization': f'Bearer {self.token_docente}'}
        payload = {
            'titulo': 'Taller Regular',
            'descripcion': 'Solo para práctica en clase',
            'fecha_vencimiento': (datetime.utcnow() + timedelta(days=3)).strftime('%Y-%m-%d'),
            'curso_id': self.curso_id,
            'materia_id': self.materia_id,
            'estado': 'PUBLICADA',
            'califica_bimestre': False
        }
        res = self.client.post('/api/docente/tareas', json=payload, headers=headers)
        self.assertEqual(res.status_code, 201)

        data = json.loads(res.data)['data']
        self.assertFalse(data['califica_bimestre'])
        self.assertIsNone(data['bimestre_id'])
        self.assertIsNone(data['indicador_id'])
        self.assertIsNone(data['numero_nota'])

    def test_crear_tarea_vinculada_a_calificacion_bimestral_exitosa(self):
        """Tarea vinculada a Bimestre 1, Indicador 1, Nota 1 (califica_bimestre=True)"""
        headers = {'Authorization': f'Bearer {self.token_docente}'}
        payload = {
            'titulo': 'Taller Evaluativo Fracciones',
            'descripcion': 'Cuenta como la Nota 1 del Indicador 1',
            'fecha_vencimiento': (datetime.utcnow() + timedelta(days=4)).strftime('%Y-%m-%d'),
            'curso_id': self.curso_id,
            'materia_id': self.materia_id,
            'estado': 'PUBLICADA',
            'califica_bimestre': True,
            'bimestre_id': self.bimestre_id,
            'indicador_id': self.ind1_id,
            'numero_nota': 1,
            'tipo_evaluacion': 'Taller'
        }
        res = self.client.post('/api/docente/tareas', json=payload, headers=headers)
        self.assertEqual(res.status_code, 201)

        data = json.loads(res.data)['data']
        self.assertTrue(data['califica_bimestre'])
        self.assertEqual(data['bimestre_id'], self.bimestre_id)
        self.assertEqual(data['indicador_id'], self.ind1_id)
        self.assertEqual(data['numero_nota'], 1)
        self.assertEqual(data['tipo_evaluacion'], 'Taller')

    def test_crear_tarea_numero_nota_invalido_retorna_400(self):
        """numero_nota = 4 debe ser rechazado con 400 Bad Request"""
        headers = {'Authorization': f'Bearer {self.token_docente}'}
        payload = {
            'titulo': 'Tarea Nota Inválida',
            'fecha_vencimiento': (datetime.utcnow() + timedelta(days=4)).strftime('%Y-%m-%d'),
            'curso_id': self.curso_id,
            'materia_id': self.materia_id,
            'califica_bimestre': True,
            'bimestre_id': self.bimestre_id,
            'indicador_id': self.ind1_id,
            'numero_nota': 4  # Inválido (debe ser 1, 2 o 3)
        }
        res = self.client.post('/api/docente/tareas', json=payload, headers=headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn('numero_nota debe ser 1, 2 o 3', json.loads(res.data)['message'])

    def test_conflicto_casilla_academica_duplicada_retorna_409(self):
        """Intentar crear una segunda tarea para la misma casilla (Indicador 1, Nota 1) retorna HTTP 409 Conflict"""
        headers = {'Authorization': f'Bearer {self.token_docente}'}
        payload1 = {
            'titulo': 'Primera Tarea Casilla 1-1',
            'fecha_vencimiento': (datetime.utcnow() + timedelta(days=3)).strftime('%Y-%m-%d'),
            'curso_id': self.curso_id,
            'materia_id': self.materia_id,
            'califica_bimestre': True,
            'bimestre_id': self.bimestre_id,
            'indicador_id': self.ind1_id,
            'numero_nota': 1
        }
        res1 = self.client.post('/api/docente/tareas', json=payload1, headers=headers)
        self.assertEqual(res1.status_code, 201)

        # Intento de 2da tarea para la misma casilla
        payload2 = {
            'titulo': 'Segunda Tarea Misma Casilla 1-1',
            'fecha_vencimiento': (datetime.utcnow() + timedelta(days=5)).strftime('%Y-%m-%d'),
            'curso_id': self.curso_id,
            'materia_id': self.materia_id,
            'califica_bimestre': True,
            'bimestre_id': self.bimestre_id,
            'indicador_id': self.ind1_id,
            'numero_nota': 1
        }
        res2 = self.client.post('/api/docente/tareas', json=payload2, headers=headers)
        self.assertEqual(res2.status_code, 409)
        self.assertIn('Conflicto: Ya existe una tarea', json.loads(res2.data)['message'])

    # ========================================================
    # Tests: Calificación y Sincronización Automática
    # ========================================================

    def test_calificar_tarea_sincroniza_automaticamente_con_calificaciones_bimestre(self):
        """
        Al calificar la entrega de un estudiante en una tarea con califica_bimestre=True:
        1. Se guarda la entrega con su nota.
        2. Se crea/actualiza automáticamente el registro en CalificacionBimestre.
        3. Se asocia tarea_id en CalificacionBimestre para trazabilidad.
        """
        headers = {'Authorization': f'Bearer {self.token_docente}'}

        # 1. Crear Tarea
        payload = {
            'titulo': 'Evaluación Bimestral 1',
            'fecha_vencimiento': (datetime.utcnow() + timedelta(days=2)).strftime('%Y-%m-%d'),
            'curso_id': self.curso_id,
            'materia_id': self.materia_id,
            'califica_bimestre': True,
            'bimestre_id': self.bimestre_id,
            'indicador_id': self.ind1_id,
            'numero_nota': 2,
            'tipo_evaluacion': 'Examen'
        }
        res_t = self.client.post('/api/docente/tareas', json=payload, headers=headers)
        self.assertEqual(res_t.status_code, 201)
        tarea_id = json.loads(res_t.data)['data']['id']

        # 2. Calificar entrega del estudiante Santiago
        calif_payload = {
            'estudiante_id': self.estudiante_id,
            'calificacion': 4.8,
            'comentarios': 'Excelente desempeño en fracciones',
            'estado': 'CALIFICADA'
        }
        res_c = self.client.post(f'/api/docente/tareas/{tarea_id}/calificar', json=calif_payload, headers=headers)
        self.assertEqual(res_c.status_code, 200)

        # 3. Verificar en BD que CalificacionBimestre existe y tiene los datos correctos
        with self.app.app_context():
            calif_bim = CalificacionBimestre.query.filter_by(
                estudiante_id=self.estudiante_id,
                indicador_id=self.ind1_id,
                numero_nota=2
            ).first()

            self.assertIsNotNone(calif_bim)
            self.assertEqual(float(calif_bim.nota), 4.8)
            self.assertEqual(calif_bim.tarea_id, tarea_id)
            self.assertEqual(calif_bim.docente_id, self.docente_id)

    def test_recalificar_tarea_actualiza_nota_bimestral_existente_upsert(self):
        """Re-calificar una entrega actualiza la nota existente en CalificacionBimestre (UPSERT)"""
        headers = {'Authorization': f'Bearer {self.token_docente}'}

        # 1. Crear Tarea
        payload = {
            'titulo': 'Taller 2 Indicador 2',
            'fecha_vencimiento': (datetime.utcnow() + timedelta(days=2)).strftime('%Y-%m-%d'),
            'curso_id': self.curso_id,
            'materia_id': self.materia_id,
            'califica_bimestre': True,
            'bimestre_id': self.bimestre_id,
            'indicador_id': self.ind2_id,
            'numero_nota': 3
        }
        res_t = self.client.post('/api/docente/tareas', json=payload, headers=headers)
        tarea_id = json.loads(res_t.data)['data']['id']

        # 2. Primera calificación: 3.5
        self.client.post(f'/api/docente/tareas/{tarea_id}/calificar', json={
            'estudiante_id': self.estudiante_id,
            'calificacion': 3.5
        }, headers=headers)

        # 3. Corrección de calificación: 4.2
        self.client.post(f'/api/docente/tareas/{tarea_id}/calificar', json={
            'estudiante_id': self.estudiante_id,
            'calificacion': 4.2
        }, headers=headers)

        with self.app.app_context():
            # Debe existir exactamente un registro con la nota actualizada
            califs = CalificacionBimestre.query.filter_by(
                estudiante_id=self.estudiante_id,
                indicador_id=self.ind2_id,
                numero_nota=3
            ).all()

            self.assertEqual(len(califs), 1)
            self.assertEqual(float(califs[0].nota), 4.2)
            self.assertEqual(califs[0].tarea_id, tarea_id)

    def test_calificar_tarea_sin_califica_bimestre_no_toca_calificaciones_bimestre(self):
        """Tarea sin vinculación bimestral califica la entrega pero no crea CalificacionBimestre"""
        headers = {'Authorization': f'Bearer {self.token_docente}'}

        payload = {
            'titulo': 'Actividad Libre',
            'fecha_vencimiento': (datetime.utcnow() + timedelta(days=2)).strftime('%Y-%m-%d'),
            'curso_id': self.curso_id,
            'materia_id': self.materia_id,
            'califica_bimestre': False
        }
        res_t = self.client.post('/api/docente/tareas', json=payload, headers=headers)
        tarea_id = json.loads(res_t.data)['data']['id']

        res_c = self.client.post(f'/api/docente/tareas/{tarea_id}/calificar', json={
            'estudiante_id': self.estudiante_id,
            'calificacion': 5.0
        }, headers=headers)
        self.assertEqual(res_c.status_code, 200)

        with self.app.app_context():
            califs = CalificacionBimestre.query.filter_by(tarea_id=tarea_id).all()
            self.assertEqual(len(califs), 0)


if __name__ == '__main__':
    unittest.main()
