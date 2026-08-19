"""
Rutas del sistema de evaluación por indicadores de logro y bimestres.
Complementa (no reemplaza) las rutas legacy de calificaciones.
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
from src.extensions import db
from src.models.bimestre import Bimestre
from src.models.indicador_logro import IndicadorLogro
from src.models.calificacion_bimestre import CalificacionBimestre
from src.models.estudiante import Estudiante
from src.models.docente_asignacion import DocenteAsignacion
from src.utils.auth_helpers import role_required, get_current_user

calificaciones_bimestre_bp = Blueprint('calificaciones_bimestre', __name__)


# ─────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────

def _calcular_promedio(notas: list) -> float | None:
    """Promedio simple de una lista de floats; None si la lista está vacía."""
    valores = [n for n in notas if n is not None]
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
# GET /bimestres  — Lista de bimestres disponibles
# ─────────────────────────────────────────────────────────────────

@calificaciones_bimestre_bp.route('/bimestres', methods=['GET'])
@role_required('docente', 'admin', 'familia')
def get_bimestres():
    """Retorna los bimestres del año actual (o todos si se pasa ?anio=)."""
    try:
        anio = request.args.get('anio', datetime.now().year, type=int)
        bimestres = Bimestre.query.filter_by(anio=anio).order_by(Bimestre.orden).all()

        # Si no existe el año solicitado, retornar el año actual como fallback
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
        curso_id    = request.args.get('cursoId', type=int)
        materia_id  = request.args.get('materiaId', type=int)
        bimestre_id = request.args.get('bimestreId', type=int)

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

        return jsonify({'success': True, 'data': [i.to_dict() for i in indicadores]})
    except Exception as exc:
        print(f'❌ Error get_indicadores: {exc}')
        return jsonify({'success': False, 'message': str(exc)}), 500


# ─────────────────────────────────────────────────────────────────
# POST /calificaciones-bimestre/indicadores
# Crea o actualiza los 2 indicadores de un bimestre.
# Si ya existen notas para un indicador que cambia, las borra.
# ─────────────────────────────────────────────────────────────────

@calificaciones_bimestre_bp.route('/calificaciones-bimestre/indicadores', methods=['POST'])
@role_required('docente')
def guardar_indicadores():
    """Guarda / actualiza los indicadores de logro para un bimestre."""
    try:
        data        = request.get_json() or {}
        curso_id    = data.get('cursoId')
        materia_id  = data.get('materiaId')
        bimestre_id = data.get('bimestreId')
        indicadores = data.get('indicadores', [])   # [{numero: 1, descripcion: '...'}, {numero: 2, ...}]

        if not all([curso_id, materia_id, bimestre_id]):
            return jsonify({'success': False, 'message': 'Faltan campos requeridos'}), 400

        if len(indicadores) != 2:
            return jsonify({'success': False, 'message': 'Se deben enviar exactamente 2 indicadores'}), 400

        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no encontrado'}), 404

        if not _docente_tiene_acceso(docente.id, curso_id, materia_id):
            return jsonify({'success': False, 'message': 'No tienes acceso a este curso/asignatura'}), 403

        resultados = []
        for ind_data in indicadores:
            numero      = ind_data.get('numero')
            descripcion = ind_data.get('descripcion', '').strip()

            if numero not in (1, 2) or not descripcion:
                return jsonify({'success': False, 'message': f'Indicador {numero}: número o descripción inválidos'}), 400

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
# Devuelve la matriz completa: estudiantes x indicadores x notas.
# ─────────────────────────────────────────────────────────────────

@calificaciones_bimestre_bp.route('/calificaciones-bimestre/matriz', methods=['GET'])
@role_required('docente', 'admin')
def get_matriz():
    """Retorna la matriz de calificaciones lista para renderizar en la UI."""
    try:
        curso_id    = request.args.get('cursoId', type=int)
        materia_id  = request.args.get('materiaId', type=int)
        bimestre_id = request.args.get('bimestreId', type=int)

        if not all([curso_id, materia_id, bimestre_id]):
            return jsonify({'success': False, 'message': 'Se requieren cursoId, materiaId y bimestreId'}), 400

        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no encontrado'}), 404

        if docente.rol == 'docente' and not _docente_tiene_acceso(docente.id, curso_id, materia_id):
            return jsonify({'success': False, 'message': 'No tienes acceso a este curso/asignatura'}), 403

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
                    'mensaje': 'Debes configurar los indicadores antes de ingresar notas.'
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
                n1 = notas_ind.get(1)
                n2 = notas_ind.get(2)
                n3 = notas_ind.get(3)
                promedio = _calcular_promedio([n1, n2, n3])
                promedios_indicadores.append(promedio)
                fila['indicadores'].append({
                    'indicador_id': ind.id,
                    'numero': ind.numero,
                    'descripcion': ind.descripcion,
                    'nota_1': n1,
                    'nota_2': n2,
                    'nota_3': n3,
                    'promedio': promedio
                })

            # Definitiva = promedio de los promedios de los indicadores
            fila['definitiva'] = _calcular_promedio(promedios_indicadores)
            filas.append(fila)

        return jsonify({
            'success': True,
            'data': {
                'indicadores': [i.to_dict() for i in indicadores],
                'estudiantes': filas
            }
        })
    except Exception as exc:
        print(f'❌ Error get_matriz: {exc}')
        return jsonify({'success': False, 'message': str(exc)}), 500


# ─────────────────────────────────────────────────────────────────
# POST /calificaciones-bimestre/guardar
# Guarda / actualiza notas parciales en lote.
# ─────────────────────────────────────────────────────────────────

@calificaciones_bimestre_bp.route('/calificaciones-bimestre/guardar', methods=['POST'])
@role_required('docente')
def guardar_notas():
    """
    Recibe un array de notas parciales y las persiste.
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

        for item in notas:
            est_id      = item.get('estudianteId')
            ind_id      = item.get('indicadorId')
            num_nota    = item.get('numeroNota')
            nota_valor  = item.get('nota')

            # Validaciones básicas
            if any(v is None for v in [est_id, ind_id, num_nota, nota_valor]):
                errores.append(f'Datos incompletos: {item}')
                continue

            if num_nota not in (1, 2, 3):
                errores.append(f'numero_nota inválido ({num_nota})')
                continue

            try:
                nota_float = float(nota_valor)
            except (TypeError, ValueError):
                errores.append(f'Nota no numérica para estudiante {est_id}')
                continue

            if not (0.0 <= nota_float <= 5.0):
                errores.append(f'Nota {nota_float} fuera de rango (0–5)')
                continue

            # Verificar que el indicador pertenece al docente actual
            indicador = IndicadorLogro.query.filter_by(id=ind_id, docente_id=docente.id).first()
            if not indicador:
                errores.append(f'Indicador {ind_id} no autorizado')
                continue

            existente = CalificacionBimestre.query.filter_by(
                estudiante_id=est_id,
                indicador_id=ind_id,
                numero_nota=num_nota
            ).first()

            if existente:
                existente.nota = nota_float
                existente.fecha_registro = datetime.now()
            else:
                nueva = CalificacionBimestre(
                    estudiante_id=est_id,
                    docente_id=docente.id,
                    indicador_id=ind_id,
                    numero_nota=num_nota,
                    nota=nota_float,
                    fecha_registro=datetime.now()
                )
                db.session.add(nueva)

            guardadas += 1

        db.session.commit()

        resp = {
            'success': True,
            'message': f'{guardadas} nota(s) guardada(s) correctamente.',
            'guardadas': guardadas
        }
        if errores:
            resp['advertencias'] = errores

        return jsonify(resp)
    except Exception as exc:
        db.session.rollback()
        print(f'❌ Error guardar_notas: {exc}')
        return jsonify({'success': False, 'message': str(exc)}), 500


# ─────────────────────────────────────────────────────────────────
# GET /calificaciones-bimestre/familia/<estudiante_id>
# Vista para el rol familia: nota por indicador + definitiva.
# ─────────────────────────────────────────────────────────────────

@calificaciones_bimestre_bp.route('/calificaciones-bimestre/familia/<int:estudiante_id>', methods=['GET'])
@role_required('familia', 'admin')
def get_calificaciones_familia(estudiante_id):
    """Retorna el desglose de notas por indicador y definitiva para un estudiante."""
    try:
        notas_db = db.session.query(
            CalificacionBimestre,
            IndicadorLogro,
            Bimestre
        ).join(
            IndicadorLogro, CalificacionBimestre.indicador_id == IndicadorLogro.id
        ).join(
            Bimestre, IndicadorLogro.bimestre_id == Bimestre.id
        ).filter(
            CalificacionBimestre.estudiante_id == estudiante_id
        ).order_by(
            Bimestre.anio.desc(), Bimestre.orden, IndicadorLogro.numero
        ).all()

        # Agrupar por bimestre → materia → indicador
        agrupado = {}
        for calif, ind, bimestre in notas_db:
            key_bimestre = (bimestre.id, bimestre.nombre, bimestre.anio)
            if key_bimestre not in agrupado:
                agrupado[key_bimestre] = {}

            key_materia = ind.materia_id
            if key_materia not in agrupado[key_bimestre]:
                agrupado[key_bimestre][key_materia] = {
                    'materia_id': ind.materia_id,
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
            for materia_id, materia_data in materias.items():
                promedios_ind = []
                indicadores_out = []
                for ind_id, ind_info in materia_data['indicadores'].items():
                    notas_vals = [ind_info['notas'].get(n) for n in (1, 2, 3)]
                    promedio_ind = _calcular_promedio([v for v in notas_vals if v is not None])
                    promedios_ind.append(promedio_ind)
                    indicadores_out.append({
                        'numero': ind_info['numero'],
                        'descripcion': ind_info['descripcion'],
                        'nota_1': ind_info['notas'].get(1),
                        'nota_2': ind_info['notas'].get(2),
                        'nota_3': ind_info['notas'].get(3),
                        'promedio': promedio_ind
                    })

                definitiva = _calcular_promedio([p for p in promedios_ind if p is not None])
                resultado.append({
                    'bimestre_id': bimestre_id,
                    'bimestre': bimestre_nombre,
                    'anio': anio,
                    'materia_id': materia_id,
                    'indicadores': sorted(indicadores_out, key=lambda x: x['numero']),
                    'definitiva': definitiva
                })

        return jsonify({'success': True, 'data': resultado})
    except Exception as exc:
        print(f'❌ Error get_calificaciones_familia: {exc}')
        return jsonify({'success': False, 'message': str(exc)}), 500
