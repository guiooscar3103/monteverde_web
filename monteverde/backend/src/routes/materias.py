import re
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.extensions import db
from src.models.materia import Materia
from src.models.curso_materia import CursoMateria
from src.models.docente_asignacion import DocenteAsignacion
from src.utils.auth_helpers import role_required, get_current_user

materias_bp = Blueprint('materias', __name__)

@materias_bp.route('/materias', methods=['GET'])
@jwt_required(optional=True)
def list_materias():
    """
    Lista las asignaturas/materias disponibles.
    Filtros soportados:
    - search: búsqueda por nombre o código
    - area: filtro por área académica
    - activo: 'true'/'false'/'all' (por defecto muestra todas para admin y solo activas para otros)
    - curso_id: materias asociadas a un curso específico
    """
    try:
        current_user = get_current_user()
        query = Materia.query

        # Filtro por curso si se especifica
        curso_id = request.args.get('curso_id', type=int) or request.args.get('cursoId', type=int)
        if curso_id:
            query = query.join(CursoMateria, CursoMateria.materia_id == Materia.id).filter(
                CursoMateria.curso_id == curso_id,
                CursoMateria.activo == True
            )

        # Si el usuario es docente (y no consulta un curso específico ni es admin), filtrar por sus asignaciones
        if current_user and current_user.rol == 'docente' and not curso_id:
            solo_asignadas = request.args.get('solo_asignadas', 'true').lower() == 'true'
            if solo_asignadas:
                asignaciones = DocenteAsignacion.query.filter_by(docente_id=current_user.id).all()
                materia_ids = {a.materia_id for a in asignaciones}
                query = query.filter(Materia.id.in_(list(materia_ids)))

        # Filtro de activo / inactivo
        activo_param = request.args.get('activo')
        include_inactive = request.args.get('include_inactive', '').lower() in ('true', '1')
        
        if activo_param is not None:
            if activo_param.lower() in ('true', '1'):
                query = query.filter(Materia.activo == True)
            elif activo_param.lower() in ('false', '0'):
                query = query.filter(Materia.activo == False)
        elif not include_inactive and (not current_user or current_user.rol not in ('admin', 'coordinador')):
            # Usuarios no administradores/coordinadores ven solo activas por defecto
            query = query.filter(Materia.activo == True)

        # Filtro por área
        area = request.args.get('area')
        if area:
            query = query.filter(Materia.area == area.strip())

        # Búsqueda por texto (nombre o código)
        search = request.args.get('search') or request.args.get('q')
        if search:
            term = f"%{search.strip()}%"
            query = query.filter(db.or_(Materia.nombre.ilike(term), Materia.codigo.ilike(term), Materia.area.ilike(term)))

        materias = query.order_by(Materia.nombre).all()
        return jsonify({'success': True, 'data': [m.to_dict() for m in materias]}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error al obtener materias', 'error': str(e)}), 500


@materias_bp.route('/materias/<int:materia_id>', methods=['GET'])
@jwt_required(optional=True)
def get_materia(materia_id):
    """Obtiene el detalle de una asignatura por su ID."""
    try:
        materia = Materia.query.get_or_404(materia_id)
        return jsonify({'success': True, 'data': materia.to_dict()}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error al consultar la materia', 'error': str(e)}), 500


@materias_bp.route('/materias', methods=['POST'])
@role_required('admin', 'coordinador')
def create_materia():
    """
    Crea una nueva asignatura en el catálogo académico.
    Payload: { nombre, codigo, descripcion, area, intensidad_horaria, activo }
    """
    try:
        data = request.get_json() or {}
        nombre = (data.get('nombre') or '').strip()
        codigo = (data.get('codigo') or '').strip().upper() or None
        descripcion = (data.get('descripcion') or '').strip() or None
        area = (data.get('area') or '').strip() or 'General'
        intensidad_horaria = data.get('intensidad_horaria', 0)
        activo = data.get('activo', True)

        if not nombre:
            return jsonify({'success': False, 'message': 'El nombre de la asignatura es obligatorio'}), 400

        try:
            intensidad_horaria = int(intensidad_horaria)
            if intensidad_horaria < 0:
                intensidad_horaria = 0
        except (ValueError, TypeError):
            intensidad_horaria = 0

        # Validar duplicados de nombre
        if Materia.query.filter(db.func.lower(Materia.nombre) == nombre.lower()).first():
            return jsonify({'success': False, 'message': f"Ya existe una asignatura con el nombre '{nombre}'"}), 409

        # Validar duplicados de código si se suministró
        if codigo and Materia.query.filter(db.func.lower(Materia.codigo) == codigo.lower()).first():
            return jsonify({'success': False, 'message': f"Ya existe una asignatura con el código '{codigo}'"}), 409

        nueva_materia = Materia(
            nombre=nombre,
            codigo=codigo,
            descripcion=descripcion,
            area=area,
            intensidad_horaria=intensidad_horaria,
            activo=bool(activo),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.session.add(nueva_materia)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f"Asignatura '{nombre}' creada exitosamente.",
            'data': nueva_materia.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Error al crear la asignatura', 'error': str(e)}), 500


@materias_bp.route('/materias/<int:materia_id>', methods=['PUT'])
@role_required('admin', 'coordinador')
def update_materia(materia_id):
    """
    Actualiza los datos de una asignatura existente.
    """
    try:
        materia = Materia.query.get(materia_id)
        if not materia:
            return jsonify({'success': False, 'message': 'Asignatura no encontrada'}), 404

        data = request.get_json() or {}
        nombre = data.get('nombre')
        codigo = data.get('codigo')
        descripcion = data.get('descripcion')
        area = data.get('area')
        intensidad_horaria = data.get('intensidad_horaria')
        activo = data.get('activo')

        if nombre is not None:
            nombre = nombre.strip()
            if not nombre:
                return jsonify({'success': False, 'message': 'El nombre no puede estar vacío'}), 400
            
            existente = Materia.query.filter(
                db.func.lower(Materia.nombre) == nombre.lower(),
                Materia.id != materia.id
            ).first()
            if existente:
                return jsonify({'success': False, 'message': f"Ya existe otra asignatura con el nombre '{nombre}'"}), 409
            materia.nombre = nombre

        if codigo is not None:
            codigo = codigo.strip().upper() or None
            if codigo:
                existente_cod = Materia.query.filter(
                    db.func.lower(Materia.codigo) == codigo.lower(),
                    Materia.id != materia.id
                ).first()
                if existente_cod:
                    return jsonify({'success': False, 'message': f"Ya existe otra asignatura con el código '{codigo}'"}), 409
            materia.codigo = codigo

        if descripcion is not None:
            materia.descripcion = descripcion.strip() or None

        if area is not None:
            materia.area = area.strip() or 'General'

        if intensidad_horaria is not None:
            try:
                val = int(intensidad_horaria)
                materia.intensidad_horaria = max(0, val)
            except (ValueError, TypeError):
                pass

        if activo is not None:
            materia.activo = bool(activo)

        materia.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f"Asignatura '{materia.nombre}' actualizada exitosamente.",
            'data': materia.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Error al actualizar la asignatura', 'error': str(e)}), 500


@materias_bp.route('/materias/<int:materia_id>/toggle-activo', methods=['PATCH'])
@role_required('admin', 'coordinador')
def toggle_activo_materia(materia_id):
    """Alterna el estado activo/inactivo de una asignatura."""
    try:
        materia = Materia.query.get(materia_id)
        if not materia:
            return jsonify({'success': False, 'message': 'Asignatura no encontrada'}), 404

        materia.activo = not bool(materia.activo)
        materia.updated_at = datetime.utcnow()
        db.session.commit()

        estado_str = 'activada' if materia.activo else 'desactivada'
        return jsonify({
            'success': True,
            'message': f"Asignatura '{materia.nombre}' {estado_str} correctamente.",
            'data': materia.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Error al cambiar estado de la asignatura', 'error': str(e)}), 500


@materias_bp.route('/materias/<int:materia_id>', methods=['DELETE'])
@role_required('admin', 'coordinador')
def delete_materia(materia_id):
    """
    Elimina una asignatura de forma segura:
    - Si tiene asignaciones a docentes, notas registradas, indicadores o tareas, no se borra físicamente;
      en su lugar se desactiva (activo = False) preservando los datos históricos.
    - Si es una asignatura nueva sin dependencias, se elimina físicamente.
    """
    try:
        materia = Materia.query.get(materia_id)
        if not materia:
            return jsonify({'success': False, 'message': 'Asignatura no encontrada'}), 404

        from src.models.calificacion_bimestre import CalificacionBimestre
        from src.models.indicador_logro import IndicadorLogro
        from src.models.tarea import Tarea

        # Verificar dependencias
        asignaciones_count = DocenteAsignacion.query.filter_by(materia_id=materia.id).count()
        curso_materias_count = CursoMateria.query.filter_by(materia_id=materia.id).count()
        indicadores_count = IndicadorLogro.query.filter_by(materia_id=materia.id).count()
        tareas_count = Tarea.query.filter_by(materia_id=materia.id).count()

        tiene_dependencias = any([
            asignaciones_count > 0,
            indicadores_count > 0,
            tareas_count > 0
        ])

        if tiene_dependencias:
            # Soft deactivation
            materia.activo = False
            materia.updated_at = datetime.utcnow()
            
            # Desactivar también en curso_materia
            CursoMateria.query.filter_by(materia_id=materia.id).update({'activo': False})
            
            db.session.commit()

            return jsonify({
                'success': True,
                'soft_deleted': True,
                'message': f"La asignatura '{materia.nombre}' tiene registros académicos históricos vinculados ({asignaciones_count} asignaciones docentes, {tareas_count} tareas). Se ha desactivado del catálogo para preservar los datos.",
                'data': materia.to_dict()
            }), 200
        else:
            # Eliminación física segura
            CursoMateria.query.filter_by(materia_id=materia.id).delete()
            db.session.delete(materia)
            db.session.commit()

            return jsonify({
                'success': True,
                'soft_deleted': False,
                'message': f"Asignatura '{materia.nombre}' eliminada permanentemente del catálogo."
            }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Error al eliminar la asignatura', 'error': str(e)}), 500

