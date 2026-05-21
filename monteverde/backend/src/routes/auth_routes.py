from flask import Blueprint, request, jsonify
from src.services.auth_service import AuthService

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
