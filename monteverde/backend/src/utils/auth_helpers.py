from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import db
from src.models.usuario import Usuario

from src.utils.permissions import has_permission, ROLE_PERMISSIONS

def role_required(*allowed_roles):
    """Decorador para proteger rutas por roles (admite varargs o listas/tuplas)"""
    roles_set = set()
    for r in allowed_roles:
        if isinstance(r, (list, tuple, set)):
            roles_set.update(r)
        else:
            roles_set.add(r)

    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            current_user_id = get_jwt_identity()
            if not current_user_id:
                return jsonify({'message': 'Token no válido o no suministrado'}), 401
            
            # Obtener usuario actual
            user = db.session.get(Usuario, int(current_user_id))
            if not user or user.eliminado:
                return jsonify({'message': 'Usuario no encontrado o inactivo'}), 404
            
            if not user.activo:
                return jsonify({'message': 'Esta cuenta ha sido desactivada por el administrador'}), 403
            
            # Verificar rol
            if user.rol not in roles_set:
                return jsonify({
                    'message': 'Acceso denegado',
                    'required_roles': list(roles_set),
                    'user_role': user.rol
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def permission_required(permission_slug):
    """Decorador para proteger rutas por capacidades y permisos granulares (PBAC)"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            current_user_id = get_jwt_identity()
            if not current_user_id:
                return jsonify({'message': 'Token no válido o no suministrado'}), 401
            
            user = db.session.get(Usuario, int(current_user_id))
            if not user or user.eliminado:
                return jsonify({'message': 'Usuario no encontrado o inactivo'}), 404
            
            if not user.activo:
                return jsonify({'message': 'Esta cuenta ha sido desactivada por el administrador'}), 403
            
            if not has_permission(user, permission_slug):
                return jsonify({
                    'message': f'Acceso denegado. Se requiere el permiso: {permission_slug}',
                    'required_permission': permission_slug,
                    'user_role': user.rol
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_current_user():
    """Obtener usuario actual desde JWT"""
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return None
        return db.session.get(Usuario, int(current_user_id))
    except Exception:
        return None


