from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from src.extensions import db
from src.models.usuario import Usuario
from src.utils.auth_helpers import role_required

usuarios_bp = Blueprint('usuarios_custom', __name__)

@usuarios_bp.route('/usuarios/familia', methods=['GET'])
@role_required('docente', 'admin')
def get_familias():
    """Obtener usuarios familia."""
    try:
        print("👨‍👩‍👧‍👦 Solicitando familias...")
        familias = Usuario.query.filter_by(rol='familia').order_by(Usuario.nombre).all()
        print(f"✅ Familias encontradas: {len(familias)}")
        return jsonify({'success': True, 'data': [f.to_dict() for f in familias]})
    except Exception as e:
        print(f"❌ Error familias: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@usuarios_bp.route('/usuarios/docentes', methods=['GET'])
@role_required('familia', 'docente', 'admin')
def get_docentes():
    """Obtener usuarios docentes."""
    try:
        docentes = Usuario.query.filter_by(rol='docente').order_by(Usuario.nombre).all()
        return jsonify({'success': True, 'data': [d.to_dict() for d in docentes]})
    except Exception as e:
        print(f"❌ Error docentes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@usuarios_bp.route('/usuario/<int:usuario_id>', methods=['GET'])
@jwt_required()
def get_usuario_por_id_simple(usuario_id):
    """Obtener usuario por ID."""
    try:
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404
        return jsonify({'success': True, 'data': usuario.to_dict()})
    except Exception as e:
        print(f"❌ Error usuario por ID: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
