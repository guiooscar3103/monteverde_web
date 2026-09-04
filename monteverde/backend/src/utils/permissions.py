"""
Sistema de Roles y Permisos Granulares (RBAC / PBAC) para MonteVerde
"""

# Catálogo centralizado de permisos asignados por defecto a cada rol
ROLE_PERMISSIONS = {
    'admin': {
        # Gestión técnica y estructural del sistema
        'usuario:crear',
        'usuario:editar',
        'usuario:eliminar',
        'usuario:consultar',
        'usuario:cambiar_estado',
        'usuario:reset_password',
        'institucion:configurar',
        'institucion:consultar',
        'auditoria:consultar',
        'circular:publicar',
        'circular:consultar',
        # Permisos administrativos y de compatibilidad
        'curso:crear',
        'curso:editar',
        'curso:eliminar',
        'curso:consultar',
        'materia:crear',
        'materia:editar',
        'materia:eliminar',
        'materia:consultar',
        'materia:asociar_curso',
        'docente:asignar',
        'docente:desasignar',
        'docente:consultar',
        'evaluacion:configurar',
        'evaluacion:consultar',
        'familia:vincular',
        'familia:desvincular',
        'familia:consultar',
    },
    'coordinador': {
        # Gestión académica, curricular y asignación de docentes
        'curso:crear',
        'curso:editar',
        'curso:eliminar',
        'curso:consultar',
        'materia:crear',
        'materia:editar',
        'materia:eliminar',
        'materia:consultar',
        'materia:asociar_curso',
        'docente:asignar',
        'docente:desasignar',
        'docente:consultar',
        'evaluacion:configurar',
        'evaluacion:consultar',
        'circular:publicar',
        'circular:consultar',
        'institucion:consultar',
        'estudiante:consultar',
        'calificacion:consultar',
        'asistencia:consultar',
        'observacion:consultar',
        'familia:consultar',
        'familia:vincular',
        'familia:desvincular',
    },
    'secretaria': {
        # Gestión de admisiones, matrículas y documentos
        'estudiante:crear',
        'estudiante:editar',
        'estudiante:consultar',
        'matricula:crear',
        'matricula:editar',
        'matricula:retirar',
        'matricula:consultar',
        'documento:emitir_certificado',
        'documento:consultar',
        'familia:consultar',
        'familia:vincular',
        'familia:desvincular',
        'circular:consultar',
        'institucion:consultar',
    },
    'docente': {
        # Gestión de clases, notas y observaciones
        'curso:consultar',
        'materia:consultar',
        'estudiante:consultar',
        'calificacion:registrar',
        'calificacion:editar',
        'calificacion:consultar',
        'asistencia:marcar',
        'asistencia:consultar',
        'observacion:crear',
        'observacion:consultar',
        'tarea:crear',
        'tarea:editar',
        'tarea:eliminar',
        'tarea:consultar',
        'mensaje:enviar',
        'circular:consultar',
        'institucion:consultar',
    },
    'familia': {
        # Consulta e interacción de estudiantes vinculados
        'estudiante:consultar_propio',
        'calificacion:consultar_propio',
        'asistencia:consultar_propio',
        'observacion:consultar_propio',
        'tarea:consultar_propio',
        'mensaje:enviar',
        'circular:consultar',
        'institucion:consultar',
    }
}

ROLES_SISTEMA = list(ROLE_PERMISSIONS.keys())

def has_permission(user, permission_slug):
    """
    Verifica si un usuario posee un permiso determinado según su rol activo.
    """
    if not user:
        return False
    if not getattr(user, 'activo', False) or getattr(user, 'eliminado', False):
        return False
    user_role = getattr(user, 'rol', None)
    if not user_role:
        return False
    permissions = ROLE_PERMISSIONS.get(user_role, set())
    return permission_slug in permissions
