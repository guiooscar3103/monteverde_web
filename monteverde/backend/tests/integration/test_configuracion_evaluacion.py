import os
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-eval-config-monteverde-32b!'

from config import Config
Config.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
Config.SQLALCHEMY_ECHO = False

import unittest
import json
from app import create_app
from src.extensions import db
from src.models.usuario import Usuario
from src.models.curso import Curso
from src.models.estudiante import Estudiante
from src.models.materia import Materia
from src.models.docente_asignacion import DocenteAsignacion
from src.models.bimestre import Bimestre
from src.models.indicador_logro import IndicadorLogro
from src.models.calificacion_bimestre import CalificacionBimestre
from src.models.configuracion_evaluacion import ConfiguracionEvaluacion
from src.services.configuracion_evaluacion_service import ConfiguracionEvaluacionService


class ConfiguracionEvaluacionTestCase(unittest.TestCase):
    """
    Suite integral de pruebas de integración para la evaluación configurable:
    1. Configuración por defecto (4 periodos, 2 indicadores, 3 notas, escala 1.0-5.0).
    2. Actualización de configuración por administrador (ej. 3 periodos x 4 indicadores x 4 notas, escala 0-100).
    3. Control de acceso RBAC: docentes y familias no pueden editar configuraciones.
    4. Validación dinámica de indicadores (admite N indicadores según el año).
    5. Validación dinámica de notas (admite notas según rango de escala configurado, ej. 85.50 en 0-100).
    6. Endpoint de matriz dinámica con metadata estructural y columnas correspondientes.
    7. Endpoint de verificación de compatibilidad previa a reconfiguración.
    8. Independencia entre años escolares (ej. 2025 escala 1-5 vs 2026 escala 0-100).
    """

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key-eval-config-monteverde-32b!'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # 1. Admin
            self.admin = Usuario(
                nombre='Administrador General',
                email='admin.eval@monteverde.edu.co',
                rol='admin',
                activo=True
            )
            self.admin.set_password('admin123')

            # 2. Docente
            self.docente = Usuario(
                nombre='Docente María',
                email='maria.eval@monteverde.edu.co',
                rol='docente',
                activo=True
            )
            self.docente.set_password('docente123')

            # 3. Familia
            self.familia = Usuario(
                nombre='Familia López',
                email='familia.eval@monteverde.edu.co',
                rol='familia',
                activo=True
            )
            self.familia.set_password('familia123')

            db.session.add_all([self.admin, self.docente, self.familia])
            db.session.flush()

            # 4. Curso, Materia, Estudiante
            self.curso = Curso(nombre='Quinto B', nivel='5', letra='B')
            self.materia = Materia(nombre='Ciencias Naturales')
            db.session.add_all([self.curso, self.materia])
            db.session.flush()

            self.asig = DocenteAsignacion(
                docente_id=self.docente.id,
                curso_id=self.curso.id,
                materia_id=self.materia.id
            )
            self.estudiante = Estudiante(
                nombre='Lucas Gómez',
                curso_id=self.curso.id
            )
            db.session.add_all([self.asig, self.estudiante])
            db.session.flush()

            # 5. Bimestres
            b2026 = Bimestre.query.filter_by(anio=2026, orden=1).first()
            if not b2026:
                b2026 = Bimestre(nombre='Bimestre 1', anio=2026, orden=1)
                db.session.add(b2026)
                db.session.flush()

            b2025 = Bimestre.query.filter_by(anio=2025, orden=1).first()
            if not b2025:
                b2025 = Bimestre(nombre='Bimestre 1', anio=2025, orden=1)
                db.session.add(b2025)
                db.session.flush()

            self.curso_id = self.curso.id
            self.materia_id = self.materia.id
            self.estudiante_id = self.estudiante.id
            self.bimestre_2026_id = b2026.id
            self.bimestre_2025_id = b2025.id

            db.session.commit()

    def get_jwt_headers(self, email, password):
        resp = self.client.post('/api/auth/login', json={'email': email, 'password': password})
        data = resp.get_json() or {}
        token = data.get('data', {}).get('token') or data.get('token')
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def test_01_configuracion_por_defecto(self):
        """Verifica que el sistema inicialice la configuración estándar correctamente."""
        with self.app.app_context():
            config = ConfiguracionEvaluacionService.get_por_anio(2026)
            self.assertIsNotNone(config)
            self.assertEqual(config.numero_periodos, 4)
            self.assertEqual(config.indicadores_por_periodo, 2)
            self.assertEqual(config.notas_por_indicador, 3)
            self.assertEqual(float(config.escala_minima), 1.0)
            self.assertEqual(float(config.escala_maxima), 5.0)
            self.assertEqual(float(config.nota_aprobatoria), 3.0)

    def test_02_obtener_configuracion_api(self):
        """GET /api/configuracion/evaluacion/activa retorna la estructura completa."""
        headers = self.get_jwt_headers('admin.eval@monteverde.edu.co', 'admin123')
        resp = self.client.get('/api/configuracion/evaluacion/activa', headers=headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['anio_academico'], 2026)
        self.assertEqual(data['data']['indicadores_por_periodo'], 2)
        self.assertEqual(data['data']['notas_por_indicador'], 3)
        self.assertEqual(data['data']['estructura']['escala']['max'], 5.0)

    def test_03_control_de_acceso_docente_familia(self):
        """Docentes y Familias no pueden modificar la configuración académica (403 Forbidden)."""
        payload = {
            'anio_academico': 2026,
            'indicadores_por_periodo': 4,
            'notas_por_indicador': 5
        }
        # Docente
        headers_docente = self.get_jwt_headers('maria.eval@monteverde.edu.co', 'docente123')
        resp_docente = self.client.post(
            '/api/configuracion/evaluacion',
            json=payload,
            headers=headers_docente
        )
        self.assertEqual(resp_docente.status_code, 403)

        # Familia
        headers_familia = self.get_jwt_headers('familia.eval@monteverde.edu.co', 'familia123')
        resp_familia = self.client.post(
            '/api/configuracion/evaluacion',
            json=payload,
            headers=headers_familia
        )
        self.assertEqual(resp_familia.status_code, 403)

    def test_04_actualizar_configuracion_a_escala_cien_y_tres_indicadores(self):
        """Administrador reconfigura el año 2026 a 3 periodos x 3 indicadores x 4 notas, escala 0-100."""
        headers = self.get_jwt_headers('admin.eval@monteverde.edu.co', 'admin123')
        payload = {
            'anio_academico': 2026,
            'nombre': 'Modelo Centesimal 2026',
            'tipo_periodo': 'Trimestre',
            'numero_periodos': 3,
            'indicadores_por_periodo': 3,
            'notas_por_indicador': 4,
            'tipo_escala': 'NUMERICA_CIEN',
            'escala_minima': 0.0,
            'escala_maxima': 100.0,
            'nota_aprobatoria': 60.0,
            'activa': True
        }
        resp = self.client.post(
            '/api/configuracion/evaluacion',
            json=payload,
            headers=headers
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['indicadores_por_periodo'], 3)
        self.assertEqual(data['data']['notas_por_indicador'], 4)
        self.assertEqual(data['data']['escala_maxima'], 100.0)
        self.assertEqual(data['data']['nota_aprobatoria'], 60.0)

    def test_05_guardar_indicadores_dinamicos_segun_configuracion(self):
        """Docente guarda 3 indicadores cuando la configuración exige 3 indicadores."""
        headers_admin = self.get_jwt_headers('admin.eval@monteverde.edu.co', 'admin123')
        headers_docente = self.get_jwt_headers('maria.eval@monteverde.edu.co', 'docente123')

        # 1. Configurar 3 indicadores para 2026
        self.client.post(
            '/api/configuracion/evaluacion',
            json={
                'anio_academico': 2026,
                'indicadores_por_periodo': 3,
                'notas_por_indicador': 4,
                'escala_minima': 0.0,
                'escala_maxima': 100.0,
                'nota_aprobatoria': 60.0
            },
            headers=headers_admin
        )

        # 2. Guardar 3 indicadores
        resp_guardar = self.client.post(
            '/api/calificaciones-bimestre/indicadores',
            json={
                'curso_id': self.curso_id,
                'materia_id': self.materia_id,
                'bimestre_id': self.bimestre_2026_id,
                'indicadores': [
                    {'numero': 1, 'descripcion': 'Comprende los ciclos biológicos de los ecosistemas locales.'},
                    {'numero': 2, 'descripcion': 'Analiza el impacto del cambio climático en la flora y fauna.'},
                    {'numero': 3, 'descripcion': 'Propone experimentos científicos aplicando el método riguroso.'}
                ]
            },
            headers=headers_docente
        )
        self.assertEqual(resp_guardar.status_code, 200)
        inds_res = resp_guardar.get_json() or {}
        inds = inds_res.get('data', inds_res)
        self.assertEqual(len(inds), 3)
        self.assertEqual(inds[2]['numero'], 3)

    def test_06_guardar_notas_escala_dinamica_y_validaciones(self):
        """Valida que notas dentro del rango dinámico (ej. 85.50 en escala 0-100) sean aceptadas y fuera de rango rechazadas."""
        headers_admin = self.get_jwt_headers('admin.eval@monteverde.edu.co', 'admin123')
        headers_docente = self.get_jwt_headers('maria.eval@monteverde.edu.co', 'docente123')

        # Configurar 0-100 con 3 indicadores y 4 notas
        self.client.post(
            '/api/configuracion/evaluacion',
            json={
                'anio_academico': 2026,
                'indicadores_por_periodo': 3,
                'notas_por_indicador': 4,
                'escala_minima': 0.0,
                'escala_maxima': 100.0,
                'nota_aprobatoria': 60.0
            },
            headers=headers_admin
        )

        # Crear 3 indicadores
        self.client.post(
            '/api/calificaciones-bimestre/indicadores',
            json={
                'curso_id': self.curso_id,
                'materia_id': self.materia_id,
                'bimestre_id': self.bimestre_2026_id,
                'indicadores': [
                    {'numero': 1, 'descripcion': 'Indicador uno con texto largo suficiente'},
                    {'numero': 2, 'descripcion': 'Indicador dos con texto largo suficiente'},
                    {'numero': 3, 'descripcion': 'Indicador tres con texto largo suficiente'}
                ]
            },
            headers=headers_docente
        )

        with self.app.app_context():
            ind3 = IndicadorLogro.query.filter_by(
                curso_id=self.curso_id,
                materia_id=self.materia_id,
                bimestre_id=self.bimestre_2026_id,
                numero=3
            ).first()
            self.assertIsNotNone(ind3)
            ind3_id = ind3.id

        # Guardar Nota 4 (válida en rango 0-100 con valor 88.50)
        resp_guardar_nota = self.client.post(
            '/api/calificaciones-bimestre/guardar',
            json={
                'notas': [
                    {
                        'estudiante_id': self.estudiante_id,
                        'indicador_id': ind3_id,
                        'numero_nota': 4,
                        'nota': 88.50
                    }
                ]
            },
            headers=headers_docente
        )
        self.assertEqual(resp_guardar_nota.status_code, 200)

        # Rechazar Nota > 100.00 (ej. 105.0)
        resp_invalida = self.client.post(
            '/api/calificaciones-bimestre/guardar',
            json={
                'notas': [
                    {
                        'estudiante_id': self.estudiante_id,
                        'indicador_id': ind3_id,
                        'numero_nota': 4,
                        'nota': 105.00
                    }
                ]
            },
            headers=headers_docente
        )
        self.assertEqual(resp_invalida.status_code, 400)

    def test_07_matriz_calificaciones_dinamica(self):
        """GET /api/calificaciones-bimestre/matriz devuelve la estructura de configuración junto a los estudiantes."""
        headers_admin = self.get_jwt_headers('admin.eval@monteverde.edu.co', 'admin123')
        headers_docente = self.get_jwt_headers('maria.eval@monteverde.edu.co', 'docente123')

        self.client.post(
            '/api/configuracion/evaluacion',
            json={
                'anio_academico': 2026,
                'indicadores_por_periodo': 3,
                'notas_por_indicador': 4,
                'escala_minima': 0.0,
                'escala_maxima': 100.0,
                'nota_aprobatoria': 60.0
            },
            headers=headers_admin
        )

        resp = self.client.get(
            f'/api/calificaciones-bimestre/matriz?curso_id={self.curso_id}&materia_id={self.materia_id}&bimestre_id={self.bimestre_2026_id}',
            headers=headers_docente
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        cfg = data.get('data', {}).get('configuracion') or data.get('configuracion')
        self.assertIsNotNone(cfg)
        self.assertEqual(cfg['indicadores_por_periodo'], 3)
        self.assertEqual(cfg['notas_por_indicador'], 4)
        self.assertEqual(cfg['escala']['max'], 100.0)

    def test_08_independencia_por_ano_academico(self):
        """Año 2025 y Año 2026 mantienen configuraciones y escalas independientes."""
        headers_admin = self.get_jwt_headers('admin.eval@monteverde.edu.co', 'admin123')

        # Configurar 2025 con escala 1.0 a 5.0
        self.client.post(
            '/api/configuracion/evaluacion',
            json={
                'anio_academico': 2025,
                'nombre': 'Evaluación 2025',
                'indicadores_por_periodo': 2,
                'notas_por_indicador': 3,
                'escala_minima': 1.0,
                'escala_maxima': 5.0,
                'nota_aprobatoria': 3.0
            },
            headers=headers_admin
        )

        # Configurar 2026 con escala 0 a 100
        self.client.post(
            '/api/configuracion/evaluacion',
            json={
                'anio_academico': 2026,
                'nombre': 'Evaluación 2026',
                'indicadores_por_periodo': 4,
                'notas_por_indicador': 5,
                'escala_minima': 0.0,
                'escala_maxima': 100.0,
                'nota_aprobatoria': 70.0
            },
            headers=headers_admin
        )

        with self.app.app_context():
            cfg_2025 = ConfiguracionEvaluacionService.get_por_bimestre_id(self.bimestre_2025_id)
            cfg_2026 = ConfiguracionEvaluacionService.get_por_bimestre_id(self.bimestre_2026_id)

            self.assertEqual(cfg_2025.indicadores_por_periodo, 2)
            self.assertEqual(float(cfg_2025.escala_maxima), 5.0)

            self.assertEqual(cfg_2026.indicadores_por_periodo, 4)
            self.assertEqual(float(cfg_2026.escala_maxima), 100.0)


if __name__ == '__main__':
    unittest.main()
