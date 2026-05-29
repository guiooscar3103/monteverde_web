import jwt
import os
import json
# Trigger backend reload to connect to started MySQL db
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import decode_token
from src.extensions import db
from src.models.usuario import Usuario
from src.models.curso import Curso
from src.models.estudiante import Estudiante
from src.models.materia import Materia
from src.models.docente_asignacion import DocenteAsignacion
from src.models.docente_curso import DocenteCurso
from src.services.admin_service import AdminService

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
            cursos_asignados = []

            # Legacy course-only assignments
            curso_legacy = DocenteCurso.query.filter_by(docente_id=d.id).all()
            for item in curso_legacy:
                if item.curso:
                    cursos_asignados.append({
                        'id': f'legacy-{item.id}',
                        'docente_id': d.id,
                        'curso_id': item.curso_id,
                        'curso_nombre': item.curso.nombre,
                        'curso_nivel': item.curso.nivel,
                        'curso_letra': item.curso.letra,
                        'materia_id': None,
                        'materia_nombre': 'Sin materia asignada',
                        'legacy': True
                    })

            # Course + subject assignments
            asignaciones = DocenteAsignacion.query.filter_by(docente_id=d.id).all()
            for a in asignaciones:
                cursos_asignados.append({
                    'id': a.id,
                    'docente_id': d.id,
                    'curso_id': a.curso_id,
                    'curso_nombre': a.curso_nombre,
                    'curso_nivel': a.curso_nivel,
                    'curso_letra': a.curso_letra,
                    'materia_id': a.materia_id,
                    'materia_nombre': a.materia_nombre,
                    'materia_descripcion': a.materia_descripcion,
                    'legacy': False
                })

            d_dict = d.to_dict()
            d_dict['cursos_asignados'] = cursos_asignados
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

        asignacion = None
        if assignment_id:
            asignacion = DocenteAsignacion.query.get(assignment_id)
        elif docente_id and curso_id and materia_id is not None:
            asignacion = DocenteAsignacion.query.filter_by(docente_id=docente_id, curso_id=curso_id, materia_id=materia_id).first()
        elif docente_id and curso_id:
            # Fallback for legacy course-only assignment
            asignacion = DocenteCurso.query.filter_by(docente_id=docente_id, curso_id=curso_id).first()

        if not asignacion:
            return jsonify({'success': False, 'message': 'La asignación no existe'}), 404

        # Delete legacy or new assignment
        if isinstance(asignacion, DocenteCurso):
            curso = Curso.query.get(asignacion.curso_id)
            docente = Usuario.query.get(asignacion.docente_id)
            db.session.delete(asignacion)
            detalles = f"Se desasignó el curso '{curso.nombre}' ({curso.nivel}°{curso.letra}) del docente {docente.nombre if docente else docente_id}"
        else:
            curso = Curso.query.get(asignacion.curso_id)
            docente = Usuario.query.get(asignacion.docente_id)
            materia = Materia.query.get(asignacion.materia_id)
            db.session.delete(asignacion)
            detalles = f"Se desasignó '{materia.nombre if materia else 'una materia'}' del curso '{curso.nombre}' ({curso.nivel}°{curso.letra}) del docente {docente.nombre if docente else docente_id}"

        db.session.commit()
        
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
def get_configuracion():
    """Obtener la configuración institucional de MonteVerde"""
    try:
        config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config_institucion.json')
        if not os.path.exists(config_path):
            # Crear valor por defecto
            default_config = {
                "nombre_institucion": "Colegio MonteVerde",
                "director": "Dr. Fernando MonteVerde",
                "anio_escolar": "2026",
                "periodo_actual": "Primer Trimestre",
                "direccion": "Calle de la Arboleda #45, Ciudad Jardín",
                "telefono": "+57 (601) 456-7890",
                "email_contacto": "contacto@monteverde.edu.co"
            }
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, ensure_ascii=False, indent=2)
            return jsonify({'success': True, 'data': default_config}), 200
        
        with open(config_path, 'r', encoding='utf-8') as f:
            config_data = json.load(f)
            
        return jsonify({'success': True, 'data': config_data}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/configuracion', methods=['POST'])
def save_configuracion():
    """Actualizar la configuración institucional de MonteVerde"""
    try:
        admin_id = get_current_admin_id()
        data = request.get_json() or {}
        
        config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config_institucion.json')
        
        # Validar campos mínimos
        required = ["nombre_institucion", "director", "anio_escolar", "periodo_actual"]
        for field in required:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'El campo {field} es requerido'}), 400
                
        # Guardar
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        # Log de auditoría
        AdminService.log_actividad(
            usuario_id=admin_id,
            accion='ACTUALIZAR_CONFIGURACION',
            detalles=f"Se actualizó la configuración de la institución. Nombre: {data.get('nombre_institucion')}, Director: {data.get('director')}"
        )
        
        return jsonify({'success': True, 'message': 'Configuración institucional guardada exitosamente'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
