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
from src.models.actividad_admin import ActividadAdmin
from src.models.configuracion_institucional import ConfiguracionInstitucional
from src.services.configuracion_service import ConfiguracionService

class ConfiguracionInstitucionalTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # Crear administrador de prueba
            self.admin = Usuario(nombre="Admin General", email="admin.conf@school.com", rol="admin", activo=True)
            self.admin.set_password("admin123")
            db.session.add(self.admin)

            # Crear docente de prueba
            self.docente = Usuario(nombre="Docente Conf", email="docente.conf@school.com", rol="docente", activo=True)
            self.docente.set_password("docente123")
            db.session.add(self.docente)

            # Crear familia de prueba
            self.familia = Usuario(nombre="Familia Conf", email="familia.conf@school.com", rol="familia", activo=True)
            self.familia.set_password("familia123")
            db.session.add(self.familia)

            db.session.commit()

            self.admin_id = self.admin.id
            self.docente_id = self.docente.id
            self.familia_id = self.familia.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def get_jwt_headers(self, email, password):
        response = self.client.post('/api/auth/login', json={
            'email': email,
            'password': password
        })
        data = response.get_json()
        token = data.get('data', {}).get('token') or data.get('token')
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def test_01_consultar_configuracion_por_defecto_crea_semilla_en_bd(self):
        """Validar que la consulta inicial devuelve 200 y crea el registro en la BD si no existe"""
        response = self.client.get('/api/admin/configuracion')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get('success'))
        self.assertIn('data', data)
        self.assertEqual(data['data']['nombre_institucion'], 'Colegio MonteVerde')
        self.assertEqual(data['data']['anio_escolar'], '2026')
        self.assertEqual(data['data']['periodo_actual'], 'Primer Trimestre')

        with self.app.app_context():
            # Verificar que existe exactamente 1 registro en la BD
            configs = ConfiguracionInstitucional.query.all()
            self.assertEqual(len(configs), 1)
            self.assertEqual(configs[0].nombre_institucion, 'Colegio MonteVerde')

    def test_02_admin_puede_actualizar_configuracion(self):
        """Validar que un administrador autenticado puede actualizar la configuración en BD (PUT)"""
        headers = self.get_jwt_headers("admin.conf@school.com", "admin123")
        payload = {
            "nombre_institucion": "Gimnasio Moderno MonteVerde",
            "director": "Dra. Marcela MonteVerde",
            "anio_escolar": "2026-2027",
            "periodo_actual": "Segundo Trimestre",
            "direccion": "Avenida Los Álamos #100",
            "telefono": "+57 310 999 8877",
            "email_contacto": "rectoria@monteverde.edu.co"
        }

        response = self.client.put('/api/admin/configuracion', json=payload, headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get('success'))
        self.assertEqual(data['data']['nombre_institucion'], 'Gimnasio Moderno MonteVerde')
        self.assertEqual(data['data']['director'], 'Dra. Marcela MonteVerde')
        self.assertEqual(data['data']['anio_escolar'], '2026-2027')
        self.assertEqual(data['data']['email_contacto'], 'rectoria@monteverde.edu.co')

        # Verificar persistencia en base de datos
        with self.app.app_context():
            conf_db = ConfiguracionInstitucional.query.filter_by(activa=True).first()
            self.assertIsNotNone(conf_db)
            self.assertEqual(conf_db.nombre_institucion, 'Gimnasio Moderno MonteVerde')
            self.assertEqual(conf_db.director, 'Dra. Marcela MonteVerde')
            self.assertEqual(conf_db.usuario_actualizo_id, self.admin_id)

    def test_03_admin_puede_actualizar_con_post_por_compatibilidad(self):
        """Validar que POST /api/admin/configuracion también actualiza correctamente"""
        headers = self.get_jwt_headers("admin.conf@school.com", "admin123")
        payload = {
            "nombre_institucion": "Instituto MonteVerde Central",
            "director": "Carlos Alberto MonteVerde",
            "anio_escolar": "2027",
            "periodo_actual": "Tercer Trimestre",
            "direccion": "Carrera 15 # 80-20",
            "telefono": "+57 601 2345678",
            "email_contacto": "info@monteverde.edu.co"
        }

        response = self.client.post('/api/admin/configuracion', json=payload, headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get('success'))
        self.assertEqual(data['data']['nombre_institucion'], 'Instituto MonteVerde Central')

    def test_04_docente_recibe_403_al_intentar_actualizar(self):
        """Validar que un usuario con rol docente es rechazado con 403"""
        headers = self.get_jwt_headers("docente.conf@school.com", "docente123")
        payload = {
            "nombre_institucion": "Intento de Docente",
            "director": "Docente Hacker",
            "anio_escolar": "2026",
            "periodo_actual": "Primer Trimestre"
        }

        response = self.client.put('/api/admin/configuracion', json=payload, headers=headers)
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertFalse(data.get('success'))
        self.assertIn('Acceso denegado', data.get('message'))

    def test_05_familia_recibe_403_al_intentar_actualizar(self):
        """Validar que un usuario con rol familia es rechazado con 403"""
        headers = self.get_jwt_headers("familia.conf@school.com", "familia123")
        payload = {
            "nombre_institucion": "Intento de Familia",
            "director": "Familia Hacker",
            "anio_escolar": "2026",
            "periodo_actual": "Primer Trimestre"
        }

        response = self.client.put('/api/admin/configuracion', json=payload, headers=headers)
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertFalse(data.get('success'))

    def test_06_usuario_no_autenticado_recibe_401(self):
        """Validar que una solicitud sin encabezado Authorization recibe 401"""
        payload = {
            "nombre_institucion": "Sin Auth",
            "director": "Anonimo",
            "anio_escolar": "2026",
            "periodo_actual": "Primer Trimestre"
        }

        response = self.client.put('/api/admin/configuracion', json=payload)
        self.assertEqual(response.status_code, 401)

    def test_07_validacion_campos_obligatorios_retorna_400(self):
        """Validar que campos requeridos vacíos o faltantes retornan 400"""
        headers = self.get_jwt_headers("admin.conf@school.com", "admin123")

        # Falta director
        payload_invalido = {
            "nombre_institucion": "Colegio MonteVerde",
            "director": "",
            "anio_escolar": "2026",
            "periodo_actual": "Primer Trimestre"
        }
        response = self.client.put('/api/admin/configuracion', json=payload_invalido, headers=headers)
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data.get('success'))
        self.assertIn("director", data.get('message').lower())

    def test_08_validacion_email_invalido_retorna_400(self):
        """Validar que un formato de correo incorrecto retorna 400"""
        headers = self.get_jwt_headers("admin.conf@school.com", "admin123")
        payload_email_malo = {
            "nombre_institucion": "Colegio MonteVerde",
            "director": "Fernando MonteVerde",
            "anio_escolar": "2026",
            "periodo_actual": "Primer Trimestre",
            "email_contacto": "correo-no-valido-sin-arroba"
        }
        response = self.client.put('/api/admin/configuracion', json=payload_email_malo, headers=headers)
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data.get('success'))
        self.assertIn("correo electrónico", data.get('message').lower())

    def test_09_sembrado_idempotente_no_sobrescribe_configuracion_existente(self):
        """Validar que al invocar get_or_create_default repetidamente no se sobrescriben cambios guardados"""
        with self.app.app_context():
            # Obtener la configuración activa existente (creada en el startup del app)
            config = ConfiguracionInstitucional.query.first()
            if not config:
                config = ConfiguracionService.get_or_create_default()
            
            config.nombre_institucion = "Mi Colegio Personalizado"
            config.director = "Directora Personalizada"
            config.anio_escolar = "2030"
            config.periodo_actual = "Segundo Semestre"
            db.session.commit()

            # Llamar servicio get_or_create_default nuevamente
            config_obtenida = ConfiguracionService.get_or_create_default()
            self.assertEqual(config_obtenida.nombre_institucion, "Mi Colegio Personalizado")
            self.assertEqual(config_obtenida.anio_escolar, "2030")
            self.assertEqual(config_obtenida.director, "Directora Personalizada")

            # Verificar que solo hay 1 registro en la base de datos
            total = ConfiguracionInstitucional.query.count()
            self.assertEqual(total, 1)

    def test_10_actualizacion_registra_auditoria_en_actividad_admin(self):
        """Validar que cada actualización guarda un registro en la tabla de auditoría actividad_admin"""
        headers = self.get_jwt_headers("admin.conf@school.com", "admin123")
        payload = {
            "nombre_institucion": "Colegio Auditado",
            "director": "Director Auditado",
            "anio_escolar": "2026",
            "periodo_actual": "Primer Trimestre"
        }

        response = self.client.put('/api/admin/configuracion', json=payload, headers=headers)
        self.assertEqual(response.status_code, 200)

        with self.app.app_context():
            log = ActividadAdmin.query.filter_by(
                usuario_id=self.admin_id,
                accion='ACTUALIZAR_CONFIGURACION'
            ).first()
            self.assertIsNotNone(log)
            self.assertIn("Colegio Auditado", log.detalles)
