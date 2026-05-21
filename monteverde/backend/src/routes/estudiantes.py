from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.extensions import db
from src.models.estudiante import Estudiante
from src.models.curso import Curso
from src.utils.auth_helpers import role_required, get_current_user

estudiantes_bp = Blueprint('estudiantes', __name__, url_prefix='/estudiantes')

@estudiantes_bp.route('/', methods=['GET'])
@role_required('admin', 'docente')
def list_estudiantes():
    """Listar estudiantes con filtros"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        curso_id = request.args.get('curso_id', type=int)
        
        query = Estudiante.query
        
        if curso_id:
            query = query.filter_by(curso_id=curso_id)
        
        estudiantes = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Incluir información del curso
        result = []
        for estudiante in estudiantes.items:
            est_dict = estudiante.to_dict()
            if estudiante.curso:
                est_dict['curso'] = estudiante.curso.to_dict()
            result.append(est_dict)
        
        return jsonify({
            'estudiantes': result,
            'pagination': {
                'page': estudiantes.page,
                'pages': estudiantes.pages,
                'per_page': estudiantes.per_page,
                'total': estudiantes.total
            }
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error al obtener estudiantes', 'error': str(e)}), 500

@estudiantes_bp.route('/<int:estudiante_id>', methods=['GET'])
@jwt_required()
def get_estudiante(estudiante_id):
    """Obtener estudiante específico"""
    try:
        current_user = get_current_user()
        
        # Verificar permisos
        if current_user.rol == 'familia':
            if current_user.estudiante_id != estudiante_id:
                return jsonify({'message': 'Solo puedes ver tu propio estudiante'}), 403
        
        estudiante = Estudiante.query.get_or_404(estudiante_id)
        
        result = estudiante.to_dict()
        if estudiante.curso:
            result['curso'] = estudiante.curso.to_dict()
        
        return jsonify({'estudiante': result}), 200
    except Exception as e:
        return jsonify({'message': 'Error al obtener estudiante', 'error': str(e)}), 500

@estudiantes_bp.route('/', methods=['POST'])
@role_required('admin')
def create_estudiante():
    """Crear nuevo estudiante (solo admin)"""
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ('nombre', 'curso_id')):
            return jsonify({'message': 'Faltan campos: nombre, curso_id'}), 400
        
        # Verificar que el curso existe
        curso = Curso.query.get(data['curso_id'])
        if not curso:
            return jsonify({'message': 'Curso no encontrado'}), 404
        
        estudiante = Estudiante(
            nombre=data['nombre'],
            curso_id=data['curso_id']
        )
        
        db.session.add(estudiante)
        db.session.commit()
        
        result = estudiante.to_dict()
        result['curso'] = curso.to_dict()
        
        return jsonify({
            'message': 'Estudiante creado exitosamente',
            'estudiante': result
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al crear estudiante', 'error': str(e)}), 500
