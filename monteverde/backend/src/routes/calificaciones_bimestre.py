"""
Rutas del sistema de evaluación por indicadores de logro y bimestres/periodos.
Totalmente dinámico y adaptable según la configuración académica por año escolar.
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
from src.extensions import db
from src.models.bimestre import Bimestre
from src.models.indicador_logro import IndicadorLogro
from src.models.calificacion_bimestre import CalificacionBimestre
from src.models.estudiante import Estudiante
from src.models.docente_asignacion import DocenteAsignacion
from src.models.materia import Materia
from src.services.configuracion_evaluacion_service import ConfiguracionEvaluacionService
from src.utils.auth_helpers import role_required, get_current_user

calificaciones_bimestre_bp = Blueprint('calificaciones_bimestre', __name__)


# ─────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────

def _calcular_promedio(notas: list) -> float | None:
    """Promedio simple de una lista de floats; None si la lista está vacía."""
    valores = [float(n) for n in notas if n is not None and str(n).strip() != '']
    if not valores:
        return None
    return round(sum(valores) / len(valores), 2)


def _docente_tiene_acceso(docente_id: int, curso_id: int, materia_id: int) -> bool:
    """Verifica que el docente tenga asignado el curso+materia."""
    return DocenteAsignacion.query.filter_by(
        docente_id=docente_id,
        curso_id=curso_id,
        materia_id=materia_id
    ).first() is not None


# ─────────────────────────────────────────────────────────────────
# GET /bimestres  — Lista de bimestres/periodos disponibles
# ─────────────────────────────────────────────────────────────────

@calificaciones_bimestre_bp.route('/bimestres', methods=['GET'])
@role_required('docente', 'admin', 'familia')
def get_bimestres():
    """Retorna los bimestres/periodos del año actual (o todos si se pasa ?anio=)."""
    try:
        anio = request.args.get('anio', type=int)
        if not anio:
            config_activa = ConfiguracionEvaluacionService.get_activa()
            anio = config_activa.anio_academico

        bimestres = Bimestre.query.filter_by(anio=anio).order_by(Bimestre.orden).all()

        # Si no existe el año solicitado, garantizar seed/creación por configuración
        if not bimestres:
            ConfiguracionEvaluacionService.get_or_create_default(anio)
            bimestres = Bimestre.query.filter_by(anio=anio).order_by(Bimestre.orden).all()

        if not bimestres:
            bimestres = Bimestre.query.order_by(Bimestre.anio.desc(), Bimestre.orden).all()

        return jsonify({'success': True, 'data': [b.to_dict() for b in bimestres]})
    except Exception as exc:
        print(f'❌ Error get_bimestres: {exc}')
        return jsonify({'success': False, 'message': str(exc)}), 500


# ─────────────────────────────────────────────────────────────────
# GET /calificaciones-bimestre/indicadores
# Devuelve los indicadores definidos para curso+materia+bimestre del docente.
# ─────────────────────────────────────────────────────────────────

@calificaciones_bimestre_bp.route('/calificaciones-bimestre/indicadores', methods=['GET'])
@role_required('docente', 'admin')
def get_indicadores():
    """Obtiene los indicadores de logro de un bimestre."""
    try:
        curso_id    = request.args.get('cursoId', type=int) or request.args.get('curso_id', type=int)
        materia_id  = request.args.get('materiaId', type=int) or request.args.get('materia_id', type=int)
        bimestre_id = request.args.get('bimestreId', type=int) or request.args.get('bimestre_id', type=int)

        if not all([curso_id, materia_id, bimestre_id]):
            return jsonify({'success': False, 'message': 'Se requieren cursoId, materiaId y bimestreId'}), 400

        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no encontrado'}), 404

        if docente.rol == 'docente' and not _docente_tiene_acceso(docente.id, curso_id, materia_id):
            return jsonify({'success': False, 'message': 'No tienes acceso a este curso/asignatura'}), 403

        indicadores = IndicadorLogro.query.filter_by(
            docente_id=docente.id if docente.rol == 'docente' else None,
            curso_id=curso_id,
            materia_id=materia_id,
            bimestre_id=bimestre_id
        ).order_by(IndicadorLogro.numero).all() if docente.rol == 'docente' else \
        IndicadorLogro.query.filter_by(
            curso_id=curso_id,
            materia_id=materia_id,
            bimestre_id=bimestre_id
        ).order_by(IndicadorLogro.numero).all()

        config = ConfiguracionEvaluacionService.get_por_bimestre_id(bimestre_id)

        return jsonify({
            'success': True,
            'data': [i.to_dict() for i in indicadores],
            'configuracion': config.estructura()
        })
    except Exception as exc:
        print(f'❌ Error get_indicadores: {exc}')
        return jsonify({'success': False, 'message': str(exc)}), 500


# ─────────────────────────────────────────────────────────────────
# POST /calificaciones-bimestre/indicadores
# Crea o actualiza los indicadores de un bimestre según configuración.
# ─────────────────────────────────────────────────────────────────

@calificaciones_bimestre_bp.route('/calificaciones-bimestre/indicadores', methods=['POST'])
@role_required('docente')
def guardar_indicadores():
    """Guarda / actualiza los indicadores de logro para un bimestre de forma dinámica."""
    try:
        data        = request.get_json() or {}
        curso_id    = data.get('cursoId') or data.get('curso_id')
        materia_id  = data.get('materiaId') or data.get('materia_id')
        bimestre_id = data.get('bimestreId') or data.get('bimestre_id')
        indicadores = data.get('indicadores', [])

        if not all([curso_id, materia_id, bimestre_id]):
            return jsonify({'success': False, 'message': 'Faltan campos requeridos'}), 400

        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no encontrado'}), 404

        if not _docente_tiene_acceso(docente.id, curso_id, materia_id):
            return jsonify({'success': False, 'message': 'No tienes acceso a este curso/asignatura'}), 403

        config = ConfiguracionEvaluacionService.get_por_bimestre_id(bimestre_id)
        max_indicadores = config.indicadores_por_periodo

        if len(indicadores) != max_indicadores:
            return jsonify({
                'success': False,
                'message': f'Se deben enviar exactamente {max_indicadores} indicadores según la configuración académica activa.'
            }), 400

        resultados = []
        for ind_data in indicadores:
            numero      = ind_data.get('numero')
            descripcion = ind_data.get('descripcion', '').strip()

            if not numero or not (1 <= int(numero) <= max_indicadores) or not descripcion:
                return jsonify({
                    'success': False,
                    'message': f'Indicador {numero}: número inválido o descripción vacía (debe estar entre 1 y {max_indicadores}).'
                }), 400
            
            numero = int(numero)

            existente = IndicadorLogro.query.filter_by(
                docente_id=docente.id,
                curso_id=curso_id,
                materia_id=materia_id,
                bimestre_id=bimestre_id,
                numero=numero
            ).first()

            if existente:
                # Si la descripción cambió, borrar notas asociadas
                if existente.descripcion != descripcion:
                    CalificacionBimestre.query.filter_by(indicador_id=existente.id).delete()
                    existente.descripcion = descripcion
                resultados.append(existente.to_dict())
            else:
                nuevo = IndicadorLogro(
                    docente_id=docente.id,
                    curso_id=curso_id,
                    materia_id=materia_id,
                    bimestre_id=bimestre_id,
                    numero=numero,
                    descripcion=descripcion
                )
                db.session.add(nuevo)
                db.session.flush()   # Para obtener el ID antes del commit
                resultados.append(nuevo.to_dict())

        db.session.commit()
        return jsonify({'success': True, 'message': 'Indicadores guardados correctamente', 'data': resultados})
    except Exception as exc:
        db.session.rollback()
        print(f'❌ Error guardar_indicadores: {exc}')
        return jsonify({'success': False, 'message': str(exc)}), 500


# ─────────────────────────────────────────────────────────────────
# GET /calificaciones-bimestre/matriz
# Devuelve la matriz completa adaptada dinámicamente a la configuración.
# ─────────────────────────────────────────────────────────────────

@calificaciones_bimestre_bp.route('/calificaciones-bimestre/matriz', methods=['GET'])
@role_required('docente', 'admin')
def get_matriz():
    """Retorna la matriz de calificaciones lista para renderizar en la UI según configuración."""
    try:
        curso_id    = request.args.get('cursoId', type=int) or request.args.get('curso_id', type=int)
        materia_id  = request.args.get('materiaId', type=int) or request.args.get('materia_id', type=int)
        bimestre_id = request.args.get('bimestreId', type=int) or request.args.get('bimestre_id', type=int)

        if not all([curso_id, materia_id, bimestre_id]):
            return jsonify({'success': False, 'message': 'Se requieren cursoId, materiaId y bimestreId'}), 400

        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no encontrado'}), 404

        if docente.rol == 'docente' and not _docente_tiene_acceso(docente.id, curso_id, materia_id):
            return jsonify({'success': False, 'message': 'No tienes acceso a este curso/asignatura'}), 403

        config = ConfiguracionEvaluacionService.get_por_bimestre_id(bimestre_id)
        notas_por_ind = config.notas_por_indicador

        # Estudiantes del curso
        estudiantes = Estudiante.query.filter_by(curso_id=curso_id).order_by(Estudiante.nombre).all()

        # Indicadores del bimestre
        filtro_docente = {'docente_id': docente.id} if docente.rol == 'docente' else {}
        indicadores = IndicadorLogro.query.filter_by(
            curso_id=curso_id,
            materia_id=materia_id,
            bimestre_id=bimestre_id,
            **filtro_docente
        ).order_by(IndicadorLogro.numero).all()

        if not indicadores:
            return jsonify({
                'success': True,
                'data': {
                    'indicadores': [],
                    'estudiantes': [],
                    'configuracion': config.estructura(),
                    'mensaje': f'Debes configurar los {config.indicadores_por_periodo} indicadores antes de ingresar notas.'
                }
            })

        # Construir mapa de notas: {estudiante_id: {indicador_id: {numero_nota: nota}}}
        indicador_ids = [i.id for i in indicadores]
        notas_db = CalificacionBimestre.query.filter(
            CalificacionBimestre.indicador_id.in_(indicador_ids)
        ).all()

        nota_map = {}
        for n in notas_db:
            nota_map.setdefault(n.estudiante_id, {}) \
                    .setdefault(n.indicador_id, {})[n.numero_nota] = float(n.nota)

        # Armar respuesta
        filas = []
        for est in estudiantes:
            fila = {
                'estudiante_id': est.id,
                'estudiante_nombre': est.nombre,
                'indicadores': []
            }
            promedios_indicadores = []
            for ind in indicadores:
                notas_ind = nota_map.get(est.id, {}).get(ind.id, {})
                
                # Lista dinámica de notas configuradas
                notas_lista = [notas_ind.get(n) for n in range(1, notas_por_ind + 1)]
                promedio = _calcular_promedio(notas_lista)
                promedios_indicadores.append(promedio)

                ind_dict = {
                    'indicador_id': ind.id,
                    'numero': ind.numero,
                    'descripcion': ind.descripcion,
                    'notas': {n: notas_ind.get(n) for n in range(1, notas_por_ind + 1)},
                    'promedio': promedio
                }
                # Añadir claves nota_1 .. nota_N para retrocompatibilidad directa
                for n_idx in range(1, notas_por_ind + 1):
                    ind_dict[f'nota_{n_idx}'] = notas_ind.get(n_idx)

                fila['indicadores'].append(ind_dict)

            # Definitiva = promedio de los promedios de los indicadores
            fila['definitiva'] = _calcular_promedio(promedios_indicadores)
            filas.append(fila)

        return jsonify({
            'success': True,
            'data': {
                'indicadores': [i.to_dict() for i in indicadores],
                'estudiantes': filas,
                'configuracion': config.estructura()
            }
        })
    except Exception as exc:
        print(f'❌ Error get_matriz: {exc}')
        return jsonify({'success': False, 'message': str(exc)}), 500


# ─────────────────────────────────────────────────────────────────
# POST /calificaciones-bimestre/guardar
# Guarda / actualiza notas parciales en lote con validación dinámica.
# ─────────────────────────────────────────────────────────────────

@calificaciones_bimestre_bp.route('/calificaciones-bimestre/guardar', methods=['POST'])
@role_required('docente')
def guardar_notas():
    """
    Recibe un array de notas parciales y las persiste validando dinámicamente.
    Payload: { notas: [{estudianteId, indicadorId, numeroNota, nota}] }
    """
    try:
        data  = request.get_json() or {}
        notas = data.get('notas', [])

        if not notas:
            return jsonify({'success': False, 'message': 'No hay notas para guardar'}), 400

        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no encontrado'}), 404

        errores = []
        guardadas = 0

        # Caché local de indicadores y configuraciones para optimizar el lote
        indicadores_cache = {}
        config_cache = {}

        for item in notas:
            est_id   = item.get('estudianteId') or item.get('estudiante_id')
            ind_id   = item.get('indicadorId') or item.get('indicador_id')
            num_nota = item.get('numeroNota') or item.get('numero_nota')
            nota_valor = item.get('nota')

            # Validaciones básicas
            if any(v is None for v in [est_id, ind_id, num_nota, nota_valor]):
                errores.append(f'Datos incompletos: {item}')
                continue

            try:
                num_nota_int = int(num_nota)
                nota_float = float(nota_valor)
            except (TypeError, ValueError):
                errores.append(f'Nota o posición no numérica: {item}')
                continue

            # Obtener indicador y verificar pertenencia al docente
            if ind_id not in indicadores_cache:
                indicador = IndicadorLogro.query.filter_by(id=ind_id, docente_id=docente.id).first()
                indicadores_cache[ind_id] = indicador
            else:
                indicador = indicadores_cache[ind_id]

            if not indicador:
                errores.append(f'Indicador {ind_id} no autorizado o no encontrado')
                continue

            # Obtener configuración de evaluación correspondiente al año del bimestre
            if indicador.bimestre_id not in config_cache:
                config = ConfiguracionEvaluacionService.get_por_bimestre_id(indicador.bimestre_id)
                config_cache[indicador.bimestre_id] = config
            else:
                config = config_cache[indicador.bimestre_id]

            # Validación dinámica de posición de nota y rango de escala
            if num_nota_int < 1 or num_nota_int > config.notas_por_indicador:
                errores.append(f'numero_nota {num_nota_int} inválido (máx {config.notas_por_indicador})')
                continue

            min_escala = float(config.escala_minima)
            max_escala = float(config.escala_maxima)
            if not (min_escala <= nota_float <= max_escala):
                errores.append(f'Nota {nota_float} fuera de rango ({min_escala}–{max_escala})')
                continue

            existente = CalificacionBimestre.query.filter_by(
                estudiante_id=est_id,
                indicador_id=ind_id,
                numero_nota=num_nota_int
            ).first()

            if existente:
                existente.nota = nota_float
                existente.fecha_registro = datetime.now()
            else:
                nueva = CalificacionBimestre(
                    estudiante_id=est_id,
                    docente_id=docente.id,
                    indicador_id=ind_id,
                    numero_nota=num_nota_int,
                    nota=nota_float,
                    fecha_registro=datetime.now()
                )
                db.session.add(nueva)

            guardadas += 1

        if guardadas == 0 and errores:
            return jsonify({
                'success': False,
                'message': 'No se pudo guardar ninguna nota debido a errores de validación',
                'errores': errores
            }), 400

        db.session.commit()

        resp = {
            'success': True,
            'message': f'{guardadas} nota(s) guardada(s) correctamente.',
            'guardadas': guardadas
        }
        if errores:
            resp['advertencias'] = errores

        return jsonify(resp), 200
    except Exception as exc:
        db.session.rollback()
        print(f'❌ Error guardar_notas: {exc}')
        return jsonify({'success': False, 'message': str(exc)}), 500


# ─────────────────────────────────────────────────────────────────
# GET /calificaciones-bimestre/familia/<estudiante_id>
# Vista para el rol familia: nota por indicador + definitiva dinámicas.
# ─────────────────────────────────────────────────────────────────

@calificaciones_bimestre_bp.route('/calificaciones-bimestre/familia/<int:estudiante_id>', methods=['GET'])
@role_required('familia', 'admin')
def get_calificaciones_familia(estudiante_id):
    """Retorna el desglose de notas por indicador y definitiva dinámicas para un estudiante."""
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'message': 'Usuario no autenticado'}), 401

        estudiante = Estudiante.query.get(estudiante_id)
        if not estudiante:
            return jsonify({'success': False, 'message': 'Estudiante no encontrado'}), 404

        # Validar autorización si es rol familia (anti-IDOR)
        if current_user.rol == 'familia':
            hijos_ids = [e.id for e in current_user.estudiantes]
            if current_user.estudiante_id and current_user.estudiante_id not in hijos_ids:
                hijos_ids.append(current_user.estudiante_id)

            if estudiante_id not in hijos_ids:
                return jsonify({
                    'success': False,
                    'message': 'No tienes permisos para consultar las calificaciones de este estudiante'
                }), 403

        notas_db = db.session.query(
            CalificacionBimestre,
            IndicadorLogro,
            Bimestre,
            Materia
        ).join(
            IndicadorLogro, CalificacionBimestre.indicador_id == IndicadorLogro.id
        ).join(
            Bimestre, IndicadorLogro.bimestre_id == Bimestre.id
        ).outerjoin(
            Materia, IndicadorLogro.materia_id == Materia.id
        ).filter(
            CalificacionBimestre.estudiante_id == estudiante_id
        ).order_by(
            Bimestre.anio.desc(), Bimestre.orden, Materia.nombre, IndicadorLogro.numero
        ).all()


        # Agrupar por bimestre → materia → indicador
        agrupado = {}
        config_cache = {}

        for calif, ind, bimestre, materia in notas_db:
            materia_nombre = materia.nombre if materia else (getattr(ind, 'materia_nombre', None) or 'Asignatura')
            key_bimestre = (bimestre.id, bimestre.nombre, bimestre.anio)
            if key_bimestre not in agrupado:
                agrupado[key_bimestre] = {}

            key_materia = (ind.materia_id, materia_nombre)
            if key_materia not in agrupado[key_bimestre]:
                agrupado[key_bimestre][key_materia] = {
                    'materia_id': ind.materia_id,
                    'materia_nombre': materia_nombre,
                    'indicadores': {}
                }

            ind_data = agrupado[key_bimestre][key_materia]['indicadores']
            if ind.id not in ind_data:
                ind_data[ind.id] = {
                    'indicador_id': ind.id,
                    'numero': ind.numero,
                    'descripcion': ind.descripcion,
                    'notas': {}
                }
            ind_data[ind.id]['notas'][calif.numero_nota] = float(calif.nota)

        # Serializar a lista plana para el frontend
        resultado = []
        for (bimestre_id, bimestre_nombre, anio), materias in agrupado.items():
            if anio not in config_cache:
                config_cache[anio] = ConfiguracionEvaluacionService.get_por_anio(anio) or ConfiguracionEvaluacionService.get_or_create_default(anio)
            config = config_cache[anio]
            notas_por_ind = config.notas_por_indicador

            for (materia_id, materia_nombre), materia_data in materias.items():
                promedios_ind = []
                indicadores_out = []
                for ind_id, ind_info in materia_data['indicadores'].items():
                    notas_vals = [ind_info['notas'].get(n) for n in range(1, notas_por_ind + 1)]
                    promedio_ind = _calcular_promedio([v for v in notas_vals if v is not None])
                    promedios_ind.append(promedio_ind)

                    ind_payload = {
                        'numero': ind_info['numero'],
                        'descripcion': ind_info['descripcion'],
                        'notas': ind_info['notas'],
                        'promedio': promedio_ind
                    }
                    for n in range(1, notas_por_ind + 1):
                        ind_payload[f'nota_{n}'] = ind_info['notas'].get(n)

                    indicadores_out.append(ind_payload)

                definitiva = _calcular_promedio([p for p in promedios_ind if p is not None])
                resultado.append({
                    'bimestre_id': bimestre_id,
                    'bimestre': bimestre_nombre,
                    'anio': anio,
                    'materia_id': materia_id,
                    'materia_nombre': materia_nombre,
                    'asignatura': materia_nombre,
                    'indicadores': sorted(indicadores_out, key=lambda x: x['numero']),
                    'definitiva': definitiva,
                    'configuracion': config.estructura()
                })

        return jsonify({'success': True, 'data': resultado})
    except Exception as exc:
        print(f'❌ Error get_calificaciones_familia: {exc}')
        return jsonify({'success': False, 'message': str(exc)}), 500
