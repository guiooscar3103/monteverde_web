from datetime import datetime, timedelta
import jwt
from flask import current_app
from src.models.usuario import Usuario

class AuthService:
    @staticmethod
    def login(email, password):
        """Autenticar usuario y retornar token si las credenciales son válidas"""
        if not email or not password:
            return {'success': False, 'message': 'Email y contraseña requeridos'}, 400

        user = Usuario.query.filter_by(email=email).first()
        
        # Validar si el usuario existe y no está eliminado
        if not user or user.eliminado:
            return {'success': False, 'message': 'Usuario no encontrado o inactivo'}, 401
            
        # Validar si la cuenta está desactivada
        if not user.activo:
            return {'success': False, 'message': 'Esta cuenta ha sido desactivada por el administrador'}, 403

        # Verificar contraseña
        if user.check_password(password):
            user_data = user.to_dict()
            
            # Generar token JWT
            token_payload = {
                'user_id': user.id,
                'email': user.email,
                'rol': user.rol,
                'nombre': user.nombre,
                'exp': datetime.utcnow() + timedelta(hours=24)
            }
            
            token = jwt.encode(
                token_payload, 
                current_app.config['SECRET_KEY'], 
                algorithm='HS256'
            )
            
            if isinstance(token, bytes):
                token = token.decode('utf-8')
                
            return {
                'success': True,
                'message': 'Login exitoso',
                'user': user_data,
                'token': token
            }, 200
        else:
            return {'success': False, 'message': 'Contraseña incorrecta'}, 401
