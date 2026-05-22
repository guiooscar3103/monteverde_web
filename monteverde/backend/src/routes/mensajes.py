from flask import Blueprint, request, jsonify
from datetime import datetime
from flask_jwt_extended import jwt_required
from src.extensions import db
from src.models.mensaje import Mensaje
from src.models.usuario import Usuario

mensajes_bp = Blueprint('mensajes_custom', __name__)

@mensajes_bp.route('/mensajes/<int:usuario_id>', methods=['GET'])
@jwt_required()
def get_mensajes(usuario_id):
    """Obtener mensajes usando SQLAlchemy ORM."""
    try:
        print(f"🔍 Obteniendo mensajes para usuario: {usuario_id}")
        
        mensajes = Mensaje.query.filter(
            (Mensaje.receptor_id == usuario_id) | (Mensaje.emisor_id == usuario_id)
        ).order_by(Mensaje.fecha.desc()).all()
        
        print(f"📧 Mensajes encontrados: {len(mensajes)}")
 
        mensajes_data = []
        for msg in mensajes:
            msg_dict = msg.to_dict()
            emisor = Usuario.query.get(msg.emisor_id)
            receptor = Usuario.query.get(msg.receptor_id)
            msg_dict['emisor_nombre'] = emisor.nombre if emisor else None
            msg_dict['receptor_nombre'] = receptor.nombre if receptor else None
            mensajes_data.append(msg_dict)
 
        return jsonify({'success': True, 'data': mensajes_data})
    except Exception as e:
        print(f"❌ Error get_mensajes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@mensajes_bp.route('/conversacion/<int:usuario1>/<int:usuario2>', methods=['GET'])
@jwt_required()
def get_conversacion_entre_usuarios(usuario1, usuario2):
    """Conversación entre dos usuarios."""
    try:
        mensajes = Mensaje.query.filter(
            ((Mensaje.emisor_id == usuario1) & (Mensaje.receptor_id == usuario2)) |
            ((Mensaje.emisor_id == usuario2) & (Mensaje.receptor_id == usuario1))
        ).order_by(Mensaje.fecha.asc()).all()
        
        mensajes_data = []
        for msg in mensajes:
            msg_dict = msg.to_dict()
            emisor = Usuario.query.get(msg.emisor_id)
            receptor = Usuario.query.get(msg.receptor_id)
            msg_dict['emisor_nombre'] = emisor.nombre if emisor else None
            msg_dict['receptor_nombre'] = receptor.nombre if receptor else None
            mensajes_data.append(msg_dict)
            
        return jsonify({'success': True, 'data': mensajes_data})
    except Exception as e:
        print(f"❌ Error conversación: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@mensajes_bp.route('/mensajes/enviar', methods=['POST'])
@jwt_required()
def enviar_mensaje_nuevo():
    """Enviar nuevo mensaje."""
    try:
        data = request.get_json()
        emisor_id = data.get('emisorId')
        receptor_id = data.get('receptorId')
        asunto = data.get('asunto', 'Sin asunto')
        cuerpo = data.get('cuerpo')
        
        if not all([emisor_id, receptor_id, cuerpo]):
            return jsonify({'success': False, 'message': 'Faltan campos requeridos'}), 400
            
        mensaje = Mensaje(
            emisor_id=emisor_id,
            receptor_id=receptor_id,
            asunto=asunto,
            cuerpo=cuerpo,
            fecha=datetime.now(),
            leido=False
        )
        
        db.session.add(mensaje)
        db.session.commit()
        
        print(f"✅ Mensaje creado con ID: {mensaje.id}")
        return jsonify({'success': True, 'data': mensaje.to_dict()})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error enviar mensaje: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@mensajes_bp.route('/mensajes/marcar-leido/<int:mensaje_id>', methods=['PUT'])
@jwt_required()
def marcar_mensaje_como_leido(mensaje_id):
    """Marcar mensaje como leído."""
    try:
        mensaje = Mensaje.query.get(mensaje_id)
        if not mensaje:
            return jsonify({'success': False, 'message': 'Mensaje no encontrado'}), 404
            
        mensaje.leido = True
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Mensaje marcado como leído'})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error marcar leído: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
