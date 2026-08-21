import os
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-retractar-monteverde-32bytes!'

from config import Config
Config.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
Config.SQLALCHEMY_ECHO = False

import unittest
import json
from app import create_app
from src.extensions import db
from src.models.usuario import Usuario
from src.models.mensaje import Mensaje


class MensajesRetractarTestCase(unittest.TestCase):
    """
    Suite de pruebas de integración para la retractación / eliminación lógica de mensajes:
    1. Docente retracta su propio mensaje enviado -> éxito 200, eliminado=True, cuerpo enmascarado.
    2. Docente intenta retractar mensaje enviado por Familia -> 403 Forbidden.
    3. Familia retracta su propio mensaje enviado -> éxito 200.
    4. Familia intenta retractar mensaje enviado por Docente -> 403 Forbidden.
    5. Intento de retractar mensaje inexistente -> 404 Not Found.
    6. Intento de retractar sin autenticación JWT -> 401 Unauthorized.
    7. Intento de retractar mensaje ya retractado -> respuesta idempotente 200.
    8. Administrador puede retractar mensaje de cualquier usuario -> 200 OK.
    9. Integridad de BD: no hay eliminación física (db.session.delete).
    10. Serialización en conversación: el mensaje retractado mantiene orden y oculta contenido original.
    """

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key-retractar-monteverde-32bytes!'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # Usuarios de prueba
            self.docente = Usuario(
                nombre='Profesor Carlos Pérez',
                email='docente_retract@monteverde.com',
                rol='docente',
                activo=True
            )
            self.docente.set_password('docente123')

            self.familia = Usuario(
                nombre='Familia Gómez',
                email='familia_retract@monteverde.com',
                rol='familia',
                activo=True
            )
            self.familia.set_password('familia123')

            self.admin = Usuario(
                nombre='Administrador General',
                email='admin_retract@monteverde.com',
                rol='admin',
                activo=True
            )
            self.admin.set_password('admin123')

            db.session.add_all([self.docente, self.familia, self.admin])
            db.session.flush()

            # Mensajes de prueba
            self.msg_docente_a_familia = Mensaje(
                emisor_id=self.docente.id,
                receptor_id=self.familia.id,
                asunto='Reporte de comportamiento',
                cuerpo='El estudiante tuvo un excelente desempeño hoy en clase.',
                leido=False
            )
            self.msg_familia_a_docente = Mensaje(
                emisor_id=self.familia.id,
                receptor_id=self.docente.id,
                asunto='Consulta sobre tareas',
                cuerpo='¿Podría confirmar si hay entrega mañana?',
                leido=False
            )

            db.session.add_all([self.msg_docente_a_familia, self.msg_familia_a_docente])
            db.session.commit()

            self.docente_id = self.docente.id
            self.familia_id = self.familia.id
            self.admin_id = self.admin.id
            self.msg_docente_id = self.msg_docente_a_familia.id
            self.msg_familia_id = self.msg_familia_a_docente.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _login(self, email, password):
        res = self.client.post('/api/auth/login', json={'email': email, 'password': password})
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        return data['token']

    def test_docente_retracta_mensaje_propio_exitosamente(self):
        """Docente retracta su propio mensaje con éxito (200 OK, eliminado=True, cuerpo enmascarado)."""
        token = self._login('docente_retract@monteverde.com', 'docente123')
        res = self.client.delete(
            f'/api/mensajes/{self.msg_docente_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['message'], 'Mensaje retractado exitosamente')
        self.assertTrue(data['data']['eliminado'])
        self.assertEqual(data['data']['cuerpo'], '🚫 Este mensaje fue eliminado por su remitente.')
        self.assertIsNotNone(data['data']['fecha_eliminacion'])

        # Verificar en base de datos que el registro persiste lógicamente (no eliminado físicamente)
        with self.app.app_context():
            msg = db.session.get(Mensaje, self.msg_docente_id)
            self.assertIsNotNone(msg)
            self.assertTrue(msg.eliminado)
            self.assertIsNotNone(msg.fecha_eliminacion)

    def test_docente_no_puede_retractar_mensaje_de_familia_retorna_403(self):
        """Docente intenta retractar un mensaje recibido de una familia y recibe 403 Forbidden."""
        token = self._login('docente_retract@monteverde.com', 'docente123')
        res = self.client.delete(
            f'/api/mensajes/{self.msg_familia_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(res.status_code, 403)
        data = json.loads(res.data)
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'No tienes permisos para eliminar este mensaje')

    def test_familia_retracta_mensaje_propio_exitosamente(self):
        """Familia retracta su propio mensaje con éxito (200 OK)."""
        token = self._login('familia_retract@monteverde.com', 'familia123')
        res = self.client.delete(
            f'/api/mensajes/{self.msg_familia_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data['success'])
        self.assertTrue(data['data']['eliminado'])
        self.assertEqual(data['data']['cuerpo'], '🚫 Este mensaje fue eliminado por su remitente.')

    def test_familia_no_puede_retractar_mensaje_de_docente_retorna_403(self):
        """Familia intenta retractar un mensaje recibido de un docente y recibe 403 Forbidden."""
        token = self._login('familia_retract@monteverde.com', 'familia123')
        res = self.client.delete(
            f'/api/mensajes/{self.msg_docente_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(res.status_code, 403)
        data = json.loads(res.data)
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'No tienes permisos para eliminar este mensaje')

    def test_retractar_mensaje_inexistente_retorna_404(self):
        """Intentar retractar un mensaje inexistente retorna 404 Not Found."""
        token = self._login('docente_retract@monteverde.com', 'docente123')
        res = self.client.delete(
            '/api/mensajes/999999',
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(res.status_code, 404)
        data = json.loads(res.data)
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'Mensaje no encontrado')

    def test_retractar_sin_autenticacion_retorna_401(self):
        """Petición sin token JWT es rechazada con 401 Unauthorized."""
        res = self.client.delete(f'/api/mensajes/{self.msg_docente_id}')
        self.assertIn(res.status_code, [401, 422])

    def test_retractar_mensaje_ya_retractado_es_idempotente(self):
        """Retractar nuevamente un mensaje ya retractado responde de forma controlada sin fallar."""
        token = self._login('docente_retract@monteverde.com', 'docente123')
        # Primera retractación
        res1 = self.client.delete(
            f'/api/mensajes/{self.msg_docente_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(res1.status_code, 200)

        # Segunda retractación
        res2 = self.client.delete(
            f'/api/mensajes/{self.msg_docente_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(res2.status_code, 200)
        data = json.loads(res2.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['message'], 'El mensaje ya había sido retractado')
        self.assertTrue(data['data']['eliminado'])

    def test_admin_puede_retractar_cualquier_mensaje(self):
        """Un usuario administrador tiene permisos para retractar mensajes."""
        token = self._login('admin_retract@monteverde.com', 'admin123')
        res = self.client.delete(
            f'/api/mensajes/{self.msg_familia_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data['success'])
        self.assertTrue(data['data']['eliminado'])

    def test_conversacion_oculta_cuerpo_de_mensaje_retractado(self):
        """Al consultar la conversación entre usuarios, el mensaje retractado no expone el cuerpo original."""
        token = self._login('docente_retract@monteverde.com', 'docente123')
        
        # Retractar el mensaje del docente
        self.client.delete(
            f'/api/mensajes/{self.msg_docente_id}',
            headers={'Authorization': f'Bearer {token}'}
        )

        # Consultar conversación
        res = self.client.get(
            f'/api/conversacion/{self.docente_id}/{self.familia_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        mensajes = data['data']

        msg_retractado = next(m for m in mensajes if m['id'] == self.msg_docente_id)
        self.assertTrue(msg_retractado['eliminado'])
        self.assertEqual(msg_retractado['cuerpo'], '🚫 Este mensaje fue eliminado por su remitente.')
        self.assertNotIn('excelente desempeño', msg_retractado['cuerpo'])

        # El mensaje no retractado conserva su texto
        msg_normal = next(m for m in mensajes if m['id'] == self.msg_familia_id)
        self.assertFalse(msg_normal['eliminado'])
        self.assertEqual(msg_normal['cuerpo'], '¿Podría confirmar si hay entrega mañana?')


if __name__ == '__main__':
    unittest.main()
