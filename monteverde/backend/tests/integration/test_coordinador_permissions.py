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
from src.models.materia import Materia

class CoordinadorPermissionsTestCase(unittest.TestCase):
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
            # Limpiar datos para cada test
            Usuario.query.delete()
            Curso.query.delete()
            Materia.query.delete()
            db.session.commit()

            # 1. Coordinador
            self.coordinador = Usuario(
                nombre='Coordinador Académico Test',
                email='coordinador.test@monteverde.edu.co',
                rol='coordinador',
                activo=True
            )
            self.coordinador.set_password('coord123')
            db.session.add(self.coordinador)

            # 2. Administrador
            self.admin = Usuario(
                nombre='Admin Sistema Test',
                email='admin.test@monteverde.edu.co',
                rol='admin',
                activo=True
            )
            self.admin.set_password('admin123')
            db.session.add(self.admin)

            # 3. Docente
            self.docente = Usuario(
                nombre='Docente Test',
                email='docente.test@monteverde.edu.co',
                rol='docente',
                activo=True
            )
            self.docente.set_password('docente123')
            db.session.add(self.docente)

            # 4. Familia
            self.familia = Usuario(
                nombre='Familia Test',
                email='familia.test@monteverde.edu.co',
                rol='familia',
                activo=True
            )
            self.familia.set_password('familia123')
            db.session.add(self.familia)

            # 5. Curso base
            self.curso = Curso(
                nombre='Sexto A',
                nivel='6°',
                letra='A',
                descripcion='Curso de prueba'
            )
            db.session.add(self.curso)

            # 6. Materia base
            self.materia = Materia(
                nombre='Filosofía',
                codigo='FILO',
                descripcion='Introducción al pensamiento crítico',
                area='Ciencias Humanas',
                intensidad_horaria=3,
                activo=True
            )
            db.session.add(self.materia)
            db.session.commit()

            self.curso_id = self.curso.id
            self.materia_id = self.materia.id
            self.docente_id = self.docente.id

    def get_headers_for(self, email, password):
        res = self.client.post('/api/auth/login', json={'email': email, 'password': password})
        data = json.loads(res.data.decode('utf-8'))
        token = data.get('token')
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def test_coordinador_login_and_permissions(self):
        """Verifica que el usuario coordinador se autentica y obtiene sus permisos"""
        headers = self.get_headers_for('coordinador.test@monteverde.edu.co', 'coord123')
        self.assertIn('Authorization', headers)

        with self.app.app_context():
            u = Usuario.query.filter_by(email='coordinador.test@monteverde.edu.co').first()
            self.assertEqual(u.rol, 'coordinador')
            self.assertTrue(u.has_permission('curso:crear'))
            self.assertTrue(u.has_permission('materia:crear'))
            self.assertTrue(u.has_permission('docente:asignar'))
            # No debe tener permisos técnicos de infraestructura
            self.assertFalse(u.has_permission('usuario:crear'))
            self.assertFalse(u.has_permission('institucion:configurar'))

    def test_coordinador_puede_crear_curso(self):
        """Coordinador tiene potestad de crear cursos académicos"""
        headers = self.get_headers_for('coordinador.test@monteverde.edu.co', 'coord123')
        payload = {
            'nombre': 'Séptimo B',
            'grado': '7B',
            'descripcion': 'Grupo matutino'
        }
        res = self.client.post('/api/cursos', json=payload, headers=headers)
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data.decode('utf-8'))
        self.assertTrue(data.get('success'))

    def test_coordinador_puede_crear_y_editar_materia(self):
        """Coordinador gestiona el catálogo de asignaturas"""
        headers = self.get_headers_for('coordinador.test@monteverde.edu.co', 'coord123')
        payload = {
            'nombre': 'Física Elemental',
            'codigo': 'FIS1',
            'area': 'Ciencias Naturales',
            'intensidad_horaria': 4,
            'activo': True
        }
        res = self.client.post('/api/materias', json=payload, headers=headers)
        self.assertEqual(res.status_code, 201)

        # Editar materia existente
        res_put = self.client.put(f'/api/materias/{self.materia_id}', json={'intensidad_horaria': 5}, headers=headers)
        self.assertEqual(res_put.status_code, 200)

    def test_coordinador_puede_asignar_docente(self):
        """Coordinador tiene potestad de asignar carga docente"""
        headers = self.get_headers_for('coordinador.test@monteverde.edu.co', 'coord123')
        payload = {
            'docente_id': self.docente_id,
            'curso_id': self.curso_id,
            'materia_id': self.materia_id
        }
        res = self.client.post('/api/admin/docentes/asignar', json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data.decode('utf-8'))
        self.assertTrue(data.get('success'))

    def test_coordinador_no_puede_crear_usuarios_sistema(self):
        """Coordinador NO debe tener acceso a CRUD de cuentas de usuario del sistema (403)"""
        headers = self.get_headers_for('coordinador.test@monteverde.edu.co', 'coord123')
        payload = {
            'nombre': 'Otro Usuario',
            'email': 'otro@monteverde.com',
            'password': 'pass',
            'rol': 'docente'
        }
        res = self.client.post('/api/usuarios', json=payload, headers=headers)
        self.assertEqual(res.status_code, 403)

    def test_coordinador_no_puede_modificar_configuracion_institucional(self):
        """Coordinador NO debe poder modificar parámetros institucionales técnicos (403)"""
        headers = self.get_headers_for('coordinador.test@monteverde.edu.co', 'coord123')
        payload = {
            'nombre_institucion': 'Colegio Hackeado',
            'director': 'Falso Rector'
        }
        res = self.client.put('/api/admin/configuracion-institucional', json=payload, headers=headers)
        self.assertEqual(res.status_code, 403)

    def test_docente_y_familia_no_pueden_crear_cursos(self):
        """Mínimo privilegio: ni Docente ni Familia pueden crear cursos (403)"""
        docente_headers = self.get_headers_for('docente.test@monteverde.edu.co', 'docente123')
        res_doc = self.client.post('/api/cursos', json={'nombre': 'Curso Ilegal'}, headers=docente_headers)
        self.assertEqual(res_doc.status_code, 403)

        familia_headers = self.get_headers_for('familia.test@monteverde.edu.co', 'familia123')
        res_fam = self.client.post('/api/cursos', json={'nombre': 'Curso Ilegal 2'}, headers=familia_headers)
        self.assertEqual(res_fam.status_code, 403)

if __name__ == '__main__':
    unittest.main()
