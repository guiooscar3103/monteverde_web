from datetime import datetime, timedelta
from src.extensions import db
from src.models.usuario import Usuario
from src.models.estudiante import Estudiante
from src.models.curso import Curso
from src.models.actividad_admin import ActividadAdmin
from src.models.calificacion import Calificacion
from src.models.asistencia import Asistencia

class AdminService:
    @staticmethod
    def log_actividad(usuario_id, accion, detalles):
        """Registrar una acción administrativa en el log de auditoría"""
        try:
            log = ActividadAdmin(
                usuario_id=usuario_id,
                accion=accion,
                detalles=detalles,
                fecha=datetime.now()
            )
            db.session.add(log)
            db.session.commit()
            return True
        except Exception as e:
            print(f"❌ Error al registrar log de auditoría: {e}")
            db.session.rollback()
            return False

    @staticmethod
    def get_auditoria(limit=50):
        """Obtener logs de auditoría ordenados por fecha descendente"""
        if not AdminService._tabla_actividad_admin_existe():
            return []

        try:
            logs = ActividadAdmin.query.order_by(ActividadAdmin.fecha.desc()).limit(limit).all()
            return [log.to_dict() for log in logs]
        except Exception as e:
            print(f"❌ Error al obtener auditoría: {e}")
            return []

    @staticmethod
    def _tabla_actividad_admin_existe():
        try:
            return db.engine.has_table('actividad_admin')
        except Exception as e:
            print(f"⚠️ No se pudo verificar existencia de tabla actividad_admin: {e}")
            return False

    @staticmethod
    def get_estadisticas():
        """Obtener estadísticas globales para el dashboard administrador"""
        try:
            # Usuarios
            total_usuarios = Usuario.query.filter_by(eliminado=False).count()
            usuarios_activos = Usuario.query.filter_by(activo=True, eliminado=False).count()
            usuarios_inactivos = Usuario.query.filter_by(activo=False, eliminado=False).count()
            
            # Roles
            admins = Usuario.query.filter_by(rol='admin', eliminado=False).count()
            docentes = Usuario.query.filter_by(rol='docente', eliminado=False).count()
            familias = Usuario.query.filter_by(rol='familia', eliminado=False).count()
            
            # Academia
            estudiantes = Estudiante.query.count()
            cursos = Curso.query.count()
            
            # Promedio de notas global
            notas = Calificacion.query.all()
            promedio_notas = sum(n.nota for n in notas) / len(notas) if notas else 0.0
            
            # Asistencia promedio general
            asistencias = Asistencia.query.all()
            total_asistencias = len(asistencias)
            presentes = len([a for a in asistencias if a.estado == 'Presente'])
            promedio_asistencia = (presentes / total_asistencias * 100) if total_asistencias > 0 else 100.0

            # Distribución de estudiantes por curso (estático para gráficos)
            cursos_list = Curso.query.all()
            distribucion_cursos = []
            for c in cursos_list:
                estudiantes_count = Estudiante.query.filter_by(curso_id=c.id).count()
                distribucion_cursos.append({
                    'nombre': f"{c.nivel}°{c.letra}",
                    'estudiantes': estudiantes_count
                })

            # Actividades recientes
            actividades_recientes = []
            if AdminService._tabla_actividad_admin_existe():
                recientes = ActividadAdmin.query.order_by(ActividadAdmin.fecha.desc()).limit(5).all()
                actividades_recientes = [r.to_dict() for r in recientes]

            return {
                'usuarios': {
                    'total': total_usuarios,
                    'activos': usuarios_activos,
                    'inactivos': usuarios_inactivos,
                    'admins': admins,
                    'docentes': docentes,
                    'familias': familias
                },
                'academia': {
                    'estudiantes': estudiantes,
                    'cursos': cursos,
                    'promedio_notas': round(float(promedio_notas), 2),
                    'promedio_asistencia': round(float(promedio_asistencia), 1)
                },
                'distribucion_cursos': distribucion_cursos,
                'actividades_recientes': actividades_recientes
            }
        except Exception as e:
            print(f"❌ Error al calcular estadísticas del administrador: {e}")
            raise e
