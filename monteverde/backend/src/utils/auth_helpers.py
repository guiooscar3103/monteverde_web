from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from src.models.usuario import Usuario

def role_required(*allowed_roles):
    """Decorador para proteger rutas por roles"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            current_user_id = get_jwt_identity()
            
            # Obtener usuario actual
            user = Usuario.query.get(current_user_id)
            if not user:
                return jsonify({'message': 'Usuario no encontrado'}), 404
            
            # Verificar rol
            if user.rol not in allowed_roles:
                return jsonify({
                    'message': 'Acceso denegado',
                    'required_roles': list(allowed_roles),
                    'user_role': user.rol
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_current_user():
    """Obtener usuario actual desde JWT"""
    try:
        current_user_id = get_jwt_identity()
        return Usuario.query.get(current_user_id)
    except:
        return None
