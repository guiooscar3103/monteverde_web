from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.extensions import db
from src.models.usuario import Usuario
from src.models.curso import Curso
from src.models.materia import Materia
from src.models.docente_asignacion import DocenteAsignacion
from src.utils.auth_helpers import role_required, get_current_user

assignments_bp = Blueprint('assignments', __name__, url_prefix='/assignments')

@assignments_bp.route('', methods=['POST'])
@role_required('admin')
def create_assignment():
    try:
        data = request.get_json() or {}
        docente_id = data.get('teacher_id') or data.get('docente_id')
        curso_id = data.get('course_id') or data.get('curso_id')
        materia_id = data.get('subject_id') or data.get('materia_id')

        if not docente_id or not curso_id or not materia_id:
            return jsonify({'success': False, 'message': 'Faltan campos: teacher_id, course_id y subject_id'}), 400

        docente = Usuario.query.filter_by(id=docente_id, rol='docente', eliminado=False).first()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no encontrado'}), 404

        curso = Curso.query.get(curso_id)
        if not curso:
            return jsonify({'success': False, 'message': 'Curso no encontrado'}), 404

        materia = Materia.query.get(materia_id)
        if not materia:
            return jsonify({'success': False, 'message': 'Materia no encontrada'}), 404

        existente = DocenteAsignacion.query.filter_by(
            docente_id=docente_id,
            curso_id=curso_id,
            materia_id=materia_id
        ).first()
        if existente:
            return jsonify({'success': False, 'message': 'La asignación ya existe'}), 409

        asignacion = DocenteAsignacion(
            docente_id=docente_id,
            curso_id=curso_id,
            materia_id=materia_id
        )
        db.session.add(asignacion)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Asignación creada exitosamente', 'data': asignacion.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Error creando asignación', 'error': str(e)}), 500

@assignments_bp.route('/teacher/<int:docente_id>', methods=['GET'])
@role_required('admin')
def get_teacher_assignments(docente_id):
    try:
        docente = Usuario.query.filter_by(id=docente_id, rol='docente', eliminado=False).first()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no encontrado'}), 404

        asignaciones = DocenteAsignacion.query.filter_by(docente_id=docente_id).all()
        return jsonify({'success': True, 'data': [a.to_dict() for a in asignaciones]}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error obteniendo asignaciones', 'error': str(e)}), 500

@assignments_bp.route('/<int:assignment_id>', methods=['DELETE'])
@role_required('admin')
def delete_assignment(assignment_id):
    try:
        asignacion = DocenteAsignacion.query.get(assignment_id)
        if not asignacion:
            return jsonify({'success': False, 'message': 'Asignación no encontrada'}), 404

        db.session.delete(asignacion)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Asignación eliminada correctamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Error eliminando asignación', 'error': str(e)}), 500

@assignments_bp.route('/teacher/my-courses', methods=['GET'])
@role_required('docente')
def get_my_courses():
    try:
        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no encontrado en sesión'}), 404

        asignaciones = DocenteAsignacion.query.filter_by(docente_id=docente.id).all()
        grouped = {}

        for asignacion in asignaciones:
            curso_id = asignacion.curso_id
            if curso_id not in grouped:
                grouped[curso_id] = {
                    'curso_id': curso_id,
                    'curso_nombre': asignacion.curso_nombre,
                    'curso_nivel': asignacion.curso_nivel,
                    'curso_letra': asignacion.curso_letra,
                    'materias': []
                }
            grouped[curso_id]['materias'].append({
                'materia_id': asignacion.materia_id,
                'materia_nombre': asignacion.materia_nombre
            })

        return jsonify({'success': True, 'data': list(grouped.values())}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error obteniendo cursos del docente', 'error': str(e)}), 500
