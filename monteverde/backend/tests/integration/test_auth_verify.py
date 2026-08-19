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

class AuthVerifyTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key'
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
            
            # Crear usuario activo de prueba
            self.user = Usuario(
                nombre="Usuario Activo",
                email="user.active@monteverde.com",
                rol="docente",
                activo=True,
                eliminado=False
            )
            self.user.set_password("password123")
            db.session.add(self.user)
            
            # Crear usuario inactivo
            self.inactive_user = Usuario(
                nombre="Usuario Inactivo",
                email="user.inactive@monteverde.com",
                rol="familia",
                activo=False,
                eliminado=False
            )
            self.inactive_user.set_password("password123")
            db.session.add(self.inactive_user)
            
            # Crear usuario eliminado lógicamente
            self.deleted_user = Usuario(
                nombre="Usuario Eliminado",
                email="user.deleted@monteverde.com",
                rol="familia",
                activo=True,
                eliminado=True
            )
            self.deleted_user.set_password("password123")
            db.session.add(self.deleted_user)
            
            db.session.commit()
            
            self.user_id = self.user.id
            self.inactive_id = self.inactive_user.id
            self.deleted_id = self.deleted_user.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def get_jwt_headers(self, email, password):
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

    def test_verify_token_valido(self):
        """Verificar token válido y activo"""
        headers = self.get_jwt_headers("user.active@monteverde.com", "password123")
        response = self.client.get('/api/auth/verify', headers=headers)
        data = json.loads(response.data.decode('utf-8'))
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        self.assertEqual(data['user']['email'], "user.active@monteverde.com")
        self.assertEqual(data['user']['nombre'], "Usuario Activo")

    def test_verify_sin_token(self):
        """Verificar endpoint sin token (debe fallar)"""
        response = self.client.get('/api/auth/verify')
        self.assertEqual(response.status_code, 401)

    def test_verify_token_invalido(self):
        """Verificar endpoint con token corrupto (debe fallar)"""
        headers = {
            'Authorization': 'Bearer token_invalido_corrupto_123',
            'Content-Type': 'application/json'
        }
        response = self.client.get('/api/auth/verify', headers=headers)
        self.assertEqual(response.status_code, 422)  # Flask-JWT-Extended devuelve 422 para tokens mal estructurados

    def test_verify_usuario_inactivo(self):
        """Verificar que un usuario desactivado reciba error 403"""
        headers = self.get_jwt_headers("user.active@monteverde.com", "password123")
        
        with self.app.app_context():
            # Usar db.session.get() para SQLAlchemy 2.0+ / compatibilidad
            u = db.session.get(Usuario, self.user_id)
            u.activo = False
            db.session.commit()
            
        response = self.client.get('/api/auth/verify', headers=headers)
        data = json.loads(response.data.decode('utf-8'))
        
        self.assertEqual(response.status_code, 403)
        self.assertFalse(data['success'])
        self.assertIn('desactivada', data['message'])

    def test_verify_usuario_eliminado(self):
        """Verificar que un usuario eliminado reciba error 401"""
        headers = self.get_jwt_headers("user.active@monteverde.com", "password123")
        
        with self.app.app_context():
            u = db.session.get(Usuario, self.user_id)
            u.eliminado = True
            db.session.commit()
            
        response = self.client.get('/api/auth/verify', headers=headers)
        data = json.loads(response.data.decode('utf-8'))
        
        self.assertEqual(response.status_code, 401)
        self.assertFalse(data['success'])
        self.assertIn('inactivo', data['message'])
