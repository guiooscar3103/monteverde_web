from datetime import datetime, timezone
from sqlalchemy import or_
from src.extensions import db
from src.models.usuario import Usuario
from src.models.estudiante import Estudiante

from src.utils.permissions import ROLES_SISTEMA

class UsuarioService:
    @staticmethod
    def get_usuarios(page=1, limit=10, search=None, rol=None, activo=None, order_by='nombre', order_direction='ASC'):
        """Obtener usuarios paginados con filtros de búsqueda, rol y estado activo, excluyendo eliminados"""
        query = Usuario.query.filter(Usuario.eliminado == False)
        
        # Filtro por búsqueda textual (nombre o email)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(or_(
                Usuario.nombre.like(search_pattern),
                Usuario.email.like(search_pattern)
            ))
            
        # Filtro por rol
        if rol and rol in ROLES_SISTEMA:
            query = query.filter(Usuario.rol == rol)
            
        # Filtro por estado activo (1 o 0)
        if activo is not None:
            # Convertir a boolean
            is_active = str(activo).lower() in ['true', '1', 'yes']
            query = query.filter(Usuario.activo == is_active)
            
        # Ordenamiento
        order_col = getattr(Usuario, order_by, Usuario.nombre)
        if str(order_direction).upper() == 'DESC':
            query = query.order_by(order_col.desc())
        else:
            query = query.order_by(order_col.asc())
            
        # Paginación
        paginated_result = query.paginate(page=page, per_page=limit, error_out=False)
        
        return {
            'usuarios': [u.to_dict() for u in paginated_result.items],
            'total': paginated_result.total,
            'pagina': page,
            'total_paginas': paginated_result.pages
        }

    @staticmethod
    def get_usuario_por_id(usuario_id):
        """Obtener un usuario específico por ID"""
        user = Usuario.query.filter_by(id=usuario_id, eliminado=False).first()
        if not user:
            return None
        return user

    @staticmethod
    def crear_usuario(data):
        """Crear un nuevo usuario con contraseñas hasheadas"""
        nombre = data.get('nombre')
        email = data.get('email')
        password = data.get('password')
        rol = data.get('rol')
        estudiante_id = data.get('estudiante_id')
        activo = data.get('activo', True)
        
        if not all([nombre, email, password, rol]):
            return {'success': False, 'message': 'Faltan campos obligatorios (nombre, email, password, rol)'}, 400
            
        if rol not in ROLES_SISTEMA:
            return {'success': False, 'message': 'Rol inválido'}, 400
            
        # Verificar si el email ya existe
        existing = Usuario.query.filter_by(email=email).first()
        if existing:
            # Si existía pero estaba eliminado físicamente no se puede, pero si estaba soft deleted lo podemos reactivar o avisar
            if existing.eliminado:
                # Opcional: restaurarlo y actualizar datos. Por simplicidad, avisar que ya existe.
                return {'success': False, 'message': 'El correo electrónico pertenece a un usuario eliminado. Por favor utiliza otro.'}, 400
            return {'success': False, 'message': 'El correo electrónico ya está registrado'}, 400

        # Crear instancia
        usuario = Usuario(
            nombre=nombre,
            email=email,
            rol=rol,
            estudiante_id=estudiante_id if rol == 'familia' else None,
            activo=activo,
            eliminado=False
        )
        usuario.set_password(password)
        
        try:
            db.session.add(usuario)
            db.session.commit()
            return {'success': True, 'message': 'Usuario creado exitosamente', 'data': usuario.to_dict()}, 201
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'message': f'Error en base de datos: {str(e)}'}, 500

    @staticmethod
    def actualizar_usuario(usuario_id, data):
        """Actualizar campos de un usuario existente"""
        usuario = Usuario.query.filter_by(id=usuario_id, eliminado=False).first()
        if not usuario:
            return {'success': False, 'message': 'Usuario no encontrado'}, 404
            
        nombre = data.get('nombre')
        email = data.get('email')
        password = data.get('password')
        rol = data.get('rol')
        estudiante_id = data.get('estudiante_id')
        activo = data.get('activo')
        
        if nombre:
            usuario.nombre = nombre
            
        if email and email != usuario.email:
            # Verificar disponibilidad del nuevo email
            existing = Usuario.query.filter_by(email=email).first()
            if existing and existing.id != usuario_id:
                return {'success': False, 'message': 'El correo electrónico ya está registrado por otro usuario'}, 400
            usuario.email = email
            
        if rol and rol in ROLES_SISTEMA:
            usuario.rol = rol
            
        if 'estudiante_id' in data:
            usuario.estudiante_id = estudiante_id if usuario.rol == 'familia' else None
            
        if activo is not None:
            usuario.activo = bool(activo)
            
        if password:
            usuario.set_password(password)
            
        try:
            db.session.commit()
            return {'success': True, 'message': 'Usuario actualizado exitosamente', 'data': usuario.to_dict()}, 200
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'message': f'Error al actualizar: {str(e)}'}, 500

    @staticmethod
    def soft_delete_usuario(usuario_id):
        """Marcar un usuario como eliminado lógicamente (soft delete)"""
        usuario = Usuario.query.filter_by(id=usuario_id, eliminado=False).first()
        if not usuario:
            return {'success': False, 'message': 'Usuario no encontrado'}, 404
            
        usuario.eliminado = True
        usuario.fecha_eliminacion = datetime.now(timezone.utc)
        
        try:
            db.session.commit()
            return {'success': True, 'message': 'Usuario eliminado exitosamente (soft delete)'}, 200
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'message': f'Error al eliminar: {str(e)}'}, 500

    @staticmethod
    def restaurar_usuario(usuario_id):
        """Restaurar un usuario que fue eliminado lógicamente"""
        usuario = Usuario.query.filter_by(id=usuario_id, eliminado=True).first()
        if not usuario:
            return {'success': False, 'message': 'Usuario eliminado no encontrado'}, 404
            
        usuario.eliminado = False
        usuario.fecha_eliminacion = None
        
        try:
            db.session.commit()
            return {'success': True, 'message': 'Usuario restaurado exitosamente', 'data': usuario.to_dict()}, 200
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'message': f'Error al restaurar: {str(e)}'}, 500

    @staticmethod
    def cambiar_estado(usuario_id, activo):
        """Activar o desactivar cuenta de usuario"""
        return UsuarioService.actualizar_usuario(usuario_id, {'activo': activo})

    @staticmethod
    def restablecer_password(usuario_id, nueva_password):
        """Restablecer contraseña del usuario"""
        if not nueva_password:
            return {'success': False, 'message': 'Nueva contraseña requerida'}, 400
        return UsuarioService.actualizar_usuario(usuario_id, {'password': nueva_password})
