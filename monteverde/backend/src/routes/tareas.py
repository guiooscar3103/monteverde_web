from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from src.extensions import db
from src.models.usuario import Usuario
from src.models.curso import Curso
from src.models.materia import Materia
from src.models.estudiante import Estudiante
from src.models.docente_asignacion import DocenteAsignacion
from src.models.tarea import Tarea
from src.models.entrega import Entrega
from src.models.bimestre import Bimestre
from src.models.indicador_logro import IndicadorLogro
from src.models.calificacion_bimestre import CalificacionBimestre
from src.utils.auth_helpers import role_required, get_current_user

tareas_bp = Blueprint('tareas', __name__)

@tareas_bp.route('/docente/tareas', methods=['POST'])
@role_required('docente')
def crear_tarea():
    """
    Crea una nueva tarea académica.
    Valida que el docente autenticado tenga asignado el curso y la materia correspondientes.
    Permite opcionalmente vincular la tarea a una calificación bimestral (indicador + número de nota).
    """
    try:
        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no autenticado'}), 401

        data = request.get_json() or {}
        titulo = data.get('titulo')
        descripcion = data.get('descripcion', '')
        fecha_vencimiento_str = data.get('fecha_vencimiento')
        curso_id = data.get('curso_id')
        materia_id = data.get('materia_id')
        estado = data.get('estado', 'PUBLICADA')
        tipo_evaluacion = data.get('tipo_evaluacion')

        # Campos de vinculación bimestral
        califica_bimestre_raw = data.get('califica_bimestre', False)
        califica_bimestre = bool(califica_bimestre_raw is True or str(califica_bimestre_raw).lower() in ('true', '1'))
        bimestre_id = data.get('bimestre_id')
        indicador_id = data.get('indicador_id')
        numero_nota = data.get('numero_nota')

        if not titulo or not fecha_vencimiento_str or not curso_id or not materia_id:
            return jsonify({
                'success': False, 
                'message': 'Campos obligatorios: titulo, fecha_vencimiento, curso_id, materia_id'
            }), 400

        if estado not in ('BORRADOR', 'PUBLICADA', 'CERRADA'):
            return jsonify({'success': False, 'message': 'Estado inválido. Debe ser BORRADOR, PUBLICADA o CERRADA'}), 400

        # Validar formato de fecha de vencimiento
        try:
            if 'T' in fecha_vencimiento_str:
                fecha_vencimiento = datetime.fromisoformat(fecha_vencimiento_str.replace('Z', '+00:00'))
            else:
                fecha_vencimiento = datetime.strptime(fecha_vencimiento_str, '%Y-%m-%d')
        except Exception:
            return jsonify({'success': False, 'message': 'Formato de fecha_vencimiento inválido. Use ISO o YYYY-MM-DD'}), 400

        # Validar asignación docente -> curso -> materia (Seguridad IDOR y permisos)
        asignacion = DocenteAsignacion.query.filter_by(
            docente_id=docente.id,
            curso_id=curso_id,
            materia_id=materia_id
        ).first()

        if not asignacion:
            return jsonify({
                'success': False, 
                'message': 'Acceso denegado: No tienes asignado este curso y asignatura'
            }), 403

        # Validaciones de vinculación académica bimestral
        if califica_bimestre:
            if not bimestre_id or not indicador_id or numero_nota is None:
                return jsonify({
                    'success': False,
                    'message': 'Si la tarea califica bimestre, debe especificar bimestre_id, indicador_id y numero_nota'
                }), 400

            try:
                numero_nota_int = int(numero_nota)
                if numero_nota_int not in (1, 2, 3):
                    return jsonify({'success': False, 'message': 'numero_nota debe ser 1, 2 o 3'}), 400
                numero_nota = numero_nota_int
            except (ValueError, TypeError):
                return jsonify({'success': False, 'message': 'numero_nota debe ser un número entero (1, 2 o 3)'}), 400

            bimestre = Bimestre.query.get(bimestre_id)
            if not bimestre:
                return jsonify({'success': False, 'message': 'Bimestre no encontrado'}), 404

            indicador = IndicadorLogro.query.get(indicador_id)
            if not indicador or indicador.curso_id != curso_id or indicador.materia_id != materia_id or indicador.bimestre_id != bimestre_id:
                return jsonify({
                    'success': False,
                    'message': 'El indicador de logro no corresponde al curso, materia y bimestre seleccionados'
                }), 400

            # Integridad de las casillas: Verificar que no exista otra tarea vinculada a la misma casilla (HTTP 409 Conflict)
            tarea_existente = Tarea.query.filter(
                Tarea.curso_id == curso_id,
                Tarea.materia_id == materia_id,
                Tarea.bimestre_id == bimestre_id,
                Tarea.indicador_id == indicador_id,
                Tarea.numero_nota == numero_nota,
                Tarea.califica_bimestre == True
            ).first()

            if tarea_existente:
                return jsonify({
                    'success': False,
                    'message': f'Conflicto: Ya existe una tarea ("{tarea_existente.titulo}") vinculada a esta casilla académica (Indicador {indicador.numero}, Nota {numero_nota})'
                }), 409
        else:
            bimestre_id = None
            indicador_id = None
            numero_nota = None

        nueva_tarea = Tarea(
            titulo=titulo.strip(),
            descripcion=descripcion.strip() if descripcion else '',
            fecha_vencimiento=fecha_vencimiento,
            estado=estado,
            docente_id=docente.id,
            curso_id=curso_id,
            materia_id=materia_id,
            califica_bimestre=califica_bimestre,
            bimestre_id=bimestre_id,
            indicador_id=indicador_id,
            numero_nota=numero_nota,
            tipo_evaluacion=tipo_evaluacion.strip() if tipo_evaluacion else None
        )

        db.session.add(nueva_tarea)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Tarea creada exitosamente',
            'data': nueva_tarea.to_dict(include_stats=True)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error creando tarea: {str(e)}'}), 500


@tareas_bp.route('/docente/tareas', methods=['GET'])
@role_required('docente')
def listar_tareas_docente():
    """
    Lista las tareas del docente autenticado.
    Filtra estrictamente por docente_id desde JWT.
    """
    try:
        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no autenticado'}), 401

        query = Tarea.query.filter_by(docente_id=docente.id)

        # Filtros opcionales
        curso_id = request.args.get('curso_id', type=int)
        materia_id = request.args.get('materia_id', type=int)
        estado = request.args.get('estado')

        if curso_id:
            query = query.filter_by(curso_id=curso_id)
        if materia_id:
            query = query.filter_by(materia_id=materia_id)
        if estado:
            query = query.filter_by(estado=estado)

        tareas = query.order_by(Tarea.fecha_vencimiento.desc()).all()

        return jsonify({
            'success': True,
            'data': [t.to_dict(include_stats=True) for t in tareas],
            'total': len(tareas)
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error listando tareas: {str(e)}'}), 500


@tareas_bp.route('/docente/tareas/<int:tarea_id>', methods=['GET'])
@role_required('docente')
def obtener_tarea_docente(tarea_id):
    """
    Obtiene el detalle de una tarea específica del docente autenticado.
    Protegido contra IDOR.
    """
    try:
        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no autenticado'}), 401

        tarea = Tarea.query.get(tarea_id)
        if not tarea or tarea.docente_id != docente.id:
            return jsonify({'success': False, 'message': 'Tarea no encontrada'}), 404

        return jsonify({
            'success': True,
            'data': tarea.to_dict(include_stats=True)
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error obteniendo tarea: {str(e)}'}), 500


@tareas_bp.route('/docente/tareas/<int:tarea_id>', methods=['PUT'])
@role_required('docente')
def actualizar_tarea_docente(tarea_id):
    """
    Actualiza una tarea existente del docente autenticado.
    Protegido contra IDOR.
    """
    try:
        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no autenticado'}), 401

        tarea = Tarea.query.get(tarea_id)
        if not tarea or tarea.docente_id != docente.id:
            return jsonify({'success': False, 'message': 'Tarea no encontrada'}), 404

        data = request.get_json() or {}

        # Si se modifican curso_id o materia_id, validar nueva asignación
        nuevo_curso_id = data.get('curso_id', tarea.curso_id)
        nueva_materia_id = data.get('materia_id', tarea.materia_id)

        if nuevo_curso_id != tarea.curso_id or nueva_materia_id != tarea.materia_id:
            asignacion = DocenteAsignacion.query.filter_by(
                docente_id=docente.id,
                curso_id=nuevo_curso_id,
                materia_id=nueva_materia_id
            ).first()
            if not asignacion:
                return jsonify({
                    'success': False, 
                    'message': 'No tienes asignado el nuevo curso y asignatura'
                }), 403
            tarea.curso_id = nuevo_curso_id
            tarea.materia_id = nueva_materia_id

        if 'titulo' in data:
            tarea.titulo = data['titulo'].strip()
        if 'descripcion' in data:
            tarea.descripcion = data['descripcion'].strip() if data['descripcion'] else ''
        if 'estado' in data:
            if data['estado'] not in ('BORRADOR', 'PUBLICADA', 'CERRADA'):
                return jsonify({'success': False, 'message': 'Estado inválido'}), 400
            tarea.estado = data['estado']
        if 'fecha_vencimiento' in data:
            fecha_str = data['fecha_vencimiento']
            try:
                if 'T' in fecha_str:
                    tarea.fecha_vencimiento = datetime.fromisoformat(fecha_str.replace('Z', '+00:00'))
                else:
                    tarea.fecha_vencimiento = datetime.strptime(fecha_str, '%Y-%m-%d')
            except Exception:
                return jsonify({'success': False, 'message': 'Formato de fecha_vencimiento inválido'}), 400

        if 'tipo_evaluacion' in data:
            tarea.tipo_evaluacion = data['tipo_evaluacion'].strip() if data['tipo_evaluacion'] else None

        # Actualizar configuración de calificación bimestral si se envía
        if 'califica_bimestre' in data:
            califica_raw = data['califica_bimestre']
            califica_bimestre = bool(califica_raw is True or str(califica_raw).lower() in ('true', '1'))
            if califica_bimestre:
                bimestre_id = data.get('bimestre_id', tarea.bimestre_id)
                indicador_id = data.get('indicador_id', tarea.indicador_id)
                numero_nota = data.get('numero_nota', tarea.numero_nota)

                if not bimestre_id or not indicador_id or numero_nota is None:
                    return jsonify({
                        'success': False,
                        'message': 'Si la tarea califica bimestre, debe especificar bimestre_id, indicador_id y numero_nota'
                    }), 400

                try:
                    numero_nota_int = int(numero_nota)
                    if numero_nota_int not in (1, 2, 3):
                        return jsonify({'success': False, 'message': 'numero_nota debe ser 1, 2 o 3'}), 400
                    numero_nota = numero_nota_int
                except (ValueError, TypeError):
                    return jsonify({'success': False, 'message': 'numero_nota debe ser un número entero (1, 2 o 3)'}), 400

                bimestre = Bimestre.query.get(bimestre_id)
                if not bimestre:
                    return jsonify({'success': False, 'message': 'Bimestre no encontrado'}), 404

                indicador = IndicadorLogro.query.get(indicador_id)
                if not indicador or indicador.curso_id != tarea.curso_id or indicador.materia_id != tarea.materia_id or indicador.bimestre_id != bimestre_id:
                    return jsonify({
                        'success': False,
                        'message': 'El indicador de logro no corresponde al curso, materia y bimestre seleccionados'
                    }), 400

                # Validar integridad: no duplicar casilla académica con otra tarea
                tarea_existente = Tarea.query.filter(
                    Tarea.curso_id == tarea.curso_id,
                    Tarea.materia_id == tarea.materia_id,
                    Tarea.bimestre_id == bimestre_id,
                    Tarea.indicador_id == indicador_id,
                    Tarea.numero_nota == numero_nota,
                    Tarea.califica_bimestre == True,
                    Tarea.id != tarea.id
                ).first()

                if tarea_existente:
                    return jsonify({
                        'success': False,
                        'message': f'Conflicto: Ya existe otra tarea ("{tarea_existente.titulo}") vinculada a esta casilla académica (Indicador {indicador.numero}, Nota {numero_nota})'
                    }), 409

                tarea.califica_bimestre = True
                tarea.bimestre_id = bimestre_id
                tarea.indicador_id = indicador_id
                tarea.numero_nota = numero_nota
            else:
                tarea.califica_bimestre = False
                tarea.bimestre_id = None
                tarea.indicador_id = None
                tarea.numero_nota = None

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Tarea actualizada exitosamente',
            'data': tarea.to_dict(include_stats=True)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error actualizando tarea: {str(e)}'}), 500


@tareas_bp.route('/docente/tareas/<int:tarea_id>', methods=['DELETE'])
@role_required('docente')
def eliminar_tarea_docente(tarea_id):
    """
    Elimina una tarea del docente autenticado.
    Protegido contra IDOR.
    """
    try:
        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no autenticado'}), 401

        tarea = Tarea.query.get(tarea_id)
        if not tarea or tarea.docente_id != docente.id:
            return jsonify({'success': False, 'message': 'Tarea no encontrada'}), 404

        db.session.delete(tarea)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Tarea eliminada exitosamente'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error eliminando tarea: {str(e)}'}), 500


@tareas_bp.route('/docente/tareas/<int:tarea_id>/entregas', methods=['GET'])
@role_required('docente')
def listar_entregas_tarea(tarea_id):
    """
    Lista las entregas de todos los estudiantes del curso para una tarea.
    Protegido contra IDOR.
    """
    try:
        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no autenticado'}), 401

        tarea = Tarea.query.get(tarea_id)
        if not tarea or tarea.docente_id != docente.id:
            return jsonify({'success': False, 'message': 'Tarea no encontrada'}), 404

        # Obtener todos los estudiantes del curso
        estudiantes = Estudiante.query.filter_by(curso_id=tarea.curso_id).order_by(Estudiante.nombre).all()
        
        # Mapear entregas existentes
        entregas_dict = {e.estudiante_id: e for e in tarea.entregas}

        lista_resultado = []
        for est in estudiantes:
            entrega = entregas_dict.get(est.id)
            if entrega:
                lista_resultado.append(entrega.to_dict())
            else:
                lista_resultado.append({
                    'id': None,
                    'tarea_id': tarea.id,
                    'estudiante_id': est.id,
                    'estudiante_nombre': est.nombre,
                    'fecha_entrega': None,
                    'archivo_url': None,
                    'contenido': None,
                    'estado': 'PENDIENTE',
                    'calificacion': None,
                    'comentarios': None
                })

        return jsonify({
            'success': True,
            'data': {
                'tarea': tarea.to_dict(include_stats=True),
                'entregas': lista_resultado,
                'total_estudiantes': len(estudiantes),
                'total_entregadas': len([e for e in lista_resultado if e['estado'] in ('ENTREGADA', 'CALIFICADA')])
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error listando entregas: {str(e)}'}), 500


@tareas_bp.route('/docente/tareas/<int:tarea_id>/calificar', methods=['POST'])
@role_required('docente')
def calificar_entrega_tarea(tarea_id):
    """
    Registra o actualiza la calificación / estado de entrega de un estudiante.
    Si la tarea está configurada con califica_bimestre=True, realiza automáticamente
    el UPSERT de la calificación en calificaciones_bimestre de forma atómica.
    Protegido contra IDOR.
    """
    try:
        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no autenticado'}), 401

        tarea = Tarea.query.get(tarea_id)
        if not tarea or tarea.docente_id != docente.id:
            return jsonify({'success': False, 'message': 'Tarea no encontrada'}), 404

        data = request.get_json() or {}
        estudiante_id = data.get('estudiante_id')
        calificacion = data.get('calificacion')
        comentarios = data.get('comentarios', '')
        estado = data.get('estado')

        if not estudiante_id:
            return jsonify({'success': False, 'message': 'estudiante_id es requerido'}), 400

        # Validar que el estudiante pertenezca al curso de la tarea
        estudiante = Estudiante.query.get(estudiante_id)
        if not estudiante or estudiante.curso_id != tarea.curso_id:
            return jsonify({'success': False, 'message': 'El estudiante no pertenece al curso de esta tarea'}), 400

        # Validar calificación si se proporciona
        if calificacion is not None:
            try:
                calificacion_float = float(calificacion)
                if calificacion_float < 0.0 or calificacion_float > 5.0:
                    return jsonify({'success': False, 'message': 'La calificación debe estar entre 0.00 y 5.00'}), 400
            except ValueError:
                return jsonify({'success': False, 'message': 'Calificación numérica inválida'}), 400
        else:
            calificacion_float = None

        if not estado:
            estado = 'CALIFICADA' if calificacion_float is not None else 'ENTREGADA'

        if estado not in ('PENDIENTE', 'ENTREGADA', 'CALIFICADA'):
            return jsonify({'success': False, 'message': 'Estado inválido'}), 400

        # 1. Buscar entrega existente o crear nueva
        entrega = Entrega.query.filter_by(tarea_id=tarea.id, estudiante_id=estudiante_id).first()
        if not entrega:
            entrega = Entrega(
                tarea_id=tarea.id,
                estudiante_id=estudiante_id,
                estado=estado,
                calificacion=calificacion_float,
                comentarios=comentarios
            )
            db.session.add(entrega)
        else:
            entrega.estado = estado
            if calificacion_float is not None:
                entrega.calificacion = calificacion_float
            if comentarios is not None:
                entrega.comentarios = comentarios

        # 2. Sincronización atómica con calificaciones_bimestre si la tarea califica bimestre
        if tarea.califica_bimestre and tarea.indicador_id and tarea.numero_nota:
            if calificacion_float is not None:
                calif_bim = CalificacionBimestre.query.filter_by(
                    estudiante_id=estudiante_id,
                    indicador_id=tarea.indicador_id,
                    numero_nota=tarea.numero_nota
                ).first()

                if not calif_bim:
                    calif_bim = CalificacionBimestre(
                        estudiante_id=estudiante_id,
                        docente_id=docente.id,
                        indicador_id=tarea.indicador_id,
                        numero_nota=tarea.numero_nota,
                        nota=calificacion_float,
                        tarea_id=tarea.id
                    )
                    db.session.add(calif_bim)
                else:
                    calif_bim.nota = calificacion_float
                    calif_bim.docente_id = docente.id
                    calif_bim.tarea_id = tarea.id
                    calif_bim.fecha_registro = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Calificación guardada y sincronizada exitosamente',
            'data': entrega.to_dict(),
            'sincronizado_bimestre': bool(tarea.califica_bimestre)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error guardando calificación: {str(e)}'}), 500


@tareas_bp.route('/familia/tareas-semaforo/<int:estudiante_id>', methods=['GET'])
@role_required('familia', 'admin')
def semaforo_tareas_estudiante(estudiante_id):
    """
    Semáforo de Tareas Académicas para el estudiante de la familia.
    Valida que el estudiante pertenezca a la familia autenticada (403 Forbidden si no).
    Clasifica las tareas del curso del estudiante en:
      - Entregadas (🟢)
      - Pendientes (🟡 > 48h)
      - Próximas a vencer (🔴 <= 48h)
      - Vencidas (pasaron la fecha límite sin entrega)
    """
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'message': 'Usuario no autenticado'}), 401

        # 1. Obtener estudiante
        estudiante = Estudiante.query.get(estudiante_id)
        if not estudiante:
            return jsonify({'success': False, 'message': 'Estudiante no encontrado'}), 404

        # 2. Validar autorización si es rol familia
        if current_user.rol == 'familia':
            hijos_ids = [e.id for e in current_user.estudiantes]
            if current_user.estudiante_id:
                hijos_ids.append(current_user.estudiante_id)

            if estudiante_id not in hijos_ids:
                return jsonify({
                    'success': False,
                    'message': 'No tienes permisos para consultar la información de este estudiante'
                }), 403

        # Si el estudiante no tiene curso asignado
        if not estudiante.curso_id:
            return jsonify({
                'success': True,
                'data': {
                    'estudiante_id': estudiante.id,
                    'estudiante_nombre': estudiante.nombre,
                    'curso_id': None,
                    'curso_nombre': None,
                    'entregadas': 0,
                    'pendientes': 0,
                    'proximas_a_vencer': 0,
                    'vencidas': 0,
                    'total': 0,
                    'detalle': []
                }
            }), 200

        # 3. Obtener tareas publicadas del curso del estudiante con relaciones precargadas (0 N+1)
        from sqlalchemy.orm import joinedload
        tareas = Tarea.query.options(
            joinedload(Tarea.materia),
            joinedload(Tarea.docente)
        ).filter_by(
            curso_id=estudiante.curso_id,
            estado='PUBLICADA'
        ).order_by(Tarea.fecha_vencimiento.asc()).all()

        if not tareas:
            return jsonify({
                'success': True,
                'data': {
                    'estudiante_id': estudiante.id,
                    'estudiante_nombre': estudiante.nombre,
                    'curso_id': estudiante.curso_id,
                    'curso_nombre': estudiante.curso.nombre if estudiante.curso else None,
                    'entregadas': 0,
                    'pendientes': 0,
                    'proximas_a_vencer': 0,
                    'vencidas': 0,
                    'total': 0,
                    'detalle': []
                }
            }), 200

        # 4. Obtener todas las entregas del estudiante para estas tareas en una sola consulta
        tarea_ids = [t.id for t in tareas]
        entregas = Entrega.query.filter(
            Entrega.estudiante_id == estudiante_id,
            Entrega.tarea_id.in_(tarea_ids)
        ).all()
        entregas_map = {e.tarea_id: e for e in entregas}

        # 5. Clasificar cada tarea
        ahora = datetime.utcnow()
        limite_48h = ahora + timedelta(hours=48)

        count_entregadas = 0
        count_pendientes = 0
        count_proximas = 0
        count_vencidas = 0
        detalle = []

        for tarea in tareas:
            entrega = entregas_map.get(tarea.id)
            tiene_entrega_valida = entrega and entrega.estado in ('ENTREGADA', 'CALIFICADA')

            if tiene_entrega_valida:
                estado_calc = 'ENTREGADA'
                count_entregadas += 1
            else:
                vencimiento = tarea.fecha_vencimiento
                if vencimiento < ahora:
                    estado_calc = 'VENCIDA'
                    count_vencidas += 1
                elif vencimiento <= limite_48h:
                    estado_calc = 'PROXIMA_A_VENCER'
                    count_proximas += 1
                else:
                    estado_calc = 'PENDIENTE'
                    count_pendientes += 1

            # Determinar estado de entrega con prioridad a CALIFICADA
            if entrega and entrega.estado == 'CALIFICADA':
                estado_entrega = 'CALIFICADA'
            elif entrega and entrega.estado == 'ENTREGADA':
                estado_entrega = 'ENTREGADA'
            elif entrega and entrega.estado == 'PENDIENTE':
                estado_entrega = 'PENDIENTE'
            else:
                estado_entrega = 'PENDIENTE'

            calificacion_val = float(entrega.calificacion) if entrega and entrega.calificacion is not None else None

            detalle.append({
                'id': tarea.id,
                'tarea_id': tarea.id,
                'titulo': tarea.titulo,
                'descripcion': tarea.descripcion or '',
                'materia': tarea.materia.nombre if tarea.materia else 'General',
                'materia_nombre': tarea.materia.nombre if tarea.materia else 'General',
                'materia_id': tarea.materia_id,
                'docente_nombre': tarea.docente.nombre if tarea.docente else 'Docente',
                'docente_id': tarea.docente_id,
                'fecha_vencimiento': tarea.fecha_vencimiento.isoformat() if tarea.fecha_vencimiento else None,
                'fecha_limite': tarea.fecha_vencimiento.isoformat() if tarea.fecha_vencimiento else None,
                'estado_calculado': estado_calc,
                'estado_entrega': estado_entrega,
                'entrega_estado': entrega.estado if entrega else 'NO_ENTREGADA',
                'nota': calificacion_val,
                'calificacion': calificacion_val,
                'comentarios': entrega.comentarios if entrega else None,
                'fecha_entrega': entrega.fecha_entrega.isoformat() if entrega and entrega.fecha_entrega else None
            })

        return jsonify({
            'success': True,
            'data': {
                'estudiante_id': estudiante.id,
                'estudiante_nombre': estudiante.nombre,
                'curso_id': estudiante.curso_id,
                'curso_nombre': estudiante.curso.nombre if estudiante.curso else None,
                'entregadas': count_entregadas,
                'pendientes': count_pendientes,
                'proximas_a_vencer': count_proximas,
                'vencidas': count_vencidas,
                'total': len(tareas),
                'detalle': detalle
            }
        }), 200

    except Exception as e:
        print(f"❌ Error en semaforo tareas estudiante: {e}")
        return jsonify({'success': False, 'message': f'Error al calcular semáforo de tareas: {str(e)}'}), 500

