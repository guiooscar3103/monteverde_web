from flask import Blueprint, request, jsonify
from src.extensions import db
from src.models.circular import Circular
from src.utils.auth_helpers import role_required, get_current_user
from src.services.admin_service import AdminService

circulares_bp = Blueprint('circulares', __name__)

@circulares_bp.route('/circulares', methods=['POST'], strict_slashes=False)
@role_required('admin')
def crear_circular():
    """Crear una circular institucional (solo administrador)"""
    try:
        data = request.get_json() or {}
        titulo = data.get('titulo')
        contenido = data.get('contenido')
        
        if not titulo or not contenido:
            return jsonify({'success': False, 'message': 'Faltan campos obligatorios: titulo y contenido'}), 400
            
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'message': 'Usuario no autenticado'}), 401
            
        circular = Circular(
            titulo=titulo,
            contenido=contenido,
            autor_id=current_user.id
        )
        
        db.session.add(circular)
        db.session.commit()
        
        # Registrar acción en log de auditoría
        AdminService.log_actividad(
            usuario_id=current_user.id,
            accion='PUBLICAR_CIRCULAR',
            detalles=f"Se publicó la circular '{titulo}'"
        )
        
        return jsonify({
            'success': True,
            'message': 'Circular publicada exitosamente',
            'data': circular.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al crear circular: {e}")
        return jsonify({'success': False, 'message': 'Error al crear circular', 'error': str(e)}), 500


@circulares_bp.route('/circulares', methods=['GET'], strict_slashes=False)
@role_required('admin', 'docente')
def listar_circulares():
    """Listar todas las circulares de forma descendente por fecha de publicación (admite parámetro limit)"""
    try:
        limit = request.args.get('limit', type=int)
        query = Circular.query.order_by(Circular.fecha_publicacion.desc())
        
        if limit:
            circulares = query.limit(limit).all()
        else:
            circulares = query.all()
            
        return jsonify({
            'success': True,
            'data': [c.to_dict() for c in circulares]
        }), 200
    except Exception as e:
        print(f"❌ Error al listar circulares: {e}")
        return jsonify({'success': False, 'message': 'Error al listar circulares', 'error': str(e)}), 500
