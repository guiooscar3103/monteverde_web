import jwt
import os
import json
# Trigger backend reload to connect to started MySQL db
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import decode_token, jwt_required, get_jwt_identity
from src.extensions import db
from src.models.usuario import Usuario
from src.models.curso import Curso
from src.models.estudiante import Estudiante
from src.models.materia import Materia
from src.models.docente_asignacion import DocenteAsignacion
from src.models.docente_curso import DocenteCurso
from src.services.admin_service import AdminService
from src.services.configuracion_service import ConfiguracionService

admin_bp = Blueprint('admin_routes', __name__)

def get_current_admin_id():
    """Helper to decode operator ID from Bearer token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    try:
        payload = decode_token(token)
        return payload.get('sub') or payload.get('user_id')
    except Exception as e:
        print(f"⚠️ Error decoding token: {e}")
        return None

def _get_cursos_asignados_docente(docente):
    """Obtener cursos asignados a un docente (legacy + nuevos)"""
    cursos_asignados = []
    
    # Legacy course-only assignments
    curso_legacy = DocenteCurso.query.filter_by(docente_id=docente.id).all()
    for item in curso_legacy:
        if item.curso:
            cursos_asignados.append({
                'id': f'legacy-{item.id}',
                'docente_id': docente.id,
                'curso_id': item.curso_id,
                'curso_nombre': item.curso.nombre,
                'curso_nivel': item.curso.nivel,
                'curso_letra': item.curso.letra,
                'materia_id': None,
                'materia_nombre': 'Sin materia asignada',
                'legacy': True
            })
    
    # Course + subject assignments
    asignaciones = DocenteAsignacion.query.filter_by(docente_id=docente.id).all()
    for a in asignaciones:
        cursos_asignados.append({
            'id': a.id,
            'docente_id': docente.id,
            'curso_id': a.curso_id,
            'curso_nombre': a.curso_nombre,
            'curso_nivel': a.curso_nivel,
            'curso_letra': a.curso_letra,
            'materia_id': a.materia_id,
            'materia_nombre': a.materia_nombre,
            'materia_descripcion': a.materia_descripcion,
            'legacy': False
        })
    
    return cursos_asignados

def _find_assignment(assignment_id, docente_id, curso_id, materia_id):
    """Buscar asignación por ID o combinación de parámetros"""
    if assignment_id:
        return DocenteAsignacion.query.get(assignment_id)
    if docente_id and curso_id and materia_id is not None:
        return DocenteAsignacion.query.filter_by(docente_id=docente_id, curso_id=curso_id, materia_id=materia_id).first()
    if docente_id and curso_id:
        return DocenteCurso.query.filter_by(docente_id=docente_id, curso_id=curso_id).first()
    return None

def _get_detalles_desasignacion(asignacion, docente_id):
    """Generar detalles de la desasignación para el log"""
    if isinstance(asignacion, DocenteCurso):
        curso = Curso.query.get(asignacion.curso_id)
        docente = Usuario.query.get(asignacion.docente_id)
        return f"Se desasignó el curso '{curso.nombre}' ({curso.nivel}°{curso.letra}) del docente {docente.nombre if docente else docente_id}"
    
    curso = Curso.query.get(asignacion.curso_id)
    docente = Usuario.query.get(asignacion.docente_id)
    materia = Materia.query.get(asignacion.materia_id)
    return f"Se desasignó '{materia.nombre if materia else 'una materia'}' del curso '{curso.nombre}' ({curso.nivel}°{curso.letra}) del docente {docente.nombre if docente else docente_id}"

@admin_bp.route('/estadisticas', methods=['GET'])
def get_estadisticas():
    """Obtener estadísticas y KPIs generales del sistema"""
    try:
        stats = AdminService.get_estadisticas()
        return jsonify({
            'success': True,
            'data': stats
        }), 200
    except Exception as e:
        print(f"❌ Error en get_estadisticas route: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/auditoria', methods=['GET'])
def get_auditoria():
    """Obtener la bitácora de auditoría reciente"""
    try:
        logs = AdminService.get_auditoria()
        return jsonify({
            'success': True,
            'data': logs
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/docentes', methods=['GET'])
def get_docentes_asignaciones():
    """Obtener listado de docentes y sus asignaciones de curso y materia"""
    try:
        docentes = Usuario.query.filter_by(rol='docente', eliminado=False).order_by(Usuario.nombre).all()
        docentes_data = []
        
        for d in docentes:
            d_dict = d.to_dict()
            d_dict['cursos_asignados'] = _get_cursos_asignados_docente(d)
            docentes_data.append(d_dict)
            
        return jsonify({
            'success': True,
            'data': docentes_data
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/docentes/asignar', methods=['POST'])
def asignar_curso():
    """Asignar un curso y materia a un docente"""
    try:
        admin_id = get_current_admin_id()
        data = request.get_json() or {}
        docente_id = data.get('docente_id')
        curso_id = data.get('curso_id')
        materia_id = data.get('materia_id')
        
        if not docente_id or not curso_id or not materia_id:
            return jsonify({'success': False, 'message': 'Faltan parámetros: docente_id, curso_id y materia_id'}), 400
            
        # Verificar que el docente, curso y materia existen
        docente = Usuario.query.filter_by(id=docente_id, rol='docente', eliminado=False).first()
        curso = Curso.query.get(curso_id)
        materia = Materia.query.get(materia_id)
        
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no encontrado'}), 404
        if not curso:
            return jsonify({'success': False, 'message': 'Curso no encontrado'}), 404
        if not materia:
            return jsonify({'success': False, 'message': 'Materia no encontrada'}), 404
            
        # Verificar si ya está asignado el mismo curso+materia
        existente = DocenteAsignacion.query.filter_by(docente_id=docente_id, curso_id=curso_id, materia_id=materia_id).first()
        if existente:
            return jsonify({'success': False, 'message': 'La asignación curso+materia ya existe para este docente'}), 400
            
        asignacion = DocenteAsignacion(docente_id=docente_id, curso_id=curso_id, materia_id=materia_id)
        db.session.add(asignacion)
        db.session.commit()
        
        # Log
        AdminService.log_actividad(
            usuario_id=admin_id,
            accion='ASIGNAR_CURSO_MATERIA',
            detalles=f"Se asignó '{materia.nombre}' en el curso '{curso.nombre}' ({curso.nivel}°{curso.letra}) al docente {docente.nombre} ({docente.email})"
        )
        
        return jsonify({'success': True, 'message': 'Asignación curso+materia creada exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/docentes/desasignar', methods=['POST'])
def desasignar_curso():
    """Desasignar una asignación de curso y materia de un docente"""
    try:
        admin_id = get_current_admin_id()
        data = request.get_json() or {}
        assignment_id = data.get('assignment_id')
        docente_id = data.get('docente_id')
        curso_id = data.get('curso_id')
        materia_id = data.get('materia_id')

        asignacion = _find_assignment(assignment_id, docente_id, curso_id, materia_id)
        if not asignacion:
            return jsonify({'success': False, 'message': 'La asignación no existe'}), 404

        db.session.delete(asignacion)
        db.session.commit()
        
        detalles = _get_detalles_desasignacion(asignacion, docente_id)
        AdminService.log_actividad(
            usuario_id=admin_id,
            accion='DESASIGNAR_ASIGNACION',
            detalles=detalles
        )

        return jsonify({'success': True, 'message': 'Asignación desasignada exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/familias', methods=['GET'])
def get_familias_vinculos():
    """Obtener listado de familias y sus vínculos con estudiantes"""
    try:
        familias = Usuario.query.filter_by(rol='familia', eliminado=False).order_by(Usuario.nombre).all()
        familias_data = []
        
        for f in familias:
            f_dict = f.to_dict()
            familias_data.append(f_dict)
            
        return jsonify({
            'success': True,
            'data': familias_data
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/familias/vincular', methods=['POST'])
def vincular_estudiante():
    """Vincular una cuenta de familia a un estudiante"""
    try:
        admin_id = get_current_admin_id()
        data = request.get_json() or {}
        familia_id = data.get('familia_id')
        estudiante_id = data.get('estudiante_id')
        
        if not familia_id or not estudiante_id:
            return jsonify({'success': False, 'message': 'Faltan parámetros: familia_id y estudiante_id'}), 400
            
        familia = Usuario.query.filter_by(id=familia_id, rol='familia', eliminado=False).first()
        estudiante = Estudiante.query.get(estudiante_id)
        
        if not familia:
            return jsonify({'success': False, 'message': 'Familia no encontrada'}), 404
        if not estudiante:
            return jsonify({'success': False, 'message': 'Estudiante no encontrado'}), 404
            
        # Validar que un estudiante no se vincule dos veces a la misma familia
        if estudiante in familia.estudiantes:
            return jsonify({'success': False, 'message': 'El estudiante ya está vinculado a esta familia'}), 400
            
        # Vincular (relación Many-to-Many)
        familia.estudiantes.append(estudiante)
        
        # Mantener la columna legacy para compatibilidad
        if not familia.estudiante_id:
            familia.estudiante_id = estudiante_id
            
        db.session.commit()
        
        # Log de auditoría
        AdminService.log_actividad(
            usuario_id=admin_id,
            accion='VINCULAR_ESTUDIANTE',
            detalles=f"Se vinculó al estudiante {estudiante.nombre} (# {estudiante.id}) con la cuenta familiar {familia.nombre} ({familia.email})"
        )
        
        return jsonify({'success': True, 'message': 'Estudiante vinculado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/familias/desvincular', methods=['POST'])
def desvincular_estudiante():
    """Desvincular una cuenta de familia de un estudiante de manera individual"""
    try:
        admin_id = get_current_admin_id()
        data = request.get_json() or {}
        familia_id = data.get('familia_id')
        estudiante_id = data.get('estudiante_id')
        
        if not familia_id or not estudiante_id:
            return jsonify({'success': False, 'message': 'Faltan parámetros: familia_id y estudiante_id'}), 400
            
        familia = Usuario.query.filter_by(id=familia_id, rol='familia', eliminado=False).first()
        if not familia:
            return jsonify({'success': False, 'message': 'Familia no encontrada'}), 404
            
        estudiante = Estudiante.query.get(estudiante_id)
        if not estudiante:
            return jsonify({'success': False, 'message': 'Estudiante no encontrado'}), 404
            
        if estudiante not in familia.estudiantes:
            return jsonify({'success': False, 'message': 'El estudiante no está vinculado a esta familia'}), 400
            
        # Desvincular individualmente de la relación Many-to-Many
        familia.estudiantes.remove(estudiante)
        
        # Actualizar columna legacy estudiante_id si es necesario
        if familia.estudiante_id == estudiante_id:
            familia.estudiante_id = familia.estudiantes[0].id if familia.estudiantes else None
            
        db.session.commit()
        
        # Log de auditoría
        AdminService.log_actividad(
            usuario_id=admin_id,
            accion='DESVINCULAR_ESTUDIANTE',
            detalles=f"Se desvinculó al estudiante {estudiante.nombre} de la cuenta familiar {familia.nombre} ({familia.email})"
        )
        
        return jsonify({'success': True, 'message': 'Estudiante desvinculado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/configuracion', methods=['GET'])
@admin_bp.route('/configuracion-institucional', methods=['GET'])
def get_configuracion():
    """Obtener la configuración institucional de MonteVerde desde la base de datos"""
    try:
        config_data = ConfiguracionService.get_configuracion()
        return jsonify({'success': True, 'data': config_data}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno al consultar la configuración institucional'}), 500


@admin_bp.route('/configuracion', methods=['POST', 'PUT'])
@admin_bp.route('/configuracion-institucional', methods=['POST', 'PUT'])
@jwt_required()
def save_configuracion():
    """Actualizar la configuración institucional de MonteVerde con validación y persistencia en BD"""
    try:
        user_id = get_jwt_identity()
        user = Usuario.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

        if user.rol != 'admin':
            return jsonify({
                'success': False,
                'message': 'Acceso denegado. Solo un usuario con rol de administrador puede modificar la configuración.'
            }), 403

        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'El cuerpo de la solicitud no contiene datos válidos'}), 400

        success, result, status_code = ConfiguracionService.update_configuracion(
            data=data,
            usuario_id=user.id
        )

        if not success:
            return jsonify({'success': False, 'message': result}), status_code

        return jsonify({
            'success': True,
            'message': 'Configuración institucional guardada exitosamente',
            'data': result
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error interno al guardar la configuración institucional'}), 500

