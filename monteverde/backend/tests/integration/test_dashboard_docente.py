import os
os.environ['JWT_SECRET_KEY'] = 'test-secret-key'

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
from src.models.mensaje import Mensaje


class DashboardDocenteTestCase(unittest.TestCase):
    """Tests para el endpoint GET /api/docente/dashboard.

    Valida:
    - Tareas pendientes devueltas como lista vacía (sin datos hardcoded).
    - Cursos filtrados por asignaciones del docente autenticado.
    - Aislamiento: un docente no ve datos de otro.
    - Autenticación requerida (401 sin token).
    - Autorización por rol (403 para no-docentes).
    - Regresión: métricas existentes (cursos, mensajes, estadísticas) siguen funcionando.
    """

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # --- Cursos ---
            self.curso_5a = Curso(nombre='Quinto A', nivel='5', letra='A')
            self.curso_7b = Curso(nombre='Séptimo B', nivel='7', letra='B')
            db.session.add_all([self.curso_5a, self.curso_7b])
            db.session.flush()

            # --- Materias ---
            self.mat_mate = Materia(nombre='Matemáticas')
            self.mat_ciencias = Materia(nombre='Ciencias')
            db.session.add_all([self.mat_mate, self.mat_ciencias])
            db.session.flush()

            # --- Estudiantes ---
            self.est1 = Estudiante(nombre='Estudiante Uno', curso_id=self.curso_5a.id)
            self.est2 = Estudiante(nombre='Estudiante Dos', curso_id=self.curso_7b.id)
            db.session.add_all([self.est1, self.est2])
            db.session.flush()

            # --- Docente 1 ---
            self.docente1 = Usuario(
                nombre='Docente Primero',
                email='docente1@monteverde.com',
                rol='docente',
                activo=True,
                eliminado=False
            )
            self.docente1.set_password('password123')
            db.session.add(self.docente1)
            db.session.flush()

            # --- Docente 2 ---
            self.docente2 = Usuario(
                nombre='Docente Segundo',
                email='docente2@monteverde.com',
                rol='docente',
                activo=True,
                eliminado=False
            )
            self.docente2.set_password('password123')
            db.session.add(self.docente2)
            db.session.flush()

            # --- Usuario familia (no docente) ---
            self.familia = Usuario(
                nombre='Familia Test',
                email='familiagonzalez@monteverde.com',
                rol='familia',
                activo=True,
                eliminado=False
            )
            self.familia.set_password('password123')
            db.session.add(self.familia)
            db.session.flush()

            # --- Asignaciones ---
            # Docente 1 → Curso 5A + Matemáticas
            asig1 = DocenteAsignacion(
                docente_id=self.docente1.id,
                curso_id=self.curso_5a.id,
                materia_id=self.mat_mate.id
            )
            # Docente 2 → Curso 7B + Ciencias
            asig2 = DocenteAsignacion(
                docente_id=self.docente2.id,
                curso_id=self.curso_7b.id,
                materia_id=self.mat_ciencias.id
            )
            db.session.add_all([asig1, asig2])

            # --- Mensaje no leído para docente1 ---
            msg = Mensaje(
                emisor_id=self.familia.id,
                receptor_id=self.docente1.id,
                asunto='Consulta',
                cuerpo='Hola docente',
                leido=False
            )
            db.session.add(msg)

            db.session.commit()

            # Guardar IDs
            self.docente1_id = self.docente1.id
            self.docente2_id = self.docente2.id
            self.curso_5a_id = self.curso_5a.id
            self.curso_7b_id = self.curso_7b.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _get_jwt_headers(self, email, password):
        """Login y obtener headers con JWT."""
        response = self.client.post('/api/auth/login', json={
            'email': email,
            'password': password
        })
        data = json.loads(response.data.decode('utf-8'))
        token = data.get('token')
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    # =========================================================
    # A. Tareas pendientes vacías (sin datos hardcoded)
    # =========================================================

    def test_tareas_pendientes_vacias(self):
        """Las tareas pendientes deben ser una lista vacía, nunca datos hardcoded."""
        headers = self._get_jwt_headers('docente1@monteverde.com', 'password123')
        response = self.client.get('/api/docente/dashboard', headers=headers)
        data = json.loads(response.data.decode('utf-8'))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['tareas_pendientes'], [])
        self.assertEqual(data['data']['total_tareas_pendientes'], 0)

    def test_tareas_no_contiene_datos_ficticios(self):
        """Verificar que no se devuelvan datos ficticios como 'Registrar asistencia' o 'Calificar tareas'."""
        headers = self._get_jwt_headers('docente1@monteverde.com', 'password123')
        response = self.client.get('/api/docente/dashboard', headers=headers)
        raw = response.data.decode('utf-8')

        # Los datos hardcoded antiguos no deben aparecer
        self.assertNotIn('Registrar asistencia', raw)
        self.assertNotIn('Calificar tareas de Matemáticas', raw)
        self.assertNotIn('Enviar boletines', raw)
        self.assertNotIn('7°B', raw)
        self.assertNotIn('8°A', raw)

    # =========================================================
    # B. Aislamiento por docente — cursos filtrados
    # =========================================================

    def test_docente1_ve_solo_sus_cursos(self):
        """Docente 1 solo debe ver el curso 5A (su asignación), no el 7B."""
        headers = self._get_jwt_headers('docente1@monteverde.com', 'password123')
        response = self.client.get('/api/docente/dashboard', headers=headers)
        data = json.loads(response.data.decode('utf-8'))

        cursos = data['data']['cursos']
        curso_ids = [c['id'] for c in cursos]
        self.assertIn(self.curso_5a_id, curso_ids)
        self.assertNotIn(self.curso_7b_id, curso_ids)

    def test_docente2_ve_solo_sus_cursos(self):
        """Docente 2 solo debe ver el curso 7B (su asignación), no el 5A."""
        headers = self._get_jwt_headers('docente2@monteverde.com', 'password123')
        response = self.client.get('/api/docente/dashboard', headers=headers)
        data = json.loads(response.data.decode('utf-8'))

        cursos = data['data']['cursos']
        curso_ids = [c['id'] for c in cursos]
        self.assertIn(self.curso_7b_id, curso_ids)
        self.assertNotIn(self.curso_5a_id, curso_ids)

    # =========================================================
    # C. Protección contra acceso cruzado
    # =========================================================

    def test_no_acepta_docente_id_en_url(self):
        """La ruta antigua con docente_id en URL debe retornar 404 (ya no existe)."""
        headers = self._get_jwt_headers('docente1@monteverde.com', 'password123')
        response = self.client.get(f'/api/docente/dashboard/{self.docente2_id}', headers=headers)
        # La ruta antigua ya no existe, debe dar 404
        self.assertIn(response.status_code, [404, 405])

    # =========================================================
    # D. Autenticación — sin token
    # =========================================================

    def test_sin_autenticacion_401(self):
        """Una petición sin token JWT debe ser rechazada con 401."""
        response = self.client.get('/api/docente/dashboard')
        self.assertEqual(response.status_code, 401)

    # =========================================================
    # E. Autorización — rol incorrecto
    # =========================================================

    def test_rol_familia_403(self):
        """Un usuario con rol 'familia' no puede acceder al dashboard docente."""
        headers = self._get_jwt_headers('familiagonzalez@monteverde.com', 'password123')
        response = self.client.get('/api/docente/dashboard', headers=headers)
        self.assertEqual(response.status_code, 403)

    # =========================================================
    # F. Regresión — métricas del dashboard
    # =========================================================

    def test_estructura_completa_respuesta(self):
        """La respuesta debe contener todas las propiedades esperadas del dashboard."""
        headers = self._get_jwt_headers('docente1@monteverde.com', 'password123')
        response = self.client.get('/api/docente/dashboard', headers=headers)
        data = json.loads(response.data.decode('utf-8'))

        self.assertTrue(data['success'])
        payload = data['data']

        # Verificar estructura completa
        self.assertIn('cursos', payload)
        self.assertIn('mensajes_pendientes', payload)
        self.assertIn('tareas_pendientes', payload)
        self.assertIn('total_tareas_pendientes', payload)
        self.assertIn('estadisticas', payload)

        # Verificar estadísticas
        stats = payload['estadisticas']
        self.assertIn('total_cursos', stats)
        self.assertIn('mensajes_no_leidos', stats)
        self.assertIn('estudiantes_total', stats)

    def test_mensajes_del_docente_correcto(self):
        """Los mensajes no leídos deben pertenecer al docente autenticado."""
        headers = self._get_jwt_headers('docente1@monteverde.com', 'password123')
        response = self.client.get('/api/docente/dashboard', headers=headers)
        data = json.loads(response.data.decode('utf-8'))

        # Docente 1 tiene un mensaje no leído
        self.assertEqual(data['data']['estadisticas']['mensajes_no_leidos'], 1)

        # Docente 2 no tiene mensajes
        headers2 = self._get_jwt_headers('docente2@monteverde.com', 'password123')
        response2 = self.client.get('/api/docente/dashboard', headers=headers2)
        data2 = json.loads(response2.data.decode('utf-8'))
        self.assertEqual(data2['data']['estadisticas']['mensajes_no_leidos'], 0)

    def test_conteo_estudiantes_por_curso(self):
        """El conteo de estudiantes debe reflejar solo los cursos del docente."""
        headers = self._get_jwt_headers('docente1@monteverde.com', 'password123')
        response = self.client.get('/api/docente/dashboard', headers=headers)
        data = json.loads(response.data.decode('utf-8'))

        # Docente 1 tiene curso 5A con 1 estudiante
        self.assertEqual(data['data']['estadisticas']['estudiantes_total'], 1)
        self.assertEqual(data['data']['estadisticas']['total_cursos'], 1)


if __name__ == '__main__':
    unittest.main()
