from flask import Blueprint, request, jsonify
from datetime import datetime
from flask_jwt_extended import jwt_required
from sqlalchemy.orm import selectinload, joinedload
from src.extensions import db
from src.models.mensaje import Mensaje
from src.models.usuario import Usuario, familia_estudiante
from src.models.estudiante import Estudiante
from src.models.docente_asignacion import DocenteAsignacion
from src.models.conversacion_archivada import ConversacionArchivada
from src.utils.auth_helpers import role_required, get_current_user


mensajes_bp = Blueprint('mensajes_custom', __name__)

@mensajes_bp.route('/mensajes/contactos-docente', methods=['GET'])
@role_required('docente')
def get_contactos_docente():
    """
    Obtiene los contactos de familias correspondientes a los estudiantes
    de los cursos asignados al docente autenticado.
    
    Acepta opcionalmente ?curso_id=X para filtrar por un curso específico.
    Si el docente intenta consultar un curso que no tiene asignado, devuelve 403.
    """
    try:
        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no autenticado'}), 401

        # Cursos asignados al docente autenticado
        asignaciones = DocenteAsignacion.query.filter_by(docente_id=docente.id).all()
        cursos_asignados_ids = list({a.curso_id for a in asignaciones})

        curso_id_param = request.args.get('curso_id', type=int)

        if curso_id_param:
            if curso_id_param not in cursos_asignados_ids:
                return jsonify({
                    'success': False, 
                    'message': 'No tienes asignado este curso'
                }), 403
            target_curso_ids = [curso_id_param]
        else:
            target_curso_ids = cursos_asignados_ids

        if not target_curso_ids:
            return jsonify({'success': True, 'data': []}), 200

        # Subconsultas para encontrar los IDs de familias vinculadas a estudiantes en los cursos objetivo
        family_ids_m2m = db.session.query(familia_estudiante.c.familia_id)\
            .join(Estudiante, Estudiante.id == familia_estudiante.c.estudiante_id)\
            .filter(Estudiante.curso_id.in_(target_curso_ids))

        family_ids_legacy = db.session.query(Usuario.id)\
            .join(Estudiante, Estudiante.id == Usuario.estudiante_id)\
            .filter(Usuario.rol == 'familia', Estudiante.curso_id.in_(target_curso_ids))

        family_ids_union = family_ids_m2m.union(family_ids_legacy)

        # Consulta optimizada evitando N+1 usando selectinload y joinedload
        familias = Usuario.query.filter(
            Usuario.id.in_(family_ids_union),
            Usuario.rol == 'familia',
            Usuario.activo == True,
            Usuario.eliminado == False
        ).options(
            selectinload(Usuario.estudiantes).joinedload(Estudiante.curso),
            joinedload(Usuario.estudiante).joinedload(Estudiante.curso)
        ).order_by(Usuario.nombre.asc()).all()

        contactos = []
        for fam in familias:
            estudiantes_map = {}
            
            # 1. Relación Many-to-Many
            for est in fam.estudiantes:
                if est.curso_id in target_curso_ids:
                    curso_grado = f"{est.curso.nivel}{est.curso.letra}" if est.curso and est.curso.nivel and est.curso.letra else (est.curso.nombre if est.curso else None)
                    estudiantes_map[est.id] = {
                        'id': est.id,
                        'nombre': est.nombre,
                        'curso_id': est.curso_id,
                        'curso_nombre': est.curso.nombre if est.curso else None,
                        'curso_grado': curso_grado
                    }

            # 2. Relación Legacy Fallback
            if fam.estudiante and fam.estudiante.curso_id in target_curso_ids:
                est = fam.estudiante
                if est.id not in estudiantes_map:
                    curso_grado = f"{est.curso.nivel}{est.curso.letra}" if est.curso and est.curso.nivel and est.curso.letra else (est.curso.nombre if est.curso else None)
                    estudiantes_map[est.id] = {
                        'id': est.id,
                        'nombre': est.nombre,
                        'curso_id': est.curso_id,
                        'curso_nombre': est.curso.nombre if est.curso else None,
                        'curso_grado': curso_grado
                    }

            if estudiantes_map:
                contactos.append({
                    'id': fam.id,
                    'familia_id': fam.id,
                    'nombre': fam.nombre,
                    'email': fam.email,
                    'rol': fam.rol,
                    'estudiantes': list(estudiantes_map.values())
                })

        return jsonify({'success': True, 'data': contactos}), 200

    except Exception as e:
        print(f"❌ Error get_contactos_docente: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@mensajes_bp.route('/mensajes/<int:usuario_id>', methods=['GET'])
@jwt_required()
def get_mensajes(usuario_id):
    """Obtener mensajes usando SQLAlchemy ORM."""
    try:
        print(f"🔍 Obteniendo mensajes para usuario: {usuario_id}")
        
        mensajes = Mensaje.query.filter(
            (Mensaje.receptor_id == usuario_id) | (Mensaje.emisor_id == usuario_id)
        ).order_by(Mensaje.fecha.desc()).all()
        
        print(f"📧 Mensajes encontrados: {len(mensajes)}")
 
        mensajes_data = []
        for msg in mensajes:
            msg_dict = msg.to_dict()
            emisor = Usuario.query.get(msg.emisor_id)
            receptor = Usuario.query.get(msg.receptor_id)
            msg_dict['emisor_nombre'] = emisor.nombre if emisor else None
            msg_dict['receptor_nombre'] = receptor.nombre if receptor else None
            mensajes_data.append(msg_dict)
 
        return jsonify({'success': True, 'data': mensajes_data})
    except Exception as e:
        print(f"❌ Error get_mensajes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@mensajes_bp.route('/conversacion/<int:usuario1>/<int:usuario2>', methods=['GET'])
@jwt_required()
def get_conversacion_entre_usuarios(usuario1, usuario2):
    """Conversación entre dos usuarios."""
    try:
        mensajes = Mensaje.query.filter(
            ((Mensaje.emisor_id == usuario1) & (Mensaje.receptor_id == usuario2)) |
            ((Mensaje.emisor_id == usuario2) & (Mensaje.receptor_id == usuario1))
        ).order_by(Mensaje.fecha.asc()).all()
        
        mensajes_data = []
        for msg in mensajes:
            msg_dict = msg.to_dict()
            emisor = Usuario.query.get(msg.emisor_id)
            receptor = Usuario.query.get(msg.receptor_id)
            msg_dict['emisor_nombre'] = emisor.nombre if emisor else None
            msg_dict['receptor_nombre'] = receptor.nombre if receptor else None
            mensajes_data.append(msg_dict)
            
        return jsonify({'success': True, 'data': mensajes_data})
    except Exception as e:
        print(f"❌ Error conversación: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@mensajes_bp.route('/mensajes/enviar', methods=['POST'])
@jwt_required()
def enviar_mensaje_nuevo():
    """Enviar nuevo mensaje."""
    try:
        current_user = get_current_user()
        data = request.get_json() or {}
        emisor_id = current_user.id if current_user else data.get('emisorId')
        receptor_id = data.get('receptorId') or data.get('receptor_id')
        asunto = data.get('asunto', 'Sin asunto')
        cuerpo = data.get('cuerpo')
        
        if not all([emisor_id, receptor_id, cuerpo]):
            return jsonify({'success': False, 'message': 'Faltan campos requeridos'}), 400
            
        mensaje = Mensaje(
            emisor_id=emisor_id,
            receptor_id=receptor_id,
            asunto=asunto,
            cuerpo=cuerpo,
            fecha=datetime.now(),
            leido=False
        )
        
        db.session.add(mensaje)

        # Desarchivado automático: Si el receptor tenía archivada la conversación con el emisor, se elimina el archivado
        ConversacionArchivada.query.filter_by(
            usuario_id=receptor_id,
            contacto_id=emisor_id
        ).delete(synchronize_session=False)

        db.session.commit()
        
        print(f"✅ Mensaje creado con ID: {mensaje.id}")
        return jsonify({'success': True, 'data': mensaje.to_dict()})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error enviar mensaje: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@mensajes_bp.route('/mensajes/enviar-curso', methods=['POST'])
@role_required('docente')
def enviar_mensaje_curso():
    """
    Envía una difusión masiva a todos los acudientes de un curso.
    - Valida que el docente tenga asignado el curso (403 si no).
    - Obtiene destinatarios únicos (DISTINCT familia_id) para no duplicar a familias con varios hijos.
    - Ejecuta el envío en una única transacción atómica con rollback en caso de error.
    - Desarchiva automáticamente la conversación para cada receptor individual.
    """
    try:
        docente = get_current_user()
        if not docente:
            return jsonify({'success': False, 'message': 'Docente no autenticado'}), 401

        data = request.get_json() or {}
        curso_id = data.get('curso_id') or data.get('cursoId')
        asunto = (data.get('asunto') or 'Circular de curso').strip()
        cuerpo = (data.get('cuerpo') or '').strip()

        if not curso_id or not cuerpo:
            return jsonify({'success': False, 'message': 'Faltan campos requeridos: curso_id y cuerpo'}), 400

        # Validar que el docente tenga asignado el curso
        asignado = DocenteAsignacion.query.filter_by(docente_id=docente.id, curso_id=curso_id).first()
        if not asignado:
            return jsonify({'success': False, 'message': 'No tienes asignado este curso'}), 403

        # Obtener IDs únicos de familias vinculadas a estudiantes del curso
        m2m_fam_ids = db.session.query(familia_estudiante.c.familia_id)\
            .join(Estudiante, Estudiante.id == familia_estudiante.c.estudiante_id)\
            .join(Usuario, Usuario.id == familia_estudiante.c.familia_id)\
            .filter(
                Estudiante.curso_id == curso_id,
                Usuario.rol == 'familia',
                Usuario.activo == True,
                Usuario.eliminado == False
            )

        legacy_fam_ids = db.session.query(Usuario.id)\
            .join(Estudiante, Estudiante.id == Usuario.estudiante_id)\
            .filter(
                Estudiante.curso_id == curso_id,
                Usuario.rol == 'familia',
                Usuario.activo == True,
                Usuario.eliminado == False
            )

        destinatarios_ids = [row[0] for row in m2m_fam_ids.union(legacy_fam_ids).all()]

        if not destinatarios_ids:
            return jsonify({
                'success': False,
                'message': 'No hay acudientes asociados a los estudiantes de este curso.',
                'destinatarios_count': 0
            }), 400

        # Transacción atómica de creación de mensajes individuales
        mensajes_creados = []
        fecha_envio = datetime.now()
        for fid in destinatarios_ids:
            msg = Mensaje(
                emisor_id=docente.id,
                receptor_id=fid,
                asunto=asunto,
                cuerpo=cuerpo,
                fecha=fecha_envio,
                leido=False
            )
            db.session.add(msg)
            mensajes_creados.append(msg)

        # Desarchivado automático individual para cada receptor del curso
        ConversacionArchivada.query.filter(
            ConversacionArchivada.usuario_id.in_(destinatarios_ids),
            ConversacionArchivada.contacto_id == docente.id
        ).delete(synchronize_session=False)

        db.session.commit()

        count = len(mensajes_creados)
        return jsonify({
            'success': True,
            'message': f'Difusión enviada correctamente a {count} acudiente{"s" if count != 1 else ""}.',
            'destinatarios_count': count
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"❌ Error enviar difusión a curso: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@mensajes_bp.route('/mensajes/marcar-leido/<int:mensaje_id>', methods=['PUT'])
@jwt_required()
def marcar_mensaje_como_leido(mensaje_id):
    """Marcar mensaje como leído."""
    try:
        mensaje = Mensaje.query.get(mensaje_id)
        if not mensaje:
            return jsonify({'success': False, 'message': 'Mensaje no encontrado'}), 404
            
        mensaje.leido = True
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Mensaje marcado como leído'})
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Error marcar leído: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@mensajes_bp.route('/mensajes/<int:mensaje_id>', methods=['DELETE'])
@jwt_required()
def retractar_mensaje(mensaje_id):
    """
    Retracta / elimina lógicamente un mensaje.
    Autorización estricta en backend:
    - Solo el emisor original o un usuario con rol 'admin' puede retractarlo.
    - El receptor u otros usuarios NO pueden retractar mensajes ajenos (403 Forbidden).
    - Si el mensaje no existe: 404 Not Found.
    - Si el mensaje ya estaba retractado: respuesta idempotente 200 OK.
    - No realiza eliminación física (db.session.delete), preservando la trazabilidad.
    """
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'message': 'Usuario no autenticado'}), 401

        mensaje = Mensaje.query.get(mensaje_id)
        if not mensaje:
            return jsonify({'success': False, 'message': 'Mensaje no encontrado'}), 404

        # Autorización estricta: Solo el emisor original o un administrador
        if mensaje.emisor_id != current_user.id and current_user.rol != 'admin':
            return jsonify({
                'success': False,
                'message': 'No tienes permisos para eliminar este mensaje'
            }), 403

        # Manejo idempotente si ya fue retractado previamente
        if mensaje.eliminado:
            return jsonify({
                'success': True,
                'message': 'El mensaje ya había sido retractado',
                'data': mensaje.to_dict()
            }), 200

        # Eliminación lógica
        mensaje.eliminado = True
        mensaje.fecha_eliminacion = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Mensaje retractado exitosamente',
            'data': mensaje.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Error al retractar mensaje: {e}")
        return jsonify({'success': False, 'message': 'No fue posible retractar el mensaje. Inténtalo nuevamente.'}), 500


# =====================================================
# ENDPOINTS DE ARCHIVADO DE CONVERSACIONES
# =====================================================

@mensajes_bp.route('/mensajes/conversaciones/<int:contacto_id>/archivar', methods=['POST'])
@jwt_required()
def archivar_conversacion(contacto_id):
    """
    Archiva una conversación para el usuario autenticado de forma unidireccional.
    - Idempotente.
    - Valida que el contacto exista.
    - No permite auto-archivado (contacto_id == current_user.id).
    """
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'message': 'Usuario no autenticado'}), 401

        if current_user.id == contacto_id:
            return jsonify({'success': False, 'message': 'No puedes archivar una conversación contigo mismo'}), 400

        contacto = Usuario.query.get(contacto_id)
        if not contacto or contacto.eliminado:
            return jsonify({'success': False, 'message': 'Contacto no encontrado'}), 404

        # Buscar si ya existe
        existente = ConversacionArchivada.query.filter_by(
            usuario_id=current_user.id,
            contacto_id=contacto_id
        ).first()

        if not existente:
            nueva_archivada = ConversacionArchivada(
                usuario_id=current_user.id,
                contacto_id=contacto_id,
                fecha_archivado=datetime.utcnow()
            )
            db.session.add(nueva_archivada)
            db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Conversación archivada exitosamente'
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Error al archivar conversación: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@mensajes_bp.route('/mensajes/conversaciones/<int:contacto_id>/desarchivar', methods=['POST'])
@jwt_required()
def desarchivar_conversacion(contacto_id):
    """
    Desarchiva una conversación para el usuario autenticado.
    - Idempotente (no falla si no estaba archivada).
    """
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'message': 'Usuario no autenticado'}), 401

        existente = ConversacionArchivada.query.filter_by(
            usuario_id=current_user.id,
            contacto_id=contacto_id
        ).first()

        if existente:
            db.session.delete(existente)
            db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Conversación desarchivada exitosamente'
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Error al desarchivar conversación: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@mensajes_bp.route('/mensajes/conversaciones/archivadas', methods=['GET'])
@jwt_required()
def get_conversaciones_archivadas():
    """
    Retorna la lista de conversaciones archivadas por el usuario autenticado.
    """
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'message': 'Usuario no autenticado'}), 401

        archivadas = ConversacionArchivada.query.filter_by(
            usuario_id=current_user.id
        ).order_by(ConversacionArchivada.fecha_archivado.desc()).all()

        return jsonify({
            'success': True,
            'conversaciones': [
                {
                    'contacto_id': item.contacto_id,
                    'fecha_archivado': item.fecha_archivado.isoformat() if item.fecha_archivado else None
                }
                for item in archivadas
            ]
        }), 200

    except Exception as e:
        print(f"[ERROR] Error al obtener conversaciones archivadas: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@mensajes_bp.route('/mensajes/conversaciones', methods=['GET'])
@jwt_required()
def get_conversaciones_filtradas():
    """
    Obtiene la lista de conversaciones del usuario autenticado, agrupadas por contacto,
    con soporte para el filtro de estado (?estado=activas | archivadas | todas).
    Ordenadas por la fecha del último mensaje.
    """
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'message': 'Usuario no autenticado'}), 401

        estado = request.args.get('estado', 'activas').lower()

        # Obtener todos los IDs de contactos archivados por el usuario
        archivadas = ConversacionArchivada.query.filter_by(usuario_id=current_user.id).all()
        archivadas_dict = {a.contacto_id: a.fecha_archivado for a in archivadas}

        # Obtener todos los mensajes donde participa el usuario
        mensajes = Mensaje.query.filter(
            (Mensaje.receptor_id == current_user.id) | (Mensaje.emisor_id == current_user.id)
        ).order_by(Mensaje.fecha.asc()).all()

        # Agrupar mensajes por contacto
        conversaciones_map = {}
        for msg in mensajes:
            contacto_id = msg.emisor_id if msg.receptor_id == current_user.id else msg.receptor_id
            if contacto_id not in conversaciones_map:
                conversaciones_map[contacto_id] = {
                    'contacto_id': contacto_id,
                    'ultimo_mensaje': msg,
                    'no_leidos': 0
                }
            if msg.receptor_id == current_user.id and not msg.leido:
                conversaciones_map[contacto_id]['no_leidos'] += 1
            if msg.fecha:
                if not conversaciones_map[contacto_id]['ultimo_mensaje'].fecha or msg.fecha > conversaciones_map[contacto_id]['ultimo_mensaje'].fecha:
                    conversaciones_map[contacto_id]['ultimo_mensaje'] = msg

        # Enriquecer con información del contacto y estado archivado
        resultado = []
        for contacto_id, data in conversaciones_map.items():
            contacto = Usuario.query.get(contacto_id)
            if not contacto or contacto.eliminado:
                continue

            es_archivado = contacto_id in archivadas_dict
            fecha_arch = archivadas_dict.get(contacto_id)

            # Aplicar filtro de estado
            if estado == 'activas' and es_archivado:
                continue
            elif estado == 'archivadas' and not es_archivado:
                continue

            resultado.append({
                'contacto_id': contacto_id,
                'contacto': {
                    'id': contacto.id,
                    'nombre': contacto.nombre,
                    'email': contacto.email,
                    'rol': contacto.rol
                },
                'ultimo_mensaje': data['ultimo_mensaje'].to_dict(),
                'no_leidos': data['no_leidos'],
                'archivado': es_archivado,
                'fecha_archivado': fecha_arch.isoformat() if fecha_arch else None
            })

        # Ordenar por fecha del último mensaje descendente
        resultado.sort(
            key=lambda c: c['ultimo_mensaje']['fecha'] or '',
            reverse=True
        )

        return jsonify({'success': True, 'data': resultado, 'conversaciones': resultado}), 200

    except Exception as e:
        print(f"[ERROR] Error al obtener conversaciones: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500




