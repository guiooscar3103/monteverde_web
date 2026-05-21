from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.extensions import db
from src.models.asistencia import Asistencia
from src.models.estudiante import Estudiante
from src.utils.auth_helpers import role_required, get_current_user
from datetime import datetime, date

asistencia_bp = Blueprint('asistencia', __name__, url_prefix='/asistencia')

@asistencia_bp.route('/', methods=['GET'])
@jwt_required()
def list_asistencia():
    """Listar registros de asistencia"""
    try:
        current_user = get_current_user()
        
        # Parámetros
        estudiante_id = request.args.get('estudiante_id', type=int)
        fecha = request.args.get('fecha')
        estado = request.args.get('estado')
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        
        query = Asistencia.query
        
        # Filtros según rol
        if current_user.rol == 'familia':
            if not estudiante_id or current_user.estudiante_id != estudiante_id:
                return jsonify({'message': 'Solo puedes ver asistencia de tu estudiante'}), 403
            query = query.filter_by(estudiante_id=estudiante_id)
        else:
            if estudiante_id:
                query = query.filter_by(estudiante_id=estudiante_id)
        
        # Filtros adicionales
        if fecha:
            try:
                fecha_filter = datetime.strptime(fecha, '%Y-%m-%d').date()
                query = query.filter_by(fecha=fecha_filter)
            except ValueError:
                return jsonify({'message': 'Formato de fecha inválido (usar YYYY-MM-DD)'}), 400
        
        if estado:
            estados_validos = ['PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICADO']
            if estado not in estados_validos:
                return jsonify({'message': f'Estado debe ser uno de: {estados_validos}'}), 400
            query = query.filter_by(estado=estado)
        
        asistencias = query.order_by(
            Asistencia.fecha.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        # Incluir información del estudiante
        result = []
        for asist in asistencias.items:
            asist_dict = asist.to_dict()
            asist_dict['estudiante'] = {
                'id': asist.estudiante.id,
                'nombre': asist.estudiante.nombre
            }
            result.append(asist_dict)
        
        return jsonify({
            'asistencias': result,
            'pagination': {
                'page': asistencias.page,
                'pages': asistencias.pages,
                'per_page': asistencias.per_page,
                'total': asistencias.total
            }
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error al obtener asistencias', 'error': str(e)}), 500

@asistencia_bp.route('/multiple', methods=['POST'])
@role_required('docente', 'admin')
def create_asistencia_multiple():
    """Registrar asistencia para múltiples estudiantes"""
    try:
        data = request.get_json()
        
        if not data or 'asistencias' not in data:
            return jsonify({'message': 'Se requiere array "asistencias"'}), 400
        
        if not isinstance(data['asistencias'], list):
            return jsonify({'message': '"asistencias" debe ser un array'}), 400
        
        estados_validos = ['PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICADO']
        resultados = []
        
        for item in data['asistencias']:
            required_fields = ['estudiante_id', 'fecha', 'estado']
            if not all(k in item for k in required_fields):
                return jsonify({
                    'message': f'Cada asistencia requiere: {required_fields}'
                }), 400
            
            # Validar estado
            if item['estado'] not in estados_validos:
                return jsonify({
                    'message': f'Estado debe ser uno de: {estados_validos}'
                }), 400
            
            # Validar fecha
            try:
                fecha_asist = datetime.strptime(item['fecha'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'message': 'Formato de fecha inválido (usar YYYY-MM-DD)'
                }), 400
            
            # Verificar estudiante
            estudiante = Estudiante.query.get(item['estudiante_id'])
            if not estudiante:
                return jsonify({
                    'message': f'Estudiante {item["estudiante_id"]} no encontrado'
                }), 404
            
            # Verificar si ya existe registro para esa fecha/estudiante
            existing = Asistencia.query.filter_by(
                estudiante_id=item['estudiante_id'],
                fecha=fecha_asist
            ).first()
            
            if existing:
                # Actualizar existente
                existing.estado = item['estado']
                resultados.append({
                    'estudiante_id': item['estudiante_id'],
                    'accion': 'actualizado',
                    'asistencia': existing.to_dict()
                })
            else:
                # Crear nuevo
                asistencia = Asistencia(
                    estudiante_id=item['estudiante_id'],
                    fecha=fecha_asist,
                    estado=item['estado']
                )
                db.session.add(asistencia)
                resultados.append({
                    'estudiante_id': item['estudiante_id'],
                    'accion': 'creado',
                    'asistencia': asistencia.to_dict()
                })
        
        db.session.commit()
        
        return jsonify({
            'message': f'Asistencia procesada para {len(resultados)} estudiantes',
            'resultados': resultados
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al registrar asistencias', 'error': str(e)}), 500

@asistencia_bp.route('/estados', methods=['GET'])
@jwt_required()
def list_estados():
    """Obtener estados de asistencia disponibles"""
    return jsonify({
        'estados': ['PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICADO']
    }), 200
