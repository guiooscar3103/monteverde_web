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
from src.models.circular import Circular

class CircularesTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key'
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
            
            # Crear administrador de prueba
            self.admin = Usuario(nombre="Admin Test", email="admin.test@school.com", rol="admin", activo=True)
            self.admin.set_password("admin123")
            db.session.add(self.admin)
            
            # Crear docente de prueba
            self.docente = Usuario(nombre="Docente Test", email="docente.test@school.com", rol="docente", activo=True)
            self.docente.set_password("docente123")
            db.session.add(self.docente)
            
            # Crear familia de prueba
            self.familia = Usuario(nombre="Familia Test", email="familia.test@school.com", rol="familia", activo=True)
            self.familia.set_password("familia123")
            db.session.add(self.familia)
            
            db.session.commit()
            
            # Crear circular base
            self.admin_id = self.admin.id
            self.circular = Circular(titulo="Circular Inicial", contenido="Contenido inicial institucional", autor_id=self.admin_id)
            db.session.add(self.circular)
            db.session.commit()
            
            self.circular_id = self.circular.id

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

    # =========================================================================
    # LECTURA DE CIRCULARES (LISTAR / DETALLE)
    # =========================================================================

    def test_listar_circulares_por_roles(self):
        """Todos los roles autenticados (admin, docente, familia) deben poder listar circulares"""
        for rol, email, pwd in [
            ("admin", "admin.test@school.com", "admin123"),
            ("docente", "docente.test@school.com", "docente123"),
            ("familia", "familia.test@school.com", "familia123")
        ]:
            headers = self.get_jwt_headers(email, pwd)
            response = self.client.get('/api/circulares', headers=headers)
            self.assertEqual(response.status_code, 200, f"Error listando para rol {rol}")
            data = json.loads(response.data.decode('utf-8'))
            self.assertTrue(data['success'])
            self.assertEqual(len(data['data']), 1)
            self.assertEqual(data['data'][0]['titulo'], "Circular Inicial")

    def test_obtener_detalle_circular_por_roles(self):
        """Todos los roles autenticados deben poder ver el detalle de una circular"""
        for rol, email, pwd in [
            ("admin", "admin.test@school.com", "admin123"),
            ("docente", "docente.test@school.com", "docente123"),
            ("familia", "familia.test@school.com", "familia123")
        ]:
            headers = self.get_jwt_headers(email, pwd)
            response = self.client.get(f'/api/circulares/{self.circular_id}', headers=headers)
            self.assertEqual(response.status_code, 200, f"Error viendo detalle para rol {rol}")
            data = json.loads(response.data.decode('utf-8'))
            self.assertTrue(data['success'])
            self.assertEqual(data['data']['titulo'], "Circular Inicial")
            self.assertEqual(data['data']['contenido'], "Contenido inicial institucional")

    def test_obtener_circular_inexistente(self):
        """Buscar una circular no registrada debe retornar 404"""
        headers = self.get_jwt_headers("familia.test@school.com", "familia123")
        response = self.client.get('/api/circulares/99999', headers=headers)
        self.assertEqual(response.status_code, 404)

    # =========================================================================
    # ACCIONES ADMINISTRATIVAS (CREAR, EDITAR, ELIMINAR)
    # =========================================================================

    def test_crear_circular_exitoso_por_admin(self):
        """El administrador debe poder crear circulares exitosamente"""
        headers = self.get_jwt_headers("admin.test@school.com", "admin123")
        payload = {
            "titulo": "Circular Nueva",
            "contenido": "Cuerpo de la circular de prueba"
        }
        response = self.client.post('/api/circulares', json=payload, headers=headers)
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data.decode('utf-8'))
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['titulo'], "Circular Nueva")

    def test_crear_circular_campos_faltantes(self):
        """Faltar campos en la creación debe retornar 400"""
        headers = self.get_jwt_headers("admin.test@school.com", "admin123")
        payload = {
            "titulo": ""
        }
        response = self.client.post('/api/circulares', json=payload, headers=headers)
        self.assertEqual(response.status_code, 400)

    def test_actualizar_circular_exitoso_por_admin(self):
        """El administrador debe poder actualizar una circular existente"""
        headers = self.get_jwt_headers("admin.test@school.com", "admin123")
        payload = {
            "titulo": "Circular Modificada",
            "contenido": "Cuerpo modificado"
        }
        response = self.client.put(f'/api/circulares/{self.circular_id}', json=payload, headers=headers)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode('utf-8'))
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['titulo'], "Circular Modificada")

    def test_eliminar_circular_exitoso_por_admin(self):
        """El administrador debe poder eliminar una circular"""
        headers = self.get_jwt_headers("admin.test@school.com", "admin123")
        response = self.client.delete(f'/api/circulares/{self.circular_id}', headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # Verificar que ya no exista
        response_check = self.client.get(f'/api/circulares/{self.circular_id}', headers=headers)
        self.assertEqual(response_check.status_code, 404)

    # =========================================================================
    # RESTRICCIONES DE AUTORIZACIÓN (DOCENTE Y FAMILIA)
    # =========================================================================

    def test_docente_no_puede_crear_editar_eliminar(self):
        """El rol docente debe tener restringidas las acciones de escritura (403)"""
        headers = self.get_jwt_headers("docente.test@school.com", "docente123")
        
        # Intentar Crear
        res_create = self.client.post('/api/circulares', json={"titulo": "A", "contenido": "B"}, headers=headers)
        self.assertEqual(res_create.status_code, 403)
        
        # Intentar Editar
        res_edit = self.client.put(f'/api/circulares/{self.circular_id}', json={"titulo": "A", "contenido": "B"}, headers=headers)
        self.assertEqual(res_edit.status_code, 403)
        
        # Intentar Eliminar
        res_delete = self.client.delete(f'/api/circulares/{self.circular_id}', headers=headers)
        self.assertEqual(res_delete.status_code, 403)

    def test_familia_no_puede_crear_editar_eliminar(self):
        """El rol familia debe tener restringidas las acciones de escritura (403)"""
        headers = self.get_jwt_headers("familia.test@school.com", "familia123")
        
        # Intentar Crear
        res_create = self.client.post('/api/circulares', json={"titulo": "A", "contenido": "B"}, headers=headers)
        self.assertEqual(res_create.status_code, 403)
        
        # Intentar Editar
        res_edit = self.client.put(f'/api/circulares/{self.circular_id}', json={"titulo": "A", "contenido": "B"}, headers=headers)
        self.assertEqual(res_edit.status_code, 403)
        
        # Intentar Eliminar
        res_delete = self.client.delete(f'/api/circulares/{self.circular_id}', headers=headers)
        self.assertEqual(res_delete.status_code, 403)
