from flask import Blueprint, jsonify
from src.extensions import db
from src.models.estudiante import Estudiante
from src.models.curso import Curso
from src.models.usuario import Usuario
from src.utils.auth_helpers import role_required

estudiantes_bp = Blueprint('estudiantes_custom', __name__)

@estudiantes_bp.route('/estudiantes/por-curso/<int:curso_id>', methods=['GET'])
@role_required('docente', 'admin')
def get_estudiantes_por_curso(curso_id):
    """Estudiantes de un curso."""
    try:
        estudiantes = db.session.query(Estudiante, Curso).join(Curso).filter(Estudiante.curso_id == curso_id).order_by(Estudiante.nombre).all()
        
        estudiantes_data = []
        for estudiante, curso in estudiantes:
            est_dict = estudiante.to_dict()
            est_dict['curso_nombre'] = curso.nombre
            est_dict['nivel'] = curso.nivel
            est_dict['letra'] = curso.letra
            estudiantes_data.append(est_dict)
            
        return jsonify({'success': True, 'data': estudiantes_data})
    except Exception as e:
        print(f"❌ Error estudiantes por curso: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@estudiantes_bp.route('/estudiantes', methods=['GET'])
@role_required('docente', 'admin')
def get_todos_los_estudiantes():
    """Obtener todos los estudiantes para dropdowns de vinculación."""
    try:
        estudiantes = Estudiante.query.order_by(Estudiante.nombre).all()
        return jsonify({
            'success': True,
            'data': [e.to_dict() for e in estudiantes]
        })
    except Exception as e:
        print(f"❌ Error al obtener estudiantes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@estudiantes_bp.route('/estudiantes/disponibles', methods=['GET'])
@role_required('admin')
def get_estudiantes_disponibles():
    """Obtener estudiantes no vinculados a ninguna familia."""
    try:
        from sqlalchemy import text
        # Obtener IDs de estudiantes vinculados desde la tabla de asociación
        linked_students_query = db.session.execute(text("SELECT estudiante_id FROM familia_estudiante")).fetchall()
        linked_student_ids = [row[0] for row in linked_students_query]
        
        # También incluir los que tengan estudiante_id en la tabla usuarios por compatibilidad
        legacy_linked = db.session.query(Usuario.estudiante_id).filter(
            Usuario.rol == 'familia',
            Usuario.estudiante_id.isnot(None)
        ).all()
        for r in legacy_linked:
            if r[0] not in linked_student_ids:
                linked_student_ids.append(r[0])

        estudiantes = Estudiante.query.filter(
            ~Estudiante.id.in_(linked_student_ids) if linked_student_ids else True
        ).order_by(Estudiante.nombre).all()

        return jsonify({
            'success': True,
            'data': [e.to_dict() for e in estudiantes]
        })
    except Exception as e:
        print(f"❌ Error al obtener estudiantes disponibles: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
