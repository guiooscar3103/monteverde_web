from flask import Blueprint, request, jsonify
from src.services.usuario_service import UsuarioService

usuario_bp = Blueprint('usuario_routes', __name__)

@usuario_bp.route('', methods=['GET'])
def get_usuarios():
    """Obtener listado de usuarios paginado con filtros"""
    try:
        # Obtener parámetros de la query
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', None)
        rol = request.args.get('rol', None)
        
        activo_raw = request.args.get('activo', None)
        activo = None
        if activo_raw is not None:
            activo = activo_raw
            
        order_by = request.args.get('orderBy', 'nombre')
        order_direction = request.args.get('orderDirection', 'ASC')
        
        result = UsuarioService.get_usuarios(
            page=page,
            limit=limit,
            search=search,
            rol=rol,
            activo=activo,
            order_by=order_by,
            order_direction=order_direction
        )
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
    except Exception as e:
        print(f"❌ Error en get_usuarios route: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@usuario_bp.route('/<int:usuario_id>', methods=['GET'])
def get_usuario(usuario_id):
    """Obtener un usuario específico"""
    try:
        user = UsuarioService.get_usuario_por_id(usuario_id)
        if not user:
            return jsonify({'success': False, 'message': 'Usuario no encontrado o inactivo'}), 404
        return jsonify({
            'success': True,
            'data': user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@usuario_bp.route('', methods=['POST'])
def crear_usuario():
    """Crear un nuevo usuario"""
    try:
        data = request.get_json() or {}
        result, status_code = UsuarioService.crear_usuario(data)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@usuario_bp.route('/<int:usuario_id>', methods=['PUT'])
def actualizar_usuario(usuario_id):
    """Actualizar datos del usuario"""
    try:
        data = request.get_json() or {}
        result, status_code = UsuarioService.actualizar_usuario(usuario_id, data)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@usuario_bp.route('/<int:usuario_id>', methods=['DELETE'])
def soft_delete_usuario(usuario_id):
    """Eliminación lógica de usuario"""
    try:
        result, status_code = UsuarioService.soft_delete_usuario(usuario_id)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@usuario_bp.route('/<int:usuario_id>/restaurar', methods=['PUT'])
def restaurar_usuario(usuario_id):
    """Restaurar usuario eliminado lógicamente"""
    try:
        result, status_code = UsuarioService.restaurar_usuario(usuario_id)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@usuario_bp.route('/<int:usuario_id>/estado', methods=['PUT'])
def cambiar_estado(usuario_id):
    """Activar/Desactivar cuenta de usuario"""
    try:
        data = request.get_json() or {}
        activo = data.get('activo')
        if activo is None:
            return jsonify({'success': False, 'message': 'Campo activo es requerido'}), 400
            
        result, status_code = UsuarioService.cambiar_estado(usuario_id, activo)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@usuario_bp.route('/<int:usuario_id>/password', methods=['PUT'])
def restablecer_password(usuario_id):
    """Restablecer contraseña por el administrador"""
    try:
        data = request.get_json() or {}
        nueva_password = data.get('password')
        
        result, status_code = UsuarioService.restablecer_password(usuario_id, nueva_password)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
