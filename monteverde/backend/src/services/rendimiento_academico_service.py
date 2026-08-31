"""
Servicio para el cálculo del rendimiento académico y estadísticas de docentes en MonteVerde.

Responsabilidades:
- Consultar exclusivamente las asignaciones del docente autenticado (JWT).
- Optimización de consultas SQL (evitando N+1) usando queries en lote y mapeo en memoria.
- Cálculo de promedios siguiendo la estructura académica de MonteVerde (Indicadores y notas parciales).
- Reglas de clasificación: SOBRESALIENTE (>= 3.8), ACEPTABLE (3.0 - 3.79), EN_RIESGO (< 3.0), SIN_DATOS (sin notas válidas).
- Cálculo estricto de tasas de aprobación (excluyendo SIN_DATOS del denominador) y promedios grupales/globales.
- Provisión de información de familias asociadas para contacto directo sin consultas redundantes.
"""
from datetime import datetime
from sqlalchemy.orm import joinedload
from src.extensions import db
from src.models.bimestre import Bimestre
from src.models.docente_asignacion import DocenteAsignacion
from src.models.curso import Curso
from src.models.estudiante import Estudiante
from src.models.indicador_logro import IndicadorLogro
from src.models.calificacion_bimestre import CalificacionBimestre
from src.models.usuario import Usuario, familia_estudiante
from src.services.configuracion_evaluacion_service import ConfiguracionEvaluacionService


class RendimientoAcademicoService:

    @staticmethod
    def _calcular_promedio_lista(notas: list) -> float | None:
        """Calcula el promedio aritmético de una lista de notas válidas."""
        valores = [float(n) for n in notas if n is not None and str(n).strip() != '']
        if not valores:
            return None
        return round(sum(valores) / len(valores), 2)

    @staticmethod
    def _clasificar_estado(
        promedio: float | None,
        nota_aprobatoria: float = 3.0,
        escala_min: float = 1.0,
        escala_max: float = 5.0
    ) -> str:
        """
        Clasificación académica dinámica según la configuración vigente:
        - None  -> SIN_DATOS
        - < nota_aprobatoria -> EN_RIESGO
        - nota_aprobatoria <= promedio < umbral_sobresaliente -> ACEPTABLE
        - >= umbral_sobresaliente -> SOBRESALIENTE
        """
        if promedio is None:
            return 'SIN_DATOS'
        if promedio < nota_aprobatoria:
            return 'EN_RIESGO'
        
        # Umbral proporcional de excelencia (40% del rango aprobatorio)
        umbral_sobresaliente = nota_aprobatoria + (escala_max - nota_aprobatoria) * 0.4
        if promedio < umbral_sobresaliente:
            return 'ACEPTABLE'
        return 'SOBRESALIENTE'

    @classmethod
    def obtener_rendimiento_docente(cls, docente_id: int, bimestre_id: int | None = None) -> dict:
        """
        Genera el reporte de rendimiento académico exclusivo para el docente especificado.
        """
        # 1. Resolver el Bimestre seleccionado o el bimestre actual/activo por defecto
        bimestres_todos = Bimestre.query.order_by(Bimestre.anio.desc(), Bimestre.orden.asc()).all()
        if not bimestres_todos:
            bimestre_actual = None
        else:
            if bimestre_id is not None:
                bimestre_actual = next((b for b in bimestres_todos if b.id == bimestre_id), None)
                if not bimestre_actual:
                    raise ValueError(f"Bimestre con ID {bimestre_id} no encontrado")
            else:
                anio_actual = datetime.now().year
                bimestres_anio = [b for b in bimestres_todos if b.anio == anio_actual]
                bimestre_actual = bimestres_anio[0] if bimestres_anio else bimestres_todos[0]

        bimestres_disponibles_data = [b.to_dict() for b in bimestres_todos]

        # 2. Obtener las asignaciones del docente (Curso + Materia) con eager loading
        asignaciones_db = DocenteAsignacion.query.filter_by(docente_id=docente_id)\
            .options(
                joinedload(DocenteAsignacion.curso),
                joinedload(DocenteAsignacion.materia)
            ).all()

        if not asignaciones_db or not bimestre_actual:
            return {
                'bimestre': bimestre_actual.to_dict() if bimestre_actual else None,
                'bimestres_disponibles': bimestres_disponibles_data,
                'kpis': {
                    'total_estudiantes': 0,
                    'tasa_aprobacion': 0.0,
                    'estudiantes_en_riesgo': 0,
                    'estudiantes_sin_datos': 0,
                    'estudiantes_con_datos': 0,
                    'promedio_general': 0.0
                },
                'asignaciones': []
            }

        curso_ids = list({a.curso_id for a in asignaciones_db if a.curso_id})
        materia_ids = list({a.materia_id for a in asignaciones_db if a.materia_id})

        # 3. Cargar en lote todos los estudiantes de los cursos asignados
        estudiantes_db = Estudiante.query.filter(Estudiante.curso_id.in_(curso_ids))\
            .options(
                joinedload(Estudiante.curso)
            ).order_by(Estudiante.nombre.asc()).all()

        estudiante_ids = [e.id for e in estudiantes_db]

        # Mapeo eficiente de familias asociadas (M2M y Legacy)
        familias_map = {}
        if estudiante_ids:
            # Consulta M2M
            rel_m2m = db.session.query(
                familia_estudiante.c.estudiante_id,
                Usuario.id,
                Usuario.nombre,
                Usuario.email
            ).join(Usuario, Usuario.id == familia_estudiante.c.familia_id)\
             .filter(
                 familia_estudiante.c.estudiante_id.in_(estudiante_ids),
                 Usuario.activo == True,
                 Usuario.eliminado == False
             ).all()

            for est_id, u_id, u_nom, u_email in rel_m2m:
                familias_map[est_id] = {
                    'id': u_id,
                    'nombre': u_nom,
                    'email': u_email
                }

            # Consulta Legacy para estudiantes que no tengan registro en M2M
            rel_legacy = db.session.query(
                Usuario.estudiante_id,
                Usuario.id,
                Usuario.nombre,
                Usuario.email
            ).filter(
                Usuario.estudiante_id.in_(estudiante_ids),
                Usuario.rol == 'familia',
                Usuario.activo == True,
                Usuario.eliminado == False
            ).all()

            for est_id, u_id, u_nom, u_email in rel_legacy:
                if est_id not in familias_map:
                    familias_map[est_id] = {
                        'id': u_id,
                        'nombre': u_nom,
                        'email': u_email
                    }

        # Agrupar estudiantes por curso_id
        estudiantes_por_curso = {}
        for est in estudiantes_db:
            estudiantes_por_curso.setdefault(est.curso_id, []).append(est)

        # 4. Cargar en lote todos los indicadores de logro para este docente, bimestre y asignaciones
        indicadores_db = IndicadorLogro.query.filter(
            IndicadorLogro.docente_id == docente_id,
            IndicadorLogro.bimestre_id == bimestre_actual.id,
            IndicadorLogro.curso_id.in_(curso_ids),
            IndicadorLogro.materia_id.in_(materia_ids)
        ).order_by(IndicadorLogro.numero.asc()).all()

        # Agrupar indicadores por clave (curso_id, materia_id)
        indicadores_map = {}
        indicador_ids = []
        for ind in indicadores_db:
            key = (ind.curso_id, ind.materia_id)
            indicadores_map.setdefault(key, []).append(ind)
            indicador_ids.append(ind.id)

        # 5. Cargar en lote todas las calificaciones parciales de estos indicadores
        calificaciones_map = {}
        if indicador_ids:
            calificaciones_db = CalificacionBimestre.query.filter(
                CalificacionBimestre.indicador_id.in_(indicador_ids)
            ).all()
            for cal in calificaciones_db:
                # Mapa: (estudiante_id, indicador_id, numero_nota) -> nota float
                calificaciones_map[(cal.estudiante_id, cal.indicador_id, cal.numero_nota)] = float(cal.nota)

        # 6. Procesar métricas por cada asignación (Curso + Materia)
        asignaciones_resultado = []
        todos_promedios_individuales = []
        total_evaluaciones_global = 0
        total_aprobados_global = 0
        total_en_riesgo_global = 0
        total_sin_datos_global = 0

        config_eval = ConfiguracionEvaluacionService.get_por_bimestre_id(bimestre_actual.id) if bimestre_actual else ConfiguracionEvaluacionService.get_activa()
        notas_por_ind = config_eval.notas_por_indicador
        nota_aprobatoria = float(config_eval.nota_aprobatoria)
        escala_min = float(config_eval.escala_minima)
        escala_max = float(config_eval.escala_maxima)

        for asig in asignaciones_db:
            curso = asig.curso
            materia = asig.materia
            if not curso or not materia:
                continue

            estudiantes_curso = estudiantes_por_curso.get(curso.id, [])
            indicadores_asig = indicadores_map.get((curso.id, materia.id), [])

            estudiantes_asig_data = []
            promedios_curso_materia = []
            aprobados_count = 0
            en_riesgo_count = 0
            sin_datos_count = 0

            for est in estudiantes_curso:
                # Calcular promedios por indicador
                promedios_indicadores = []
                detalles_indicadores = []

                for ind in indicadores_asig:
                    notas_ind_list = [calificaciones_map.get((est.id, ind.id, n)) for n in range(1, notas_por_ind + 1)]
                    prom_ind = cls._calcular_promedio_lista(notas_ind_list)

                    ind_payload = {
                        'indicador_id': ind.id,
                        'numero': ind.numero,
                        'descripcion': ind.descripcion,
                        'promedio': prom_ind
                    }
                    for n in range(1, notas_por_ind + 1):
                        ind_payload[f'nota_{n}'] = calificaciones_map.get((est.id, ind.id, n))

                    detalles_indicadores.append(ind_payload)
                    if prom_ind is not None:
                        promedios_indicadores.append(prom_ind)

                # Promedio final = promedio aritmético de los indicadores con notas válidas
                promedio_final = cls._calcular_promedio_lista(promedios_indicadores) if promedios_indicadores else None
                estado = cls._clasificar_estado(
                    promedio_final,
                    nota_aprobatoria=nota_aprobatoria,
                    escala_min=escala_min,
                    escala_max=escala_max
                )

                # Identificar familia/acudiente asociado desde el mapa precalculado
                familia_info = familias_map.get(est.id)

                # Conteo de estados
                if estado == 'SIN_DATOS':
                    sin_datos_count += 1
                elif estado == 'EN_RIESGO':
                    en_riesgo_count += 1
                    promedios_curso_materia.append(promedio_final)
                    todos_promedios_individuales.append(promedio_final)
                else:  # ACEPTABLE o SOBRESALIENTE (ambos APROBADOS)
                    aprobados_count += 1
                    promedios_curso_materia.append(promedio_final)
                    todos_promedios_individuales.append(promedio_final)

                estudiantes_asig_data.append({
                    'estudiante_id': est.id,
                    'nombre': est.nombre,
                    'promedio': promedio_final,
                    'estado': estado,
                    'indicadores': detalles_indicadores,
                    'familia': familia_info
                })

            total_est = len(estudiantes_curso)
            estudiantes_con_datos = aprobados_count + en_riesgo_count

            promedio_grupo = round(sum(promedios_curso_materia) / len(promedios_curso_materia), 2) if promedios_curso_materia else 0.0
            tasa_aprobacion_grupo = round((aprobados_count / estudiantes_con_datos) * 100, 2) if estudiantes_con_datos > 0 else 0.0
            porcentaje_en_riesgo = round((en_riesgo_count / total_est) * 100, 2) if total_est > 0 else 0.0
            porcentaje_sin_datos = round((sin_datos_count / total_est) * 100, 2) if total_est > 0 else 0.0
            porcentaje_aprobados = round((aprobados_count / total_est) * 100, 2) if total_est > 0 else 0.0

            # Acumular globales
            total_evaluaciones_global += total_est
            total_aprobados_global += aprobados_count
            total_en_riesgo_global += en_riesgo_count
            total_sin_datos_global += sin_datos_count

            curso_grado = f"{curso.nivel}{curso.letra}" if curso.nivel and curso.letra else curso.nombre

            asignaciones_resultado.append({
                'asignacion_id': asig.id,
                'curso_id': curso.id,
                'curso': curso_grado,
                'curso_nombre': curso.nombre,
                'curso_nivel': curso.nivel,
                'curso_letra': curso.letra,
                'materia_id': materia.id,
                'materia': materia.nombre,
                'materia_nombre': materia.nombre,
                'total_estudiantes': total_est,
                'aprobados': aprobados_count,
                'en_riesgo': en_riesgo_count,
                'sin_datos': sin_datos_count,
                'estudiantes_con_datos': estudiantes_con_datos,
                'promedio_grupo': promedio_grupo,
                'tasa_aprobacion': tasa_aprobacion_grupo,
                'porcentaje_aprobados': porcentaje_aprobados,
                'porcentaje_en_riesgo': porcentaje_en_riesgo,
                'porcentaje_sin_datos': porcentaje_sin_datos,
                'indicadores_definidos': len(indicadores_asig),
                'estudiantes': estudiantes_asig_data
            })

        # 7. Calcular KPIs globales
        total_con_datos_global = total_aprobados_global + total_en_riesgo_global
        tasa_aprobacion_global = round((total_aprobados_global / total_con_datos_global) * 100, 2) if total_con_datos_global > 0 else 0.0
        promedio_general_docente = round(sum(todos_promedios_individuales) / len(todos_promedios_individuales), 2) if todos_promedios_individuales else 0.0

        return {
            'bimestre': bimestre_actual.to_dict(),
            'bimestres_disponibles': bimestres_disponibles_data,
            'kpis': {
                'total_estudiantes': total_evaluaciones_global,
                'tasa_aprobacion': tasa_aprobacion_global,
                'estudiantes_en_riesgo': total_en_riesgo_global,
                'estudiantes_sin_datos': total_sin_datos_global,
                'estudiantes_con_datos': total_con_datos_global,
                'promedio_general': promedio_general_docente
            },
            'asignaciones': asignaciones_resultado
        }
