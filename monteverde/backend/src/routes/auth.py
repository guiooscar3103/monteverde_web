from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from src.extensions import db
from src.models.usuario import Usuario
from datetime import timedelta

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registrar nuevo usuario"""
    try:
        data = request.get_json()
        
        # Validaciones básicas
        if not data or not all(k in data for k in ('nombre', 'email', 'password', 'rol')):
            return jsonify({'message': 'Faltan campos requeridos'}), 400
        
        # Verificar si el email ya existe
        if Usuario.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'El email ya está registrado'}), 409
        
        # Validar rol
        if data['rol'] not in ['docente', 'familia', 'admin']:
            return jsonify({'message': 'Rol inválido'}), 400
        
        # Crear usuario
        usuario = Usuario(
            nombre=data['nombre'],
            email=data['email'],
            rol=data['rol'],
            estudiante_id=data.get('estudiante_id')  # Solo para familias
        )
        usuario.set_password(data['password'])
        
        db.session.add(usuario)
        db.session.commit()
        
        return jsonify({
            'message': 'Usuario registrado exitosamente',
            'usuario': usuario.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al registrar usuario', 'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Iniciar sesión"""
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ('email', 'password')):
            return jsonify({'message': 'Email y password requeridos'}), 400
        
        # Buscar usuario
        usuario = Usuario.query.filter_by(email=data['email']).first()
        
        if not usuario or not usuario.check_password(data['password']):
            return jsonify({'message': 'Credenciales inválidas'}), 401
        
        # Crear tokens
        access_token = create_access_token(
            identity=usuario.id,
            additional_claims={'rol': usuario.rol}
        )
        refresh_token = create_refresh_token(identity=usuario.id)
        
        return jsonify({
            'message': 'Login exitoso',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'usuario': usuario.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error al iniciar sesión', 'error': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Renovar access token"""
    try:
        current_user_id = get_jwt_identity()
        usuario = Usuario.query.get(current_user_id)
        
        if not usuario:
            return jsonify({'message': 'Usuario no encontrado'}), 404
        
        new_access_token = create_access_token(
            identity=current_user_id,
            additional_claims={'rol': usuario.rol}
        )
        
        return jsonify({
            'access_token': new_access_token
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error al renovar token', 'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Obtener perfil del usuario actual"""
    try:
        current_user_id = get_jwt_identity()
        usuario = Usuario.query.get(current_user_id)
        
        if not usuario:
            return jsonify({'message': 'Usuario no encontrado'}), 404
        
        return jsonify({
            'usuario': usuario.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error al obtener perfil', 'error': str(e)}), 500
