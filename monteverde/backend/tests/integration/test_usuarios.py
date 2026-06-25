import os
os.environ['JWT_SECRET_KEY'] = 'test-secret-key'
# configuramos una base de datos en memoria para pruebas
from config import Config
Config.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
Config.SQLALCHEMY_ECHO = False

import unittest
import json
from app import create_app
from src.extensions import db
from src.models.usuario import Usuario

class MonteverdeTestCase(unittest.TestCase):
    def setUp(self):
        # Configuración del entorno de prueba antes de cada test
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key' 
        self.client = self.app.test_client()
        
        # Crear todas las tablas en la base de datos en memoria
        with self.app.app_context():
            db.create_all()
            
            # Crear administrador de prueba para autenticación
            self.admin_user = Usuario(
                nombre="Admin de Pruebas",
                email="admin.test@monteverde.com",
                rol="admin",
                activo=True
            )
            self.admin_user.set_password("admin123")
            db.session.add(self.admin_user)
            db.session.commit()
            
            # Guardar el ID de administrador
            self.admin_id = self.admin_user.id

    def tearDown(self):
        # Limpieza después de cada test
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def get_jwt_headers(self, email="admin.test@monteverde.com", password="admin123"):
        # Helper para obtener las cabeceras con el Token JWT
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
    # REQ-01 & REQ-02 / CU-001: MÓDULO DE AUTENTICACIÓN (LOGIN)
    # =========================================================================
    
    def test_login_exitoso(self):
        """[REQ-01 / CU-001 (Flujo Principal)] Login exitoso con credenciales válidas y generación del Token JWT"""
        response = self.client.post('/api/auth/login', json={
            'email': 'admin.test@monteverde.com',
            'password': 'admin123'
        })
        data = json.loads(response.data.decode('utf-8'))
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        self.assertIn('token', data)
        self.assertIn('user', data)
        self.assertEqual(data['user']['email'], 'admin.test@monteverde.com')

    def test_login_fallido_password_incorrecto(self):
        """[REQ-02 / CU-001 (Flujo Alterno 1)] Rechazo de autenticación por contraseña incorrecta (Bloqueo de acceso)"""
        response = self.client.post('/api/auth/login', json={
            'email': 'admin.test@monteverde.com',
            'password': 'wrongpassword'
        })
        data = json.loads(response.data.decode('utf-8'))
        
        self.assertEqual(response.status_code, 401)
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'Contraseña incorrecta')

    def test_login_fallido_usuario_inexistente(self):
        """[REQ-02 / CU-001 (Flujo Alterno 1)] Rechazo de autenticación por correo electrónico no registrado (Bloqueo de acceso)"""
        response = self.client.post('/api/auth/login', json={
            'email': 'inexistente@monteverde.com',
            'password': 'anypassword'
        })
        data = json.loads(response.data.decode('utf-8'))
        
        self.assertEqual(response.status_code, 401)
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'Usuario no encontrado o inactivo')

    def test_login_fallido_usuario_inactivo(self):
        """[REQ-02 / CU-001 (Flujo Alterno 2)] Rechazo de autenticación por cuenta inactiva (activo=False)"""
        # Crear usuario inactivo
        headers = self.get_jwt_headers()
        self.client.post('/api/usuarios', headers=headers, json={
            'nombre': 'Docente Inactivo',
            'email': 'inactivo@monteverde.com',
            'password': 'password123',
            'rol': 'docente',
            'activo': False
        })
        
        # Intentar iniciar sesión
        response = self.client.post('/api/auth/login', json={
            'email': 'inactivo@monteverde.com',
            'password': 'password123'
        })
        data = json.loads(response.data.decode('utf-8'))
        
        self.assertEqual(response.status_code, 403)
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'Esta cuenta ha sido desactivada por el administrador')

    # =========================================================================
    # REQ-03 / CU-002: CREAR USUARIO (CRUD ADMIN)
    # =========================================================================
    
    def test_crear_usuario_exitoso(self):
        """[REQ-03 / CU-002 (Flujo Principal)] Registro de un nuevo usuario con rol de docente y contraseña hasheada exitosamente"""
        headers = self.get_jwt_headers()
        response = self.client.post('/api/usuarios', headers=headers, json={
            'nombre': 'Docente María García López',
            'email': 'maria.garcia@monteverde.com',
            'password': 'password123',
            'rol': 'docente',
            'activo': True
        })
        data = json.loads(response.data.decode('utf-8'))
        
        self.assertEqual(response.status_code, 201)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['nombre'], 'Docente María García López')
        self.assertEqual(data['data']['email'], 'maria.garcia@monteverde.com')
        self.assertEqual(data['data']['rol'], 'docente')

    def test_crear_usuario_correo_duplicado(self):
        """[REQ-03 / CU-002 (Flujo Alterno 1)] Impedir el registro de un usuario con un correo electrónico que ya existe en la base de datos"""
        headers = self.get_jwt_headers()
        # Registrar el primer usuario
        self.client.post('/api/usuarios', headers=headers, json={
            'nombre': 'Docente Original',
            'email': 'duplicado@monteverde.com',
            'password': 'password123',
            'rol': 'docente'
        })
        
        # Intentar registrar otro usuario con el mismo email
        response = self.client.post('/api/usuarios', headers=headers, json={
            'nombre': 'Docente Clon',
            'email': 'duplicado@monteverde.com',
            'password': 'password456',
            'rol': 'docente'
        })
        data = json.loads(response.data.decode('utf-8'))
        
        self.assertEqual(response.status_code, 400)
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'El correo electrónico ya está registrado')

    def test_crear_usuario_campos_incompletos(self):
        """[REQ-03 / CU-002 (Flujo Alterno 2)] Rechazo de registro cuando faltan campos obligatorios en los datos del formulario"""
        headers = self.get_jwt_headers()
        # Enviar petición sin correo ni contraseña
        response = self.client.post('/api/usuarios', headers=headers, json={
            'nombre': 'Usuario Incompleto',
            'rol': 'docente'
        })
        data = json.loads(response.data.decode('utf-8'))
        
        self.assertEqual(response.status_code, 400)
        self.assertFalse(data['success'])
        self.assertIn('Faltan campos obligatorios', data['message'])

    def test_crear_usuario_rol_invalido(self):
        """[REQ-03 / CU-002 (Flujo Alterno 2)] Rechazo de registro de usuario cuando se intenta inyectar un rol no permitido/inválido"""
        headers = self.get_jwt_headers()
        response = self.client.post('/api/usuarios', headers=headers, json={
            'nombre': 'Intruso',
            'email': 'intruso@monteverde.com',
            'password': 'password123',
            'rol': 'superadmin'  # Rol inválido
        })
        data = json.loads(response.data.decode('utf-8'))
        
        self.assertEqual(response.status_code, 400)
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'Rol inválido')

    # =========================================================================
    # REQ-04 / CU-003: CONSULTAR USUARIOS (CRUD ADMIN)
    # =========================================================================
    
    def test_consultar_usuarios_paginacion_y_filtros(self):
        """[REQ-04 / CU-003 (Flujo Principal y Alternos)] Consulta de usuarios registrados con soporte para búsqueda de texto, filtro de roles, filtro de estado y paginación"""
        headers = self.get_jwt_headers()
        
        # 1. Crear docentes
        self.client.post('/api/usuarios', headers=headers, json={
            'nombre': 'Docente Carlos', 'email': 'carlos@monteverde.com', 'password': 'pass', 'rol': 'docente', 'activo': True
        })
        self.client.post('/api/usuarios', headers=headers, json={
            'nombre': 'Docente Ana', 'email': 'ana@monteverde.com', 'password': 'pass', 'rol': 'docente', 'activo': False
        })
        # 2. Crear familia
        self.client.post('/api/usuarios', headers=headers, json={
            'nombre': 'Familia Pérez', 'email': 'perez@monteverde.com', 'password': 'pass', 'rol': 'familia', 'activo': True
        })
        
        # --- Prueba de Paginación ---
        res_pag = self.client.get('/api/usuarios?page=1&limit=2', headers=headers)
        data_pag = json.loads(res_pag.data.decode('utf-8'))['data']
        self.assertEqual(len(data_pag['usuarios']), 2)
        self.assertEqual(data_pag['total'], 4)  # 3 creados + 1 admin en setUp
        
        # --- Prueba de Búsqueda Textual ---
        res_search = self.client.get('/api/usuarios?search=Carlos', headers=headers)
        data_search = json.loads(res_search.data.decode('utf-8'))['data']
        self.assertEqual(len(data_search['usuarios']), 1)
        self.assertEqual(data_search['usuarios'][0]['nombre'], 'Docente Carlos')
        
        # --- Prueba de Filtro por Rol ---
        res_rol = self.client.get('/api/usuarios?rol=familia', headers=headers)
        data_rol = json.loads(res_rol.data.decode('utf-8'))['data']
        self.assertEqual(len(data_rol['usuarios']), 1)
        self.assertEqual(data_rol['usuarios'][0]['rol'], 'familia')
        
        # --- Prueba de Filtro por Estado ---
        res_estado = self.client.get('/api/usuarios?activo=false', headers=headers)
        data_estado = json.loads(res_estado.data.decode('utf-8'))['data']
        self.assertEqual(len(data_estado['usuarios']), 1)
        self.assertEqual(data_estado['usuarios'][0]['nombre'], 'Docente Ana')

    # =========================================================================
    # REQ-05 & REQ-06 / CU-004: EDITAR USUARIO Y RESTABLECER CONTRASEÑA
    # =========================================================================
    
    def test_editar_usuario_exitoso(self):
        """[REQ-05 / CU-004 (Flujo Principal)] Modificación y actualización de los datos de perfil y el estado activo/inactivo de una cuenta de usuario"""
        headers = self.get_jwt_headers()
        
        # Crear usuario
        create_res = self.client.post('/api/usuarios', headers=headers, json={
            'nombre': 'Docente A Editar',
            'email': 'editar@monteverde.com',
            'password': 'password123',
            'rol': 'docente'
        })
        user_id = json.loads(create_res.data.decode('utf-8'))['data']['id']
        
        # Modificar campos
        edit_res = self.client.put(f'/api/usuarios/{user_id}', headers=headers, json={
            'nombre': 'Docente Editado Exitoso',
            'email': 'editado.ok@monteverde.com',
            'activo': False
        })
        edit_data = json.loads(edit_res.data.decode('utf-8'))
        
        self.assertEqual(edit_res.status_code, 200)
        self.assertTrue(edit_data['success'])
        self.assertEqual(edit_data['data']['nombre'], 'Docente Editado Exitoso')
        self.assertEqual(edit_data['data']['email'], 'editado.ok@monteverde.com')
        self.assertFalse(edit_data['data']['activo'])

    def test_editar_usuario_correo_duplicado(self):
        """[REQ-05 / CU-004 (Flujo Alterno CU-004-1)] Bloquear la edición del perfil de usuario si el nuevo correo ingresado ya pertenece a otra cuenta"""
        headers = self.get_jwt_headers()
        
        # Crear Usuario A
        self.client.post('/api/usuarios', headers=headers, json={
            'nombre': 'Usuario A', 'email': 'usuario.a@monteverde.com', 'password': 'pass', 'rol': 'docente'
        })
        # Crear Usuario B
        create_res = self.client.post('/api/usuarios', headers=headers, json={
            'nombre': 'Usuario B', 'email': 'usuario.b@monteverde.com', 'password': 'pass', 'rol': 'docente'
        })
        user_b_id = json.loads(create_res.data.decode('utf-8'))['data']['id']
        
        # Intentar cambiar correo de B por el de A
        edit_res = self.client.put(f'/api/usuarios/{user_b_id}', headers=headers, json={
            'email': 'usuario.a@monteverde.com'
        })
        edit_data = json.loads(edit_res.data.decode('utf-8'))
        
        self.assertEqual(edit_res.status_code, 400)
        self.assertFalse(edit_data['success'])
        self.assertEqual(edit_data['message'], 'El correo electrónico ya está registrado por otro usuario')

    def test_restablecer_password_exitoso(self):
        """[REQ-06 / CU-004] Restablecer contraseña temporal del usuario y verificar que pueda iniciar sesión con la nueva contraseña"""
        headers = self.get_jwt_headers()
        
        # Crear usuario docente
        create_res = self.client.post('/api/usuarios', headers=headers, json={
            'nombre': 'Docente Password Test',
            'email': 'pass.test@monteverde.com',
            'password': 'passwordOriginal',
            'rol': 'docente'
        })
        user_id = json.loads(create_res.data.decode('utf-8'))['data']['id']
        
        # Restablecer contraseña
        pass_res = self.client.put(f'/api/usuarios/{user_id}/password', headers=headers, json={
            'password': 'nuevaContraseña123'
        })
        pass_data = json.loads(pass_res.data.decode('utf-8'))
        
        self.assertEqual(pass_res.status_code, 200)
        self.assertTrue(pass_data['success'])
        
        # Intentar hacer login con la nueva contraseña
        login_res = self.client.post('/api/auth/login', json={
            'email': 'pass.test@monteverde.com',
            'password': 'nuevaContraseña123'
        })
        login_data = json.loads(login_res.data.decode('utf-8'))
        self.assertEqual(login_res.status_code, 200)
        self.assertTrue(login_data['success'])

    # =========================================================================
    # REQ-07 / CU-005: ELIMINAR USUARIO (SOFT DELETE)
    # =========================================================================
    
    def test_eliminar_usuario_soft_delete(self):
        """[REQ-07 / CU-005 (Flujo Principal)] Eliminación lógica (soft delete) del usuario, comprobando que se marque como eliminado y se registre la fecha de eliminación en la base de datos"""
        headers = self.get_jwt_headers()
        
        # Crear usuario
        create_res = self.client.post('/api/usuarios', headers=headers, json={
            'nombre': 'Docente Temporal',
            'email': 'temporal@monteverde.com',
            'password': 'password123',
            'rol': 'docente'
        })
        user_id = json.loads(create_res.data.decode('utf-8'))['data']['id']
        
        # Eliminar lógicamente (soft delete)
        delete_res = self.client.delete(f'/api/usuarios/{user_id}', headers=headers)
        delete_data = json.loads(delete_res.data.decode('utf-8'))
        
        self.assertEqual(delete_res.status_code, 200)
        self.assertTrue(delete_data['success'])
        self.assertIn('soft delete', delete_data['message'])
        
        # Verificar directamente en la base de datos
        with self.app.app_context():
            user = Usuario.query.get(user_id)
            self.assertTrue(user.eliminado)
            self.assertIsNotNone(user.fecha_eliminacion)

        # Verificar que el usuario no aparece en la lista de activos
        list_res = self.client.get('/api/usuarios', headers=headers)
        list_data = json.loads(list_res.data.decode('utf-8'))['data']
        self.assertEqual(len(list_data['usuarios']), 1)  # Solo queda el administrador
        
        # Intentar login con la cuenta borrada lógicamente
        login_res = self.client.post('/api/auth/login', json={
            'email': 'temporal@monteverde.com',
            'password': 'password123'
        })
        self.assertEqual(login_res.status_code, 401)  # Debería retornar no encontrado o inactivo

    # =========================================================================
    # REQ-08 / CU-006: RESTAURAR USUARIO
    # =========================================================================
    
    def test_restaurar_usuario_exitoso(self):
        """[REQ-08 / CU-006 (Flujo Principal)] Restauración y reactivación de una cuenta de usuario previamente eliminada lógicamente, limpiando la fecha de eliminación"""
        headers = self.get_jwt_headers()
        
        # Crear usuario
        create_res = self.client.post('/api/usuarios', headers=headers, json={
            'nombre': 'Docente A Restaurar',
            'email': 'restaurar@monteverde.com',
            'password': 'password123',
            'rol': 'docente'
        })
        user_id = json.loads(create_res.data.decode('utf-8'))['data']['id']
        
        # Eliminar lógicamente (soft delete)
        self.client.delete(f'/api/usuarios/{user_id}', headers=headers)
        
        # Restaurar usuario
        restore_res = self.client.put(f'/api/usuarios/{user_id}/restaurar', headers=headers)
        restore_data = json.loads(restore_res.data.decode('utf-8'))
        
        self.assertEqual(restore_res.status_code, 200)
        self.assertTrue(restore_data['success'])
        self.assertEqual(restore_data['data']['email'], 'restaurar@monteverde.com')
        self.assertFalse(restore_data['data']['eliminado'])
        
        # Verificar en la base de datos que se haya limpiado el campo de fecha de eliminación
        with self.app.app_context():
            user = Usuario.query.get(user_id)
            self.assertFalse(user.eliminado)
            self.assertIsNone(user.fecha_eliminacion)

        # Confirmar que vuelve a figurar en la lista
        list_res = self.client.get('/api/usuarios', headers=headers)
        list_data = json.loads(list_res.data.decode('utf-8'))['data']
        self.assertEqual(len(list_data['usuarios']), 2)

    def test_restaurar_usuario_inexistente(self):
        """[REQ-08 / CU-006 (Flujo Alterno CU-006-1)] Intento de restauración de un identificador de usuario inexistente o no eliminado lógicamente (retorna 404)"""
        headers = self.get_jwt_headers()
        
        # Intentar restaurar usuario inexistente (ej. ID 9999)
        restore_res = self.client.put('/api/usuarios/9999/restaurar', headers=headers)
        restore_data = json.loads(restore_res.data.decode('utf-8'))
        
        self.assertEqual(restore_res.status_code, 404)
        self.assertFalse(restore_data['success'])
        self.assertEqual(restore_data['message'], 'Usuario eliminado no encontrado')

if __name__ == '__main__':
    unittest.main()
