from flask import Blueprint, request, jsonify
from datetime import datetime
from src.extensions import db
from src.models.calificacion import Calificacion
from src.models.estudiante import Estudiante
from src.utils.auth_helpers import role_required

calificaciones_bp = Blueprint('calificaciones_custom', __name__)

@calificaciones_bp.route('/calificaciones/buscar', methods=['GET'])
@role_required('docente', 'admin')
def get_calificaciones_por():
    """Buscar calificaciones con filtros."""
    try:
        curso_id = request.args.get('cursoId')
        asignatura = request.args.get('asignatura')
        periodo = request.args.get('periodo')
        print(f"🔍 Buscando calificaciones: curso={curso_id}, asignatura={asignatura}, periodo={periodo}")
        
        query = db.session.query(Calificacion, Estudiante).join(Estudiante)
        
        if curso_id:
            query = query.filter(Estudiante.curso_id == curso_id)
        if asignatura:
            query = query.filter(Calificacion.asignatura == asignatura)
        if periodo:
            query = query.filter(Calificacion.periodo == periodo)
            
        calificaciones = query.order_by(Estudiante.nombre).all()
        
        calificaciones_data = []
        for calificacion, estudiante in calificaciones:
            cal_dict = calificacion.to_dict()
            cal_dict['estudiante_nombre'] = estudiante.nombre
            calificaciones_data.append(cal_dict)
            
        print(f"📊 Calificaciones encontradas: {len(calificaciones_data)}")
        return jsonify({'success': True, 'data': calificaciones_data})
    except Exception as e:
        print(f"❌ Error buscar calificaciones: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@calificaciones_bp.route('/calificaciones/guardar', methods=['POST'])
@role_required('docente', 'admin')
def guardar_calificaciones():
    """Guardar/actualizar calificaciones."""
    try:
        data = request.get_json()
        calificaciones = data.get('calificaciones', [])
        
        if not calificaciones:
            return jsonify({'success': False, 'message': 'No hay calificaciones para guardar'}), 400
            
        print(f"💾 Guardando {len(calificaciones)} calificaciones")
        
        for calif in calificaciones:
            estudiante_id = calif.get('estudianteId')
            asignatura = calif.get('asignatura')
            periodo = calif.get('periodo')
            nota = calif.get('nota')
            
            existing = Calificacion.query.filter_by(
                estudiante_id=estudiante_id,
                asignatura=asignatura,
                periodo=periodo
            ).first()
            
            if existing:
                existing.nota = nota
                existing.fecha_registro = datetime.now()
                print(f"📝 Actualizada calificación para estudiante {estudiante_id}")
            else:
                nueva_cal = Calificacion(
                    estudiante_id=estudiante_id,
                    asignatura=asignatura,
                    periodo=periodo,
                    nota=nota,
                    fecha_registro=datetime.now()
                )
                db.session.add(nueva_cal)
                print(f"✅ Nueva calificación para estudiante {estudiante_id}")
        
        db.session.commit()
        return jsonify({'success': True, 'message': f'Se guardaron {len(calificaciones)} calificaciones correctamente'})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error guardar calificaciones: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@calificaciones_bp.route('/familia/hijo-calificaciones/<int:estudiante_id>', methods=['GET'])
@role_required('familia', 'admin')
def get_calificaciones_hijo(estudiante_id):
    """Calificaciones de un hijo."""
    try:
        calificaciones = Calificacion.query.filter_by(estudiante_id=estudiante_id).order_by(
            Calificacion.fecha_registro.desc(), Calificacion.asignatura
        ).all()
        
        calificaciones_data = []
        for cal in calificaciones:
            cal_dict = {
                'id': cal.id,
                'asignatura': cal.asignatura,
                'periodo': cal.periodo,
                'nota': cal.nota,
                'fecha': cal.fecha_registro.isoformat() if cal.fecha_registro else None
            }
            calificaciones_data.append(cal_dict)
        
        print(f"📊 Calificaciones encontradas para estudiante {estudiante_id}: {len(calificaciones_data)}")
        return jsonify({'success': True, 'data': calificaciones_data})
    except Exception as e:
        print(f"❌ Error calificaciones hijo: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
