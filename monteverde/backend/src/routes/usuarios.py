from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import db
from src.models.usuario import Usuario
from src.utils.auth_helpers import role_required, get_current_user

usuarios_bp = Blueprint('usuarios', __name__, url_prefix='/usuarios')

@usuarios_bp.route('/', methods=['GET'])
@role_required('admin', 'docente')
def list_usuarios():
    """Listar usuarios (solo admin y docentes)"""
    try:
        usuarios = Usuario.query.all()
        return jsonify({
            'usuarios': [u.to_dict() for u in usuarios]
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error al obtener usuarios', 'error': str(e)}), 500

@usuarios_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_usuario(user_id):
    """Obtener usuario específico"""
    try:
        current_user = get_current_user()
        
        # Solo admins pueden ver cualquier usuario, otros solo a sí mismos
        if current_user.rol != 'admin' and current_user.id != user_id:
            return jsonify({'message': 'Acceso denegado'}), 403
        
        usuario = Usuario.query.get_or_404(user_id)
        return jsonify({
            'usuario': usuario.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error al obtener usuario', 'error': str(e)}), 500

@usuarios_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_usuario(user_id):
    """Actualizar usuario"""
    try:
        current_user = get_current_user()
        
        # Solo admins pueden editar cualquier usuario, otros solo a sí mismos
        if current_user.rol != 'admin' and current_user.id != user_id:
            return jsonify({'message': 'Acceso denegado'}), 403
        
        usuario = Usuario.query.get_or_404(user_id)
        data = request.get_json()
        
        # Actualizar campos permitidos
        if 'nombre' in data:
            usuario.nombre = data['nombre']
        if 'email' in data and current_user.rol == 'admin':
            # Solo admins pueden cambiar email
            usuario.email = data['email']
        if 'password' in data:
            usuario.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Usuario actualizado exitosamente',
            'usuario': usuario.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al actualizar usuario', 'error': str(e)}), 500
