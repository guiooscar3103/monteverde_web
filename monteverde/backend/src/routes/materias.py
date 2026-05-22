from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from src.models.materia import Materia
from src.utils.auth_helpers import get_current_user

materias_bp = Blueprint('materias', __name__)

@materias_bp.route('/materias', methods=['GET'])
@jwt_required(optional=True)
def list_materias():
    try:
        current_user = get_current_user()
        
        query = Materia.query
        
        # Si el usuario es docente, filtrar solo las materias asociadas a su asignación académica
        if current_user and current_user.rol == 'docente':
            from src.models.docente_asignacion import DocenteAsignacion
            
            asignaciones = DocenteAsignacion.query.filter_by(docente_id=current_user.id).all()
            materia_ids = {a.materia_id for a in asignaciones}
            
            query = query.filter(Materia.id.in_(list(materia_ids)))
            
        materias = query.order_by(Materia.nombre).all()
        return jsonify({'success': True, 'data': [m.to_dict() for m in materias]}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error al obtener materias', 'error': str(e)}), 500
