import os
os.environ['JWT_SECRET_KEY'] = 'test-secret-key'
from config import Config
Config.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
Config.SQLALCHEMY_ECHO = False

import unittest
import json
from datetime import date, timedelta
from app import create_app
from src.extensions import db
from src.models.usuario import Usuario
from src.models.curso import Curso
from src.models.materia import Materia
from src.models.estudiante import Estudiante
from src.models.docente_asignacion import DocenteAsignacion
from src.models.indicador_logro import IndicadorLogro
from src.models.bimestre import Bimestre
from src.models.calendario_academico import CalendarioAcademico
from src.services.calendario_service import CalendarioService
from src.services.configuracion_evaluacion_service import ConfiguracionEvaluacionService

class CalendarioPeriodosTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            db.create_all()

    @classmethod
    def tearDownClass(cls):
        with cls.app.app_context():
            db.session.remove()
            db.drop_all()

    def setUp(self):
        with self.app.app_context():
            # Limpiar datos
            db.session.query(IndicadorLogro).delete()
            db.session.query(DocenteAsignacion).delete()
            db.session.query(Estudiante).delete()
            db.session.query(Curso).delete()
            db.session.query(Materia).delete()
            db.session.query(Bimestre).delete()
            db.session.query(CalendarioAcademico).delete()
            db.session.query(Usuario).delete()
            db.session.commit()

            # 1. Usuarios
            self.coordinador = Usuario(
                nombre='Coordinador Test',
                email='coordinador.cal@monteverde.edu.co',
                rol='coordinador',
                activo=True
            )
            self.coordinador.set_password('coord123')
            db.session.add(self.coordinador)

            self.docente = Usuario(
                nombre='Docente Test',
                email='docente.cal@monteverde.edu.co',
                rol='docente',
                activo=True
            )
            self.docente.set_password('doc123')
            db.session.add(self.docente)

            # 2. Entorno académico básico
            self.curso = Curso(nombre='Quinto A', nivel='5°', letra='A')
            db.session.add(self.curso)

            self.materia = Materia(nombre='Matemáticas Avanzadas', codigo='MAT-501', area='Ciencias', intensidad_horaria=5)
            db.session.add(self.materia)
            db.session.flush()

            self.estudiante = Estudiante(nombre='Pepito Pérez', curso_id=self.curso.id)
            db.session.add(self.estudiante)

            self.asignacion = DocenteAsignacion(
                docente_id=self.docente.id,
                curso_id=self.curso.id,
                materia_id=self.materia.id
            )
            db.session.add(self.asignacion)

            # 3. Calendario y Periodos
            self.cal = CalendarioService.get_or_create_calendario(2026)
            ConfiguracionEvaluacionService.get_or_create_default(2026)

            self.periodo1 = Bimestre.query.filter_by(anio=2026, orden=1).first()
            self.periodo1.estado = 'ABIERTO'
            self.periodo1.fecha_cierre_calificaciones = date.today() + timedelta(days=10)

            db.session.commit()

            # Guardar IDs
            self.coord_id = self.coordinador.id
            self.docente_id = self.docente.id
            self.periodo1_id = self.periodo1.id
            self.estudiante_id = self.estudiante.id
            self.curso_id = self.curso.id
            self.materia_id = self.materia.id

    def _login(self, email, password):
        res = self.client.post('/api/auth/login', json={
            'email': email,
            'password': password
        })
        data = res.get_json()
        return data.get('token')

    def test_01_coordinador_consultar_calendario(self):
        """El coordinador puede consultar el calendario académico con sus periodos."""
        token = self._login('coordinador.cal@monteverde.edu.co', 'coord123')
        headers = {'Authorization': f'Bearer {token}'}

        res = self.client.get('/api/calendario/?anio=2026', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['anio'], 2026)
        self.assertEqual(len(data['data']['periodos']), 4)

    def test_02_coordinador_cambiar_estado_periodo(self):
        """El coordinador puede cerrar y aperturar un periodo de evaluación."""
        token = self._login('coordinador.cal@monteverde.edu.co', 'coord123')
        headers = {'Authorization': f'Bearer {token}'}

        # Cerrar periodo 1
        res = self.client.patch(
            f'/api/calendario/periodos/{self.periodo1_id}/estado',
            json={'estado': 'CERRADO'},
            headers=headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['estado'], 'CERRADO')
        self.assertFalse(data['data']['permite_calificaciones'])

        # Reabrir periodo 1
        res_reabrir = self.client.patch(
            f'/api/calendario/periodos/{self.periodo1_id}/estado',
            json={'estado': 'ABIERTO'},
            headers=headers
        )
        self.assertEqual(res_reabrir.status_code, 200)
        data_reabrir = res_reabrir.get_json()
        self.assertEqual(data_reabrir['data']['estado'], 'ABIERTO')
        self.assertTrue(data_reabrir['data']['permite_calificaciones'])

    def test_03_docente_no_puede_cambiar_estado_periodo(self):
        """Un docente no tiene permisos para aperturar o cerrar periodos (403)."""
        token = self._login('docente.cal@monteverde.edu.co', 'doc123')
        headers = {'Authorization': f'Bearer {token}'}

        res = self.client.patch(
            f'/api/calendario/periodos/{self.periodo1_id}/estado',
            json={'estado': 'CERRADO'},
            headers=headers
        )
        self.assertEqual(res.status_code, 403)

    def test_04_docente_puede_calificar_en_periodo_abierto(self):
        """El docente puede registrar calificaciones si el periodo está ABIERTO y vigente."""
        with self.app.app_context():
            ind = IndicadorLogro(
                bimestre_id=self.periodo1_id,
                curso_id=self.curso_id,
                materia_id=self.materia_id,
                docente_id=self.docente_id,
                numero=1,
                descripcion='Comprende funciones y matrices'
            )
            db.session.add(ind)
            db.session.commit()
            ind_id = ind.id

        token = self._login('docente.cal@monteverde.edu.co', 'doc123')
        headers = {'Authorization': f'Bearer {token}'}

        payload = {
            'notas': [{
                'estudianteId': self.estudiante_id,
                'indicadorId': ind_id,
                'numeroNota': 1,
                'nota': 4.5
            }]
        }

        res = self.client.post('/api/calificaciones-bimestre/guardar', json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['guardadas'], 1)

    def test_05_docente_bloqueado_si_periodo_esta_cerrado(self):
        """El sistema bloquea con 403 si el coordinador cerró el periodo de evaluación."""
        with self.app.app_context():
            ind = IndicadorLogro(
                bimestre_id=self.periodo1_id,
                curso_id=self.curso_id,
                materia_id=self.materia_id,
                docente_id=self.docente_id,
                numero=1,
                descripcion='Comprende funciones'
            )
            db.session.add(ind)
            # Cerrar el periodo
            bim = Bimestre.query.get(self.periodo1_id)
            bim.estado = 'CERRADO'
            db.session.commit()
            ind_id = ind.id

        token = self._login('docente.cal@monteverde.edu.co', 'doc123')
        headers = {'Authorization': f'Bearer {token}'}

        payload = {
            'notas': [{
                'estudianteId': self.estudiante_id,
                'indicadorId': ind_id,
                'numeroNota': 1,
                'nota': 4.0
            }]
        }

        res = self.client.post('/api/calificaciones-bimestre/guardar', json=payload, headers=headers)
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertFalse(data['success'])
        self.assertIn('CERRADO', data['message'])

    def test_06_docente_bloqueado_si_fecha_limite_vencio(self):
        """El sistema bloquea con 403 si la fecha límite de calificaciones ya venció."""
        with self.app.app_context():
            ind = IndicadorLogro(
                bimestre_id=self.periodo1_id,
                curso_id=self.curso_id,
                materia_id=self.materia_id,
                docente_id=self.docente_id,
                numero=1,
                descripcion='Comprende ecuaciones'
            )
            db.session.add(ind)
            # Mantener ABIERTO pero con fecha de cierre en el pasado
            bim = Bimestre.query.get(self.periodo1_id)
            bim.estado = 'ABIERTO'
            bim.fecha_cierre_calificaciones = date.today() - timedelta(days=2)
            db.session.commit()
            ind_id = ind.id

        token = self._login('docente.cal@monteverde.edu.co', 'doc123')
        headers = {'Authorization': f'Bearer {token}'}

        payload = {
            'notas': [{
                'estudianteId': self.estudiante_id,
                'indicadorId': ind_id,
                'numeroNota': 1,
                'nota': 4.0
            }]
        }

        res = self.client.post('/api/calificaciones-bimestre/guardar', json=payload, headers=headers)
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertFalse(data['success'])
        self.assertIn('venció', data['message'])

if __name__ == '__main__':
    unittest.main()
