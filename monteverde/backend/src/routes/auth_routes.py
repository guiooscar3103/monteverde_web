from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from src.services.auth_service import AuthService
from src.models.usuario import Usuario
from src.extensions import db

auth_bp = Blueprint('auth_routes', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """Ruta de login usando AuthService"""
    try:
        data = request.get_json() or {}
        email = data.get('email')
        password = data.get('password')
        
        result, status_code = AuthService.login(email, password)
        return jsonify(result), status_code
    except Exception as e:
        print(f"❌ Error en login route: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify():
    """Verificar el token de sesión y retornar datos actualizados del usuario"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(Usuario, int(current_user_id))
        
        if not user or user.eliminado:
            return jsonify({'success': False, 'message': 'Usuario no encontrado o inactivo'}), 401
            
        if not user.activo:
            return jsonify({'success': False, 'message': 'Esta cuenta ha sido desactivada por el administrador'}), 403
            
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
    except Exception as e:
        print(f"❌ Error en verify route: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

