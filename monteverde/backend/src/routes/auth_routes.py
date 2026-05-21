from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from src.services.auth_service import AuthService
from src.models.usuario import Usuario

auth_bp = Blueprint('auth_routes', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """Ruta de login usando AuthService"""
    try:
        data = request.get_json() or {}
        email = data.get('email')
        password = data.get('password')
        
        # Buscar usuario directamente para crear un token válido de Flask-JWT-Extended
        usuario = Usuario.query.filter_by(email=email).first()
        
        if not usuario or not usuario.check_password(password):
            return jsonify({'success': False, 'message': 'Credenciales inválidas'}), 401
            
        # Generar token con el claim "sub" automático
        access_token = create_access_token(
            identity=str(usuario.id),
            additional_claims={'rol': usuario.rol}
        )
        
        return jsonify({
            'success': True,
            'token': access_token,
            'user': usuario.to_dict()
        }), 200
    except Exception as e:
        print(f"❌ Error en login route: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
