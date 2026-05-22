from flask import Blueprint, request, jsonify
from datetime import datetime
from sqlalchemy import func
from src.extensions import db
from src.models.asistencia import Asistencia
from src.models.estudiante import Estudiante

asistencia_bp = Blueprint('asistencia_custom', __name__)

@asistencia_bp.route('/asistencia/por-fecha', methods=['GET'])
def get_asistencia_por_fecha():
    """Asistencia por curso y fecha."""
    try:
        curso_id = request.args.get('cursoId')
        fecha = request.args.get('fecha')
        print(f"🔍 Buscando asistencia: curso={curso_id}, fecha={fecha}")
        
        if not curso_id or not fecha:
            return jsonify({'success': False, 'message': 'cursoId y fecha son requeridos'}), 400
            
        fecha_obj = datetime.strptime(fecha, '%Y-%m-%d').date()
        
        asistencias = db.session.query(Asistencia, Estudiante).join(Estudiante).filter(
            Estudiante.curso_id == curso_id,
            Asistencia.fecha == fecha_obj
        ).order_by(Estudiante.nombre).all()
        
        asistencia_data = []
        for asistencia, estudiante in asistencias:
            asist_dict = {
                'id': asistencia.id,
                'estudianteId': asistencia.estudiante_id,
                'fecha': asistencia.fecha.isoformat() if asistencia.fecha else None,
                'estado': asistencia.estado,
                'estudiante_nombre': estudiante.nombre
            }
            asistencia_data.append(asist_dict)
            
        print(f"📊 Registros de asistencia encontrados: {len(asistencia_data)}")
        return jsonify({'success': True, 'data': asistencia_data})
    except Exception as e:
        print(f"❌ Error asistencia por fecha: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@asistencia_bp.route('/asistencia/guardar', methods=['POST'])
def guardar_asistencia():
    """Guardar/actualizar asistencia."""
    try:
        data = request.get_json()
        marcas = data.get('marcas', [])
        
        if not marcas:
            return jsonify({'success': False, 'message': 'No hay registros de asistencia para guardar'}), 400
            
        print(f"💾 Guardando {len(marcas)} registros de asistencia")
        
        for marca in marcas:
            estudiante_id = marca.get('estudianteId')
            fecha = marca.get('fecha')
            estado = marca.get('estado')
            
            if not all([estudiante_id, fecha, estado]):
                continue
                
            fecha_obj = datetime.strptime(fecha, '%Y-%m-%d').date()
            
            existing = Asistencia.query.filter_by(
                estudiante_id=estudiante_id,
                fecha=fecha_obj
            ).first()
            
            if existing:
                existing.estado = estado
                print(f"📝 Actualizada asistencia para estudiante {estudiante_id}")
            else:
                nueva_asist = Asistencia(
                    estudiante_id=estudiante_id,
                    fecha=fecha_obj,
                    estado=estado
                )
                db.session.add(nueva_asist)
                print(f"✅ Nueva asistencia para estudiante {estudiante_id}")
        
        db.session.commit()
        return jsonify({'success': True, 'message': f'Se guardaron {len(marcas)} registros de asistencia correctamente'})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error guardar asistencia: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@asistencia_bp.route('/asistencia/estadisticas', methods=['GET'])
def get_estadisticas_asistencia():
    """Estadísticas de asistencia."""
    try:
        curso_id = request.args.get('cursoId')
        fecha = request.args.get('fecha')
        
        if not curso_id or not fecha:
            return jsonify({'success': False, 'message': 'cursoId y fecha son requeridos'}), 400
            
        fecha_obj = datetime.strptime(fecha, '%Y-%m-%d').date()
        
        total_estudiantes = Estudiante.query.filter_by(curso_id=curso_id).count()
        
        estadisticas = db.session.query(
            Asistencia.estado,
            func.count(Asistencia.id).label('cantidad')
        ).join(Estudiante).filter(
            Estudiante.curso_id == curso_id,
            Asistencia.fecha == fecha_obj
        ).group_by(Asistencia.estado).all()
        
        por_estado = {est.estado: est.cantidad for est in estadisticas}
        registrados = sum(por_estado.values())
        
        stats = {
            'total_estudiantes': total_estudiantes,
            'por_estado': por_estado,
            'registrados': registrados,
            'pendientes': total_estudiantes - registrados
        }
        
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        print(f"❌ Error estadísticas asistencia: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@asistencia_bp.route('/familia/hijo-asistencia/<int:estudiante_id>', methods=['GET'])
def get_asistencia_hijo(estudiante_id):
    """Asistencia de un hijo."""
    try:
        asistencias = Asistencia.query.filter_by(estudiante_id=estudiante_id).order_by(Asistencia.fecha.desc()).all()
        
        asistencias_data = []
        for asist in asistencias:
            asist_dict = {
                'id': asist.id,
                'fecha': asist.fecha.isoformat() if asist.fecha else None,
                'estado': asist.estado
            }
            asistencias_data.append(asist_dict)
            
        return jsonify({'success': True, 'data': asistencias_data})
    except Exception as e:
        print(f"❌ Error asistencia hijo: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
