from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.extensions import db
from src.models.curso import Curso
from src.models.estudiante import Estudiante
from src.utils.auth_helpers import role_required, get_current_user

cursos_bp = Blueprint('cursos', __name__)

@cursos_bp.route('', methods=['GET'], strict_slashes=False)
@cursos_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required(optional=True)
def list_cursos():
    """Listar todos los cursos (o filtrados por docente)"""
    try:
        current_user = get_current_user()
        
        query = Curso.query
        
        # Si el usuario es docente, filtrar solo sus cursos asignados
        if current_user and current_user.rol == 'docente':
            from src.models.docente_asignacion import DocenteAsignacion
            from src.models.docente_curso import DocenteCurso
            
            asignaciones = DocenteAsignacion.query.filter_by(docente_id=current_user.id).all()
            curso_ids = {a.curso_id for a in asignaciones}
            
            legacy_asignaciones = DocenteCurso.query.filter_by(docente_id=current_user.id).all()
            for la in legacy_asignaciones:
                curso_ids.add(la.curso_id)
                
            query = query.filter(Curso.id.in_(list(curso_ids)))

        page = request.args.get('page', type=int)
        per_page = request.args.get('per_page', type=int)

        if page is None and per_page is None:
            cursos = query.order_by(Curso.nivel, Curso.letra).all()
            return jsonify({'success': True, 'data': [curso.to_dict() for curso in cursos]}), 200

        page = page or 1
        per_page = min(per_page or 10, 100)
        
        pagination = query.order_by(Curso.nivel, Curso.letra).paginate(page=page, per_page=per_page, error_out=False)
        return jsonify({
            'success': True,
            'data': {
                'cursos': [curso.to_dict() for curso in pagination.items],
                'pagination': {
                    'page': pagination.page,
                    'pages': pagination.pages,
                    'per_page': pagination.per_page,
                    'total': pagination.total,
                    'has_next': pagination.has_next,
                    'has_prev': pagination.has_prev
                }
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error al obtener cursos', 'error': str(e)}), 500

@cursos_bp.route('/<int:curso_id>', methods=['GET'])
@jwt_required()
def get_curso(curso_id):
    """Obtener curso específico con estudiantes"""
    try:
        curso = Curso.query.get_or_404(curso_id)
        estudiantes = Estudiante.query.filter_by(curso_id=curso_id).all()
        
        return jsonify({
            'success': True,
            'data': {
                'curso': curso.to_dict(),
                'estudiantes': [est.to_dict() for est in estudiantes],
                'total_estudiantes': len(estudiantes)
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error al obtener curso', 'error': str(e)}), 500

@cursos_bp.route('/', methods=['POST'], strict_slashes=False)
@role_required('admin')
def create_curso():
    """Crear nuevo curso (solo admin)"""
    try:
        data = request.get_json() or {}
        nombre = data.get('nombre') or data.get('nombre_curso')
        descripcion = data.get('descripcion')
        nivel = data.get('nivel')
        letra = data.get('letra')
        grado = data.get('grado')

        if grado and (not nivel or not letra):
            parsed_nivel, parsed_letra = Curso.parse_grado(grado)
            nivel = nivel or parsed_nivel
            letra = letra or parsed_letra

        if not nombre or not nivel:
            return jsonify({'success': False, 'message': 'Faltan campos obligatorios: nombre_curso y grado'}), 400

        if letra is None:
            letra = ''

        curso_existente = Curso.query.filter_by(nombre=nombre, nivel=nivel, letra=letra).first()
        if curso_existente:
            return jsonify({'success': False, 'message': 'El curso ya existe'}), 409

        curso = Curso(
            nombre=nombre,
            nivel=nivel,
            letra=letra,
            descripcion=descripcion
        )
        
        db.session.add(curso)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Curso creado exitosamente',
            'data': {'curso': curso.to_dict()}
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Error al crear curso', 'error': str(e)}), 500

@cursos_bp.route('/<int:curso_id>', methods=['PUT'])
@role_required('admin')
def update_curso(curso_id):
    """Actualizar curso (solo admin)"""
    try:
        curso = Curso.query.get_or_404(curso_id)
        data = request.get_json() or {}

        if 'nombre' in data or 'nombre_curso' in data:
            curso.nombre = data.get('nombre') or data.get('nombre_curso')

        if 'descripcion' in data:
            curso.descripcion = data.get('descripcion')

        if 'grado' in data or 'nivel' in data or 'letra' in data:
            nivel = data.get('nivel')
            letra = data.get('letra')
            grado = data.get('grado')

            if grado and (not nivel or not letra):
                parsed_nivel, parsed_letra = Curso.parse_grado(grado)
                nivel = nivel or parsed_nivel
                letra = letra or parsed_letra

            if nivel is not None:
                curso.nivel = nivel
            if letra is not None:
                curso.letra = letra

        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Curso actualizado exitosamente',
            'data': {'curso': curso.to_dict()}
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Error al actualizar curso', 'error': str(e)}), 500

@cursos_bp.route('/<int:curso_id>', methods=['DELETE'])
@role_required('admin')
def delete_curso(curso_id):
    """Eliminar curso (solo admin)"""
    try:
        curso = Curso.query.get_or_404(curso_id)
        
        # Verificar si tiene estudiantes
        estudiantes_count = Estudiante.query.filter_by(curso_id=curso_id).count()
        if estudiantes_count > 0:
            return jsonify({
                'success': False,
                'message': f'No se puede eliminar. El curso tiene {estudiantes_count} estudiantes'
            }), 409
        
        db.session.delete(curso)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Curso eliminado exitosamente'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Error al eliminar curso', 'error': str(e)}), 500
