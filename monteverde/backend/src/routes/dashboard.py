from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from sqlalchemy import func, extract, and_
from src.extensions import db
from src.models.usuario import Usuario
from src.models.estudiante import Estudiante
from src.models.curso import Curso
from src.models.mensaje import Mensaje
from src.models.calificacion import Calificacion
from src.models.asistencia import Asistencia
from src.models.observacion import Observacion
from src.models.docente_asignacion import DocenteAsignacion
from src.models.tarea import Tarea
from src.models.entrega import Entrega
from src.utils.auth_helpers import role_required, get_current_user

dashboard_bp = Blueprint('dashboard_custom', __name__)

def _calcular_estadisticas_estudiante(estudiante):
    """Calcular estadísticas de un estudiante"""
    curso = Curso.query.get(estudiante.curso_id)
    
    # Calificaciones
    calificaciones = Calificacion.query.filter_by(estudiante_id=estudiante.id).all()
    promedio = sum(c.nota for c in calificaciones) / len(calificaciones) if calificaciones else 0
    
    # Asistencia del mes actual
    asistencias_mes = Asistencia.query.filter(
        Asistencia.estudiante_id == estudiante.id,
        extract('month', Asistencia.fecha) == datetime.now().month,
        extract('year', Asistencia.fecha) == datetime.now().year
    ).all()
    
    dias_presentes = len([a for a in asistencias_mes if a.estado.upper() == 'PRESENTE'])
    total_dias = len(asistencias_mes)
    asistencia_porcentaje = (dias_presentes / total_dias * 100) if total_dias > 0 else 100
    
    # Observaciones recientes
    observaciones_mes = Observacion.query.filter(
        and_(
            Observacion.estudiante_id == estudiante.id,
            Observacion.fecha >= datetime.now().date() - timedelta(days=30)
        )
    ).count()
    
    return {
        'id': estudiante.id,
        'nombre': estudiante.nombre,
        'grado': f"{curso.nivel}{curso.letra}" if curso and curso.nivel and curso.letra else 'Sin grado',
        'curso': curso.nombre if curso else 'Sin curso',
        'curso_id': estudiante.curso_id,
        'promedio': float(promedio),
        'total_notas': len(calificaciones),
        'asistencia_porcentaje': asistencia_porcentaje,
        'dias_presentes': dias_presentes,
        'total_dias': total_dias,
        'observaciones_mes': observaciones_mes
    }

@dashboard_bp.route('/docente/dashboard', methods=['GET'])
@role_required('docente', 'admin')
def get_docente_dashboard():
    """Dashboard del docente.

    El docente_id se obtiene exclusivamente del JWT (get_current_user).
    No se acepta docente_id desde parámetros de URL, query, ni body.
    """
    try:
        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no encontrado'}), 404
        docente_id = docente.id

        # Obtener los IDs de cursos asignados al docente autenticado
        curso_ids_asignados = db.session.query(
            DocenteAsignacion.curso_id
        ).filter(
            DocenteAsignacion.docente_id == docente_id
        ).distinct().scalar_subquery()

        # Obtener cursos del docente con conteo de estudiantes
        cursos = db.session.query(
            Curso.id,
            Curso.nombre,
            Curso.nivel,
            Curso.letra,
            func.count(Estudiante.id).label('total_estudiantes')
        ).outerjoin(
            Estudiante, Estudiante.curso_id == Curso.id
        ).filter(
            Curso.id.in_(curso_ids_asignados)
        ).group_by(Curso.id).order_by(Curso.nivel, Curso.letra).all()
        
        cursos_data = [{'id': c.id, 'nombre': c.nombre, 'nivel': c.nivel, 'letra': c.letra, 'total_estudiantes': c.total_estudiantes} for c in cursos]
        
        # Mensajes no leídos para el docente autenticado (desde JWT, no desde parámetro)
        mensajes = Mensaje.query.filter_by(receptor_id=docente_id, leido=False).join(Usuario, Mensaje.emisor_id == Usuario.id).limit(3).all()
        mensajes_data = []
        for msg in mensajes:
            msg_dict = msg.to_dict()
            emisor = Usuario.query.get(msg.emisor_id)
            msg_dict['emisor'] = emisor.nombre if emisor else 'Desconocido'
            mensajes_data.append(msg_dict)
        
        # Tareas pendientes reales obtenidas de la base de datos
        tareas_query = Tarea.query.filter_by(
            docente_id=docente_id,
            estado='PUBLICADA'
        )
        total_tareas_pendientes = tareas_query.count()
        tareas_db = tareas_query.order_by(Tarea.fecha_vencimiento.asc()).limit(5).all()

        tareas_pendientes = []
        ahora_fecha = datetime.utcnow().date()
        for t in tareas_db:
            vence_fecha = t.fecha_vencimiento.date() if isinstance(t.fecha_vencimiento, datetime) else t.fecha_vencimiento
            delta_dias = (vence_fecha - ahora_fecha).days
            if delta_dias <= 0:
                urgencia = 'hoy'
            elif delta_dias == 1:
                urgencia = 'mañana'
            else:
                urgencia = 'próximamente'

            total_est = len(t.curso.estudiantes) if t.curso and t.curso.estudiantes else 0
            entregas_list = t.entregas if t.entregas else []
            total_entregadas = len([e for e in entregas_list if e.estado in ('ENTREGADA', 'CALIFICADA')])
            entregas_pendientes = max(0, total_est - total_entregadas)

            curso_grado = f"{t.curso.nivel}{t.curso.letra}" if t.curso and t.curso.nivel and t.curso.letra else (t.curso.nombre if t.curso else 'Sin curso')

            tareas_pendientes.append({
                'id': t.id,
                'titulo': t.titulo,
                'descripcion': t.descripcion,
                'curso': curso_grado,
                'curso_id': t.curso_id,
                'curso_nombre': t.curso.nombre if t.curso else None,
                'asignatura': t.materia.nombre if t.materia else 'General',
                'materia_id': t.materia_id,
                'fecha_vencimiento': t.fecha_vencimiento.isoformat() if t.fecha_vencimiento else None,
                'estado': t.estado,
                'entregas': total_entregadas,
                'entregas_pendientes': entregas_pendientes,
                'total_estudiantes': total_est,
                'urgencia': urgencia
            })

        payload = {
            'cursos': cursos_data,
            'mensajes_pendientes': mensajes_data,
            'tareas_pendientes': tareas_pendientes,
            'total_tareas_pendientes': total_tareas_pendientes,
            'estadisticas': {
                'total_cursos': len(cursos_data),
                'mensajes_no_leidos': len(mensajes_data),
                'estudiantes_total': sum(c['total_estudiantes'] for c in cursos_data)
            }
        }
        return jsonify({'success': True, 'data': payload})
    except Exception as e:
        print(f"❌ Error dashboard docente: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@dashboard_bp.route('/familia/dashboard/<int:familia_id>', methods=['GET'])
@role_required('familia', 'admin')
def get_familia_dashboard(familia_id):
    """Dashboard familiar."""
    try:
        # Obtener el usuario familia
        familia = Usuario.query.get(familia_id)
        if not familia or familia.rol != 'familia':
            return jsonify({'success': False, 'message': 'Familia no encontrada'}), 404
            
        # Si no tiene estudiantes asociados (Many-to-Many), retornar vacío
        if not familia.estudiantes:
            # Fallback legacy si la tabla Many-to-Many no está poblada pero estudiante_id sí
            if familia.estudiante_id:
                legacy_est = Estudiante.query.get(familia.estudiante_id)
                if legacy_est:
                    familia.estudiantes.append(legacy_est)
                    db.session.commit()
                else:
                    return jsonify({'success': True, 'data': {'hijos': [], 'total_hijos': 0}})
            else:
                return jsonify({'success': True, 'data': {'hijos': [], 'total_hijos': 0}})
                
        hijos_data = [_calcular_estadisticas_estudiante(est) for est in familia.estudiantes]
            
        print(f"🏠 Estudiantes encontrados para familia {familia_id}: {len(hijos_data)}")
        return jsonify({
            'success': True,
            'data': {
                'hijos': hijos_data,
                'total_hijos': len(hijos_data)
            }
        })
    except Exception as e:
        print(f"❌ Error dashboard familia: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

