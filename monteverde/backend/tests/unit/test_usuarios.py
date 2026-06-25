import unittest
from datetime import datetime
from src.models.usuario import Usuario

class TestUsuarioUnit(unittest.TestCase):
    def test_set_password_hashes_password(self):
        """[REQ-03 / CU-002] Verifica que set_password encripte la contraseña usando hashes seguros en lugar de texto plano"""
        usuario = Usuario(nombre="Docente Test", email="docente@monteverde.com", rol="docente")
        usuario.set_password("mi_clave_secreta_123")
        
        self.assertNotEqual(usuario.password, "mi_clave_secreta_123")
        self.assertTrue(usuario.password.startswith(('scrypt:', 'pbkdf2:sha256:')))

    def test_check_password_correcto(self):
        """[REQ-01 / CU-001] Verifica que check_password valide la contraseña correcta contra el hash generado"""
        usuario = Usuario()
        usuario.set_password("secreto_seguro")
        
        self.assertTrue(usuario.check_password("secreto_seguro"))

    def test_check_password_incorrecto(self):
        """[REQ-02 / CU-001] Verifica que check_password rechace una contraseña incorrecta para control de seguridad"""
        usuario = Usuario()
        usuario.set_password("secreto_seguro")
        
        self.assertFalse(usuario.check_password("clave_incorrecta"))

    def test_check_password_legacy_texto_plano(self):
        """[REQ-01 / REQ-02 / CU-001] Verifica que check_password brinde soporte y compatibilidad a contraseñas almacenadas en texto plano"""
        # Para compatibilidad, si la clave no empieza con un prefijo de hash scrypt o pbkdf2,
        # debe validarse comparando directamente en texto plano.
        usuario = Usuario(password="textoPlanoLegacy123")
        
        self.assertTrue(usuario.check_password("textoPlanoLegacy123"))
        self.assertFalse(usuario.check_password("otra_clave"))

    def test_to_dict_campos_basicos(self):
        """[REQ-03 / REQ-05 / REQ-06 / CU-002 / CU-004] Verifica la correcta serialización a diccionario de los datos del usuario para el retorno de respuestas HTTP estructuradas en la API"""
        fecha_registro = datetime(2026, 6, 24, 12, 0, 0)
        usuario = Usuario(
            id=15,
            nombre="María López",
            email="maria.lopez@monteverde.com",
            rol="docente",
            activo=True,
            eliminado=False,
            fecha_registro=fecha_registro
        )
        
        data = usuario.to_dict()
        
        self.assertEqual(data['id'], 15)
        self.assertEqual(data['nombre'], "María López")
        self.assertEqual(data['email'], "maria.lopez@monteverde.com")
        self.assertEqual(data['rol'], "docente")
        self.assertTrue(data['activo'])
        self.assertFalse(data['eliminado'])
        self.assertEqual(data['fecha_registro'], fecha_registro.isoformat())
        self.assertIsNone(data['fecha_eliminacion'])
        self.assertIsNone(data['estudiante_id'])
        self.assertIsNone(data['estudiante'])
        self.assertEqual(data['estudiantes'], [])

if __name__ == '__main__':
    unittest.main()
