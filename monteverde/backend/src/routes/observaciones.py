from flask import Blueprint, request, jsonify
from datetime import datetime
from src.extensions import db
from src.models.observacion import Observacion
from src.models.estudiante import Estudiante
from src.models.usuario import Usuario
from src.utils.auth_helpers import role_required

observaciones_bp = Blueprint('observaciones_custom', __name__)

@observaciones_bp.route('/observaciones/por-curso/<int:curso_id>', methods=['GET'])
@role_required('docente', 'admin')
def get_observaciones_por_curso(curso_id):
    """Observaciones por curso - CONSULTA CORREGIDA."""
    try:
        print(f"🔍 Obteniendo observaciones para curso: {curso_id}")
        
        # ✅ CONSULTA EXPLÍCITA Y CORREGIDA
        observaciones = db.session.query(
            Observacion,
            Estudiante,
            Usuario
        ).join(
            Estudiante, Observacion.estudiante_id == Estudiante.id
        ).outerjoin(
            Usuario, Observacion.docente_id == Usuario.id  
        ).filter(
            Estudiante.curso_id == curso_id
        ).order_by(
            Observacion.fecha.desc(), 
            Observacion.id.desc()
        ).all()
        
        observaciones_data = []
        for observacion, estudiante, docente in observaciones:
            obs_dict = {
                'id': observacion.id,
                'estudianteId': observacion.estudiante_id,
                'docenteId': observacion.docente_id,
                'fecha': observacion.fecha.isoformat() if observacion.fecha else None,
                'tipo': observacion.tipo,
                'detalle': observacion.detalle,
                'estudiante_nombre': estudiante.nombre,
                'docente_nombre': docente.nombre if docente else None
            }
            observaciones_data.append(obs_dict)
        
        print(f"📊 Observaciones encontradas para curso {curso_id}: {len(observaciones_data)}")
        return jsonify({'success': True, 'data': observaciones_data})
        
    except Exception as e:
        print(f"❌ Error observaciones por curso: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@observaciones_bp.route('/observaciones/agregar', methods=['POST'])
@role_required('docente', 'admin')
def agregar_observacion():
    """Agregar nueva observación."""
    try:
        print("📝 Recibiendo nueva observación...")
        data = request.get_json()
        
        estudiante_id = data.get('estudianteId')
        docente_id = data.get('docenteId')  
        fecha = data.get('fecha')
        tipo = data.get('tipo')
        detalle = data.get('detalle')
        
        print(f"Datos recibidos: {data}")
        
        if not all([estudiante_id, docente_id, fecha, tipo, detalle]):
            return jsonify({
                'success': False, 
                'message': 'Faltan campos requeridos: estudianteId, docenteId, fecha, tipo, detalle'
            }), 400
        
        # Crear la observación
        obs = Observacion(
            estudiante_id=estudiante_id,
            docente_id=docente_id,
            fecha=datetime.strptime(fecha, '%Y-%m-%d').date(),  # ✅ .date() para que coincida con el modelo
            tipo=tipo,
            detalle=detalle
        )
        
        db.session.add(obs)
        db.session.commit()
        
        print(f"✅ Observación creada con ID: {obs.id}")
        return jsonify({'success': True, 'data': obs.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error agregar observación: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@observaciones_bp.route('/familia/hijo-observaciones/<int:estudiante_id>', methods=['GET'])
@role_required('familia', 'admin')
def get_observaciones_hijo(estudiante_id):
    """Observaciones de un hijo."""
    try:
        observaciones = db.session.query(Observacion, Usuario).outerjoin(
            Usuario, Observacion.docente_id == Usuario.id
        ).filter(
            Observacion.estudiante_id == estudiante_id
        ).order_by(Observacion.fecha.desc()).all()
        
        observaciones_data = []
        for observacion, docente in observaciones:
            obs_dict = {
                'id': observacion.id,
                'fecha': observacion.fecha.isoformat() if observacion.fecha else None,
                'tipo': observacion.tipo,
                'detalle': observacion.detalle,
                'docente_nombre': docente.nombre if docente else 'Desconocido'
            }
            observaciones_data.append(obs_dict)
            
        return jsonify({'success': True, 'data': observaciones_data})
    except Exception as e:
        print(f"❌ Error observaciones hijo: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
