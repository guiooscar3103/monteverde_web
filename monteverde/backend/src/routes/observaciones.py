from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.extensions import db
from src.models.observacion import Observacion
from src.models.estudiante import Estudiante
from src.utils.auth_helpers import role_required, get_current_user
from datetime import datetime, date

observaciones_bp = Blueprint('observaciones', __name__, url_prefix='/observaciones')

@observaciones_bp.route('/', methods=['GET'])
@jwt_required()
def list_observaciones():
    """Listar observaciones según permisos"""
    try:
        current_user = get_current_user()
        
        # Parámetros
        estudiante_id = request.args.get('estudiante_id', type=int)
        tipo = request.args.get('tipo')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        query = Observacion.query
        
        # Filtros según rol
        if current_user.rol == 'familia':
            if not estudiante_id or current_user.estudiante_id != estudiante_id:
                return jsonify({'message': 'Solo puedes ver observaciones de tu estudiante'}), 403
            query = query.filter_by(estudiante_id=estudiante_id)
        elif current_user.rol == 'docente':
            # Los docentes pueden ver todas las observaciones
            if estudiante_id:
                query = query.filter_by(estudiante_id=estudiante_id)
        else:  # admin
            if estudiante_id:
                query = query.filter_by(estudiante_id=estudiante_id)
        
        # Filtros adicionales
        if tipo:
            query = query.filter_by(tipo=tipo)
        
        if fecha_inicio:
            try:
                fecha_ini = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
                query = query.filter(Observacion.fecha >= fecha_ini)
            except ValueError:
                return jsonify({'message': 'Formato de fecha inválido (usar YYYY-MM-DD)'}), 400
        
        if fecha_fin:
            try:
                fecha_fin_date = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
                query = query.filter(Observacion.fecha <= fecha_fin_date)
            except ValueError:
                return jsonify({'message': 'Formato de fecha inválido (usar YYYY-MM-DD)'}), 400
        
        observaciones = query.order_by(
            Observacion.fecha.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        # Incluir información del estudiante y docente
        result = []
        for obs in observaciones.items:
            obs_dict = obs.to_dict()
            obs_dict['estudiante'] = {
                'id': obs.estudiante.id,
                'nombre': obs.estudiante.nombre
            }
            obs_dict['docente'] = {
                'id': obs.docente.id,
                'nombre': obs.docente.nombre
            }
            result.append(obs_dict)
        
        return jsonify({
            'observaciones': result,
            'pagination': {
                'page': observaciones.page,
                'pages': observaciones.pages,
                'per_page': observaciones.per_page,
                'total': observaciones.total
            }
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error al obtener observaciones', 'error': str(e)}), 500

@observaciones_bp.route('/', methods=['POST'])
@role_required('docente', 'admin')
def create_observacion():
    """Crear nueva observación"""
    try:
        current_user = get_current_user()
        data = request.get_json()
        
        required_fields = ['estudiante_id', 'tipo', 'detalle']
        if not data or not all(k in data for k in required_fields):
            return jsonify({'message': f'Faltan campos: {required_fields}'}), 400
        
        # Validar tipo
        tipos_validos = ['POSITIVA', 'NEGATIVA', 'NEUTRAL', 'DISCIPLINARIA']
        if data['tipo'] not in tipos_validos:
            return jsonify({'message': f'Tipo debe ser uno de: {tipos_validos}'}), 400
        
        # Verificar que el estudiante existe
        estudiante = Estudiante.query.get(data['estudiante_id'])
        if not estudiante:
            return jsonify({'message': 'Estudiante no encontrado'}), 404
        
        # Fecha: usar la proporcionada o fecha actual
        fecha_obs = date.today()
        if 'fecha' in data:
            try:
                fecha_obs = datetime.strptime(data['fecha'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'message': 'Formato de fecha inválido (usar YYYY-MM-DD)'}), 400
        
        observacion = Observacion(
            estudiante_id=data['estudiante_id'],
            docente_id=current_user.id,
            fecha=fecha_obs,
            tipo=data['tipo'],
            detalle=data['detalle']
        )
        
        db.session.add(observacion)
        db.session.commit()
        
        result = observacion.to_dict()
        result['estudiante'] = {'id': estudiante.id, 'nombre': estudiante.nombre}
        result['docente'] = {'id': current_user.id, 'nombre': current_user.nombre}
        
        return jsonify({
            'message': 'Observación creada exitosamente',
            'observacion': result
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al crear observación', 'error': str(e)}), 500

@observaciones_bp.route('/<int:observacion_id>', methods=['PUT'])
@role_required('docente', 'admin')
def update_observacion(observacion_id):
    """Actualizar observación (solo el autor o admin)"""
    try:
        current_user = get_current_user()
        observacion = Observacion.query.get_or_404(observacion_id)
        
        # Solo el docente que creó la observación o admin puede editarla
        if current_user.rol != 'admin' and observacion.docente_id != current_user.id:
            return jsonify({'message': 'Solo puedes editar tus propias observaciones'}), 403
        
        data = request.get_json()
        
        if 'tipo' in data:
            tipos_validos = ['POSITIVA', 'NEGATIVA', 'NEUTRAL', 'DISCIPLINARIA']
            if data['tipo'] not in tipos_validos:
                return jsonify({'message': f'Tipo debe ser uno de: {tipos_validos}'}), 400
            observacion.tipo = data['tipo']
        
        if 'detalle' in data:
            observacion.detalle = data['detalle']
        
        if 'fecha' in data:
            try:
                observacion.fecha = datetime.strptime(data['fecha'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'message': 'Formato de fecha inválido (usar YYYY-MM-DD)'}), 400
        
        db.session.commit()
        
        return jsonify({
            'message': 'Observación actualizada exitosamente',
            'observacion': observacion.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al actualizar observación', 'error': str(e)}), 500

@observaciones_bp.route('/tipos', methods=['GET'])
@jwt_required()
def list_tipos():
    """Obtener tipos de observaciones disponibles"""
    return jsonify({
        'tipos': ['POSITIVA', 'NEGATIVA', 'NEUTRAL', 'DISCIPLINARIA']
    }), 200
