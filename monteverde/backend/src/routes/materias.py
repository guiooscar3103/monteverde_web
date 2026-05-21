from flask import Blueprint, jsonify
from src.models.materia import Materia

materias_bp = Blueprint('materias', __name__)

@materias_bp.route('/materias', methods=['GET'])
def list_materias():
    try:
        materias = Materia.query.order_by(Materia.nombre).all()
        return jsonify({'success': True, 'data': [m.to_dict() for m in materias]}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error al obtener materias', 'error': str(e)}), 500
