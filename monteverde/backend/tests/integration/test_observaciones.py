import os
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-observaciones-monteverde-32bytes!'

from config import Config
Config.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
Config.SQLALCHEMY_ECHO = False

import unittest
import json
from datetime import date
from app import create_app
from src.extensions import db
from src.models.usuario import Usuario
from src.models.curso import Curso
from src.models.estudiante import Estudiante
from src.models.observacion import Observacion


class ObservacionesTestCase(unittest.TestCase):
    """Pruebas de integración para gestión y eliminación segura de observaciones."""

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key-observaciones-monteverde-32bytes!'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # Curso y Estudiante
            self.curso = Curso(nombre='Quinto A', nivel='5', letra='A')
            db.session.add(self.curso)
            db.session.flush()

            self.estudiante = Estudiante(nombre='Santiago Morales', curso_id=self.curso.id)
            db.session.add(self.estudiante)
            db.session.flush()

            # Docente 1 (Creador)
            self.docente1 = Usuario(
                nombre='Docente Carlos',
                email='carlos.docente@monteverde.edu.co',
                password='password123',
                rol='docente',
                activo=True
            )
            # Docente 2 (Ajeno)
            self.docente2 = Usuario(
                nombre='Docente María',
                email='maria.docente@monteverde.edu.co',
                password='password123',
                rol='docente',
                activo=True
            )
            # Administrador
            self.admin = Usuario(
                nombre='Admin Principal',
                email='admin@monteverde.edu.co',
                password='password123',
                rol='admin',
                activo=True
            )
            # Familia
            self.familia = Usuario(
                nombre='Familia Morales',
                email='familia.morales@monteverde.edu.co',
                password='password123',
                rol='familia',
                activo=True
            )

            db.session.add_all([self.docente1, self.docente2, self.admin, self.familia])
            db.session.flush()

            # Observación creada por Docente 1
            self.obs1 = Observacion(
                estudiante_id=self.estudiante.id,
                docente_id=self.docente1.id,
                fecha=date(2026, 8, 20),
                tipo='POSITIVA',
                detalle='Excelente participación en clase de matemáticas'
            )
            # Observación creada por Docente 2
            self.obs2 = Observacion(
                estudiante_id=self.estudiante.id,
                docente_id=self.docente2.id,
                fecha=date(2026, 8, 21),
                tipo='NEGATIVA',
                detalle='Llegada tardía recurrente'
            )

            db.session.add_all([self.obs1, self.obs2])
            db.session.commit()

            self.obs1_id = self.obs1.id
            self.obs2_id = self.obs2.id
            self.docente1_id = self.docente1.id

            # Tokens
            self.token_docente1 = self._login('carlos.docente@monteverde.edu.co', 'password123')
            self.token_docente2 = self._login('maria.docente@monteverde.edu.co', 'password123')
            self.token_admin = self._login('admin@monteverde.edu.co', 'password123')
            self.token_familia = self._login('familia.morales@monteverde.edu.co', 'password123')

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _login(self, email, password):
        res = self.client.post('/api/auth/login', json={'email': email, 'password': password})
        data = json.loads(res.data)
        return data.get('token')

    # ========================================================
    # Pruebas: DELETE /api/observaciones/<observacion_id>
    # ========================================================

    def test_docente_elimina_su_propia_observacion_exitoso(self):
        """Docente 1 elimina la observación 1 creada por él mismo -> 200 OK y se elimina de BD"""
        headers = {'Authorization': f'Bearer {self.token_docente1}'}
        res = self.client.delete(f'/api/observaciones/{self.obs1_id}', headers=headers)
        self.assertEqual(res.status_code, 200)

        data = json.loads(res.data)
        self.assertTrue(data['success'])
        self.assertIn('eliminada correctamente', data['message'])

        with self.app.app_context():
            obs = db.session.get(Observacion, self.obs1_id)
            self.assertIsNone(obs)

    def test_docente_intenta_eliminar_observacion_ajena_rechazado_403(self):
        """Docente 1 intenta eliminar observación creada por Docente 2 -> 403 Forbidden"""
        headers = {'Authorization': f'Bearer {self.token_docente1}'}
        res = self.client.delete(f'/api/observaciones/{self.obs2_id}', headers=headers)
        self.assertEqual(res.status_code, 403)

        data = json.loads(res.data)
        self.assertFalse(data['success'])
        self.assertIn('No tienes permisos', data['message'])

        # Verificar que la observación NO fue eliminada
        with self.app.app_context():
            obs = db.session.get(Observacion, self.obs2_id)
            self.assertIsNotNone(obs)

    def test_admin_elimina_cualquier_observacion_exitoso(self):
        """Administrador elimina observación creada por cualquier docente -> 200 OK"""
        headers = {'Authorization': f'Bearer {self.token_admin}'}
        res = self.client.delete(f'/api/observaciones/{self.obs2_id}', headers=headers)
        self.assertEqual(res.status_code, 200)

        data = json.loads(res.data)
        self.assertTrue(data['success'])

        with self.app.app_context():
            obs = db.session.get(Observacion, self.obs2_id)
            self.assertIsNone(obs)

    def test_eliminar_observacion_inexistente_retorna_404(self):
        """Eliminar observación con ID que no existe -> 404 Not Found"""
        headers = {'Authorization': f'Bearer {self.token_docente1}'}
        res = self.client.delete('/api/observaciones/99999', headers=headers)
        self.assertEqual(res.status_code, 404)

        data = json.loads(res.data)
        self.assertFalse(data['success'])
        self.assertIn('no encontrada', data['message'].lower())

    def test_rol_familia_intenta_eliminar_observacion_rechazado_403(self):
        """Usuario con rol 'familia' no tiene permiso para endpoint DELETE -> 403"""
        headers = {'Authorization': f'Bearer {self.token_familia}'}
        res = self.client.delete(f'/api/observaciones/{self.obs1_id}', headers=headers)
        self.assertEqual(res.status_code, 403)

    def test_eliminar_sin_token_rechazado_401(self):
        """Petición sin token JWT -> 401 Unauthorized"""
        res = self.client.delete(f'/api/observaciones/{self.obs1_id}')
        self.assertEqual(res.status_code, 401)


if __name__ == '__main__':
    unittest.main()
