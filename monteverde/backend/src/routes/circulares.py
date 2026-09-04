from flask import Blueprint, request, jsonify
from src.extensions import db
from src.models.circular import Circular
from src.utils.auth_helpers import role_required, get_current_user
from src.services.admin_service import AdminService

circulares_bp = Blueprint('circulares', __name__)

@circulares_bp.route('/circulares', methods=['POST'], strict_slashes=False)
@role_required('admin', 'coordinador')
def crear_circular():
    """Crear una circular institucional (administrador y coordinador)"""
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
@role_required('admin', 'coordinador', 'docente', 'familia')
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


@circulares_bp.route('/circulares/<int:circular_id>', methods=['GET'], strict_slashes=False)
@role_required('admin', 'docente', 'familia')
def obtener_circular(circular_id):
    """Consultar detalle de una circular específica"""
    try:
        circular = db.session.get(Circular, circular_id)
        if not circular:
            return jsonify({'success': False, 'message': 'Circular no encontrada'}), 404
            
        return jsonify({
            'success': True,
            'data': circular.to_dict()
        }), 200
    except Exception as e:
        print(f"❌ Error al obtener circular: {e}")
        return jsonify({'success': False, 'message': 'Error al obtener circular', 'error': str(e)}), 500


@circulares_bp.route('/circulares/<int:circular_id>', methods=['PUT'], strict_slashes=False)
@role_required('admin', 'coordinador')
def actualizar_circular(circular_id):
    """Editar una circular (administrador y coordinador)"""
    try:
        circular = db.session.get(Circular, circular_id)
        if not circular:
            return jsonify({'success': False, 'message': 'Circular no encontrada'}), 404
            
        data = request.get_json() or {}
        titulo = data.get('titulo')
        contenido = data.get('contenido')
        
        if not titulo or not contenido:
            return jsonify({'success': False, 'message': 'Faltan campos obligatorios: titulo y contenido'}), 400
            
        circular.titulo = titulo
        circular.contenido = contenido
        db.session.commit()
        
        # Registrar acción en log de auditoría
        current_user = get_current_user()
        AdminService.log_actividad(
            usuario_id=current_user.id,
            accion='EDITAR_CIRCULAR',
            detalles=f"Se editó la circular ID {circular_id} '{titulo}'"
        )
        
        return jsonify({
            'success': True,
            'message': 'Circular actualizada exitosamente',
            'data': circular.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al actualizar circular: {e}")
        return jsonify({'success': False, 'message': 'Error al actualizar circular', 'error': str(e)}), 500


@circulares_bp.route('/circulares/<int:circular_id>', methods=['DELETE'], strict_slashes=False)
@role_required('admin', 'coordinador')
def eliminar_circular(circular_id):
    """Eliminar una circular (administrador y coordinador)"""
    try:
        circular = db.session.get(Circular, circular_id)
        if not circular:
            return jsonify({'success': False, 'message': 'Circular no encontrada'}), 404
            
        titulo = circular.titulo
        db.session.delete(circular)
        db.session.commit()
        
        # Registrar acción en log de auditoría
        current_user = get_current_user()
        AdminService.log_actividad(
            usuario_id=current_user.id,
            accion='ELIMINAR_CIRCULAR',
            detalles=f"Se eliminó la circular '{titulo}'"
        )
        
        return jsonify({
            'success': True,
            'message': 'Circular eliminada exitosamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al eliminar circular: {e}")
        return jsonify({'success': False, 'message': 'Error al eliminar circular', 'error': str(e)}), 500

