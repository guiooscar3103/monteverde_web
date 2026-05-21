from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.extensions import db
from src.models.mensaje import Mensaje
from src.models.usuario import Usuario
from src.utils.auth_helpers import get_current_user
from datetime import datetime

mensajes_bp = Blueprint('mensajes', __name__, url_prefix='/mensajes')

@mensajes_bp.route('/', methods=['GET'])
@jwt_required()
def list_mensajes():
    """Listar mensajes del usuario actual"""
    try:
        current_user = get_current_user()
        
        # Filtros
        tipo = request.args.get('tipo', 'recibidos')  # 'enviados', 'recibidos', 'todos'
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        query = Mensaje.query
        
        if tipo == 'enviados':
            query = query.filter_by(emisor_id=current_user.id)
        elif tipo == 'recibidos':
            query = query.filter_by(receptor_id=current_user.id)
        else:  # todos
            query = query.filter(
                (Mensaje.emisor_id == current_user.id) | 
                (Mensaje.receptor_id == current_user.id)
            )
        
        mensajes = query.order_by(
            Mensaje.fecha.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        # Incluir información de emisor y receptor
        result = []
        for mensaje in mensajes.items:
            msg_dict = mensaje.to_dict()
            msg_dict['emisor'] = {
                'id': mensaje.emisor.id,
                'nombre': mensaje.emisor.nombre
            }
            msg_dict['receptor'] = {
                'id': mensaje.receptor.id,
                'nombre': mensaje.receptor.nombre
            }
            result.append(msg_dict)
        
        return jsonify({
            'mensajes': result,
            'pagination': {
                'page': mensajes.page,
                'pages': mensajes.pages,
                'per_page': mensajes.per_page,
                'total': mensajes.total
            }
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error al obtener mensajes', 'error': str(e)}), 500

@mensajes_bp.route('/', methods=['POST'])
@jwt_required()
def create_mensaje():
    """Enviar nuevo mensaje"""
    try:
        current_user = get_current_user()
        data = request.get_json()
        
        required_fields = ['receptor_id', 'asunto', 'cuerpo']
        if not data or not all(k in data for k in required_fields):
            return jsonify({'message': f'Faltan campos: {required_fields}'}), 400
        
        # Verificar que el receptor existe
        receptor = Usuario.query.get(data['receptor_id'])
        if not receptor:
            return jsonify({'message': 'Receptor no encontrado'}), 404
        
        # No permitir enviarse mensajes a sí mismo
        if current_user.id == data['receptor_id']:
            return jsonify({'message': 'No puedes enviarte mensajes a ti mismo'}), 400
        
        mensaje = Mensaje(
            emisor_id=current_user.id,
            receptor_id=data['receptor_id'],
            asunto=data['asunto'],
            cuerpo=data['cuerpo']
        )
        
        db.session.add(mensaje)
        db.session.commit()
        
        result = mensaje.to_dict()
        result['emisor'] = {'id': current_user.id, 'nombre': current_user.nombre}
        result['receptor'] = {'id': receptor.id, 'nombre': receptor.nombre}
        
        return jsonify({
            'message': 'Mensaje enviado exitosamente',
            'mensaje': result
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al enviar mensaje', 'error': str(e)}), 500

@mensajes_bp.route('/<int:mensaje_id>/marcar-leido', methods=['PUT'])
@jwt_required()
def marcar_leido(mensaje_id):
    """Marcar mensaje como leído"""
    try:
        current_user = get_current_user()
        mensaje = Mensaje.query.get_or_404(mensaje_id)
        
        # Solo el receptor puede marcar como leído
        if mensaje.receptor_id != current_user.id:
            return jsonify({'message': 'Solo el receptor puede marcar como leído'}), 403
        
        mensaje.leido = True
        db.session.commit()
        
        return jsonify({'message': 'Mensaje marcado como leído'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error al marcar mensaje', 'error': str(e)}), 500

@mensajes_bp.route('/conversacion/<int:usuario_id>', methods=['GET'])
@jwt_required()
def get_conversacion(usuario_id):
    """Obtener conversación con un usuario específico"""
    try:
        current_user = get_current_user()
        
        # Verificar que el usuario existe
        usuario = Usuario.query.get_or_404(usuario_id)
        
        mensajes = Mensaje.query.filter(
            ((Mensaje.emisor_id == current_user.id) & (Mensaje.receptor_id == usuario_id)) |
            ((Mensaje.emisor_id == usuario_id) & (Mensaje.receptor_id == current_user.id))
        ).order_by(Mensaje.fecha.asc()).all()
        
        result = []
        for mensaje in mensajes:
            msg_dict = mensaje.to_dict()
            msg_dict['es_mio'] = mensaje.emisor_id == current_user.id
            result.append(msg_dict)
        
        return jsonify({
            'conversacion': result,
            'usuario': {'id': usuario.id, 'nombre': usuario.nombre},
            'total_mensajes': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error al obtener conversación', 'error': str(e)}), 500
