from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.extensions import db
from src.models.calificacion import Calificacion
from src.models.estudiante import Estudiante
from src.utils.auth_helpers import role_required, get_current_user
from datetime import datetime

calificaciones_bp = Blueprint('calificaciones', __name__, url_prefix='/calificaciones')

@calificaciones_bp.route('/', methods=['GET'])
@jwt_required()
def list_calificaciones():
    """Listar calificaciones con filtros"""
    try:
        current_user = get_current_user()
        
        # Parámetros de filtro
        estudiante_id = request.args.get('estudiante_id', type=int)
        asignatura = request.args.get('asignatura')
        periodo = request.args.get('periodo')
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        query = Calificacion.query
        
        # Filtros según rol
        if current_user.rol == 'familia':
            if not estudiante_id or current_user.estudiante_id != estudiante_id:
                return jsonify({'message': 'Solo puedes ver calificaciones de tu estudiante'}), 403
            query = query.filter_by(estudiante_id=estudiante_id)
        else:
            if estudiante_id:
                query = query.filter_by(estudiante_id=estudiante_id)
        
        if asignatura:
            query = query.filter_by(asignatura=asignatura)
        if periodo:
            query = query.filter_by(periodo=periodo)
        
        calificaciones = query.order_by(
            Calificacion.fecha_registro.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        # Incluir información del estudiante
        result = []
        for calif in calificaciones.items:
            calif_dict = calif.to_dict()
            if calif.estudiante:
                calif_dict['estudiante'] = {
                    'id': calif.estudiante.id,
                    'nombre': calif.estudiante.nombre
                }
            result.append(calif_dict)
        
        return jsonify({
            'calificaciones': result,
            'pagination': {
                'page': calificaciones.page,
                'pages': calificaciones.pages,
                'per_page': calificaciones.per_page,
                'total': calificaciones.total
            }
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error al obtener calificaciones', 'error': str(e)}), 500

@calificaciones_bp.route('/', methods=['POST'])
@role_required('docente', 'admin')
def create_calificacion():
    """Crear nueva calificación"""
    try:
        data = request.get_json()
        
        required_fields = ['estudiante_id', 'asignatura', 'periodo', 'nota']
        if not data or not all(k in data for k in required_fields):
            return jsonify({'message': f'Faltan campos: {required_fields}'}), 400
        
        # Validar nota
        nota = float(data['nota'])
        if not (0.0 <= nota <= 5.0):
            return jsonify({'message': 'La nota debe estar entre 0.0 y 5.0'}), 400
        
        # Verificar que el estudiante existe
        estudiante = Estudiante.query.get(data['estudiante_id'])
        if not estudiante:
            return jsonify({'message': 'Estudiante no encontrado'}), 404
        
        # Verificar si ya existe calificación para este estudiante/asignatura/periodo
        existing = Calificacion.query.filter_by(
            estudiante_id=data['estudiante_id'],
            asignatura=data['asignatura'],
            periodo=data['periodo']
        ).first()
        
        if existing:
            return jsonify({
                'message': 'Ya existe calificación para este estudiante/asignatura/periodo',
                'existing_id': existing.id
            }), 409
        
        calificacion = Calificacion(
            estudiante_id=data['estudiante_id'],
            asignatura=data['asignatura'],
            periodo=data['periodo'],
            nota=nota
        )
        
        db.session.add(calificacion)
        db.session.commit()
        
        result = calificacion.to_dict()
        result['estudiante'] = {
            'id': estudiante.id,
            'nombre': estudiante.nombre
        }
        
        return jsonify({
            'message': 'Calificación creada exitosamente',
            'calificacion': result
        }), 201
        
    except ValueError:
        return jsonify({'message': 'Nota debe ser un número válido'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al crear calificación', 'error': str(e)}), 500

@calificaciones_bp.route('/<int:calificacion_id>', methods=['PUT'])
@role_required('docente', 'admin')
def update_calificacion(calificacion_id):
    """Actualizar calificación"""
    try:
        calificacion = Calificacion.query.get_or_404(calificacion_id)
        data = request.get_json()
        
        if 'nota' in data:
            nota = float(data['nota'])
            if not (0.0 <= nota <= 5.0):
                return jsonify({'message': 'La nota debe estar entre 0.0 y 5.0'}), 400
            calificacion.nota = nota
        
        if 'asignatura' in data:
            calificacion.asignatura = data['asignatura']
        if 'periodo' in data:
            calificacion.periodo = data['periodo']
        
        calificacion.fecha_registro = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Calificación actualizada exitosamente',
            'calificacion': calificacion.to_dict()
        }), 200
        
    except ValueError:
        return jsonify({'message': 'Nota debe ser un número válido'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al actualizar calificación', 'error': str(e)}), 500

@calificaciones_bp.route('/periodos', methods=['GET'])
@jwt_required()
def list_periodos():
    """Obtener lista de períodos únicos"""
    try:
        periodos = db.session.query(Calificacion.periodo).distinct().all()
        periodos_list = [p[0] for p in periodos if p[0]]
        
        return jsonify({'periodos': sorted(periodos_list)}), 200
    except Exception as e:
        return jsonify({'message': 'Error al obtener períodos', 'error': str(e)}), 500

@calificaciones_bp.route('/asignaturas', methods=['GET'])
@jwt_required()
def list_asignaturas():
    """Obtener lista de asignaturas únicas"""
    try:
        asignaturas = db.session.query(Calificacion.asignatura).distinct().all()
        asignaturas_list = [a[0] for a in asignaturas if a[0]]
        
        return jsonify({'asignaturas': sorted(asignaturas_list)}), 200
    except Exception as e:
        return jsonify({'message': 'Error al obtener asignaturas', 'error': str(e)}), 500
