from collections import defaultdict
from flask import Blueprint, jsonify
from src.extensions import db
from src.models.estudiante import Estudiante
from src.models.curso import Curso
from src.models.usuario import Usuario, familia_estudiante
from src.models.docente_asignacion import DocenteAsignacion
from src.utils.auth_helpers import role_required, get_current_user

estudiantes_bp = Blueprint('estudiantes_custom', __name__)

@estudiantes_bp.route('/estudiantes/por-curso/<int:curso_id>', methods=['GET'])
@role_required('docente', 'admin')
def get_estudiantes_por_curso(curso_id):
    """
    Obtener estudiantes de un curso con sus familias/acudientes asociados.
    Si el solicitante es docente, valida que tenga asignado el curso (403 si no).
    Optimizado contra N+1 mediante subconsultas por lotes.
    """
    try:
        current_user = get_current_user()
        if current_user and current_user.rol == 'docente':
            asignado = DocenteAsignacion.query.filter_by(
                docente_id=current_user.id,
                curso_id=curso_id
            ).first()
            if not asignado:
                return jsonify({
                    'success': False,
                    'message': 'No tienes asignado este curso'
                }), 403

        curso = Curso.query.get(curso_id)
        if not curso:
            return jsonify({'success': False, 'message': 'Curso no encontrado'}), 404

        estudiantes = Estudiante.query.filter_by(curso_id=curso_id).order_by(Estudiante.nombre.asc()).all()
        estudiante_ids = [e.id for e in estudiantes]
        familias_por_estudiante = defaultdict(list)

        if estudiante_ids:
            # 1. Relación Many-to-Many mediante tabla asociativa familia_estudiante
            m2m_rows = db.session.query(
                familia_estudiante.c.estudiante_id,
                Usuario
            ).join(
                Usuario, Usuario.id == familia_estudiante.c.familia_id
            ).filter(
                familia_estudiante.c.estudiante_id.in_(estudiante_ids),
                Usuario.rol == 'familia',
                Usuario.activo == True,
                Usuario.eliminado == False
            ).all()

            for est_id, fam_user in m2m_rows:
                familias_por_estudiante[est_id].append({
                    'id': fam_user.id,
                    'familia_id': fam_user.id,
                    'nombre': fam_user.nombre,
                    'familia_nombre': fam_user.nombre,
                    'email': fam_user.email,
                    'familia_email': fam_user.email,
                    'rol': fam_user.rol
                })

            # 2. Relación Legacy mediante Usuario.estudiante_id
            legacy_rows = Usuario.query.filter(
                Usuario.estudiante_id.in_(estudiante_ids),
                Usuario.rol == 'familia',
                Usuario.activo == True,
                Usuario.eliminado == False
            ).all()

            for fam_user in legacy_rows:
                est_id = fam_user.estudiante_id
                existing_ids = {f['id'] for f in familias_por_estudiante[est_id]}
                if fam_user.id not in existing_ids:
                    familias_por_estudiante[est_id].append({
                        'id': fam_user.id,
                        'familia_id': fam_user.id,
                        'nombre': fam_user.nombre,
                        'familia_nombre': fam_user.nombre,
                        'email': fam_user.email,
                        'familia_email': fam_user.email,
                        'rol': fam_user.rol
                    })

        estudiantes_data = []
        for estudiante in estudiantes:
            est_dict = estudiante.to_dict()
            est_dict['curso_nombre'] = curso.nombre
            est_dict['nivel'] = curso.nivel
            est_dict['letra'] = curso.letra
            est_dict['familias'] = familias_por_estudiante.get(estudiante.id, [])
            estudiantes_data.append(est_dict)
            
        return jsonify({
            'success': True,
            'curso_id': curso_id,
            'curso_nombre': curso.nombre,
            'data': estudiantes_data
        }), 200
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
