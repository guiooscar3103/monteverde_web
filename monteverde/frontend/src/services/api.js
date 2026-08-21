// ============================================
// CONFIGURACIÓN BÁSICA Y HELPERS
// ============================================

const API_BASE_URL = 'http://localhost:5000/api';

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.message || data.msg || data.error || '';
      if (response.status === 401 || response.status === 422) {
        if (
          errorMsg.includes('claim') ||
          errorMsg.includes('Signature') ||
          errorMsg.includes('Token has expired') ||
          errorMsg.includes('Invalid token') ||
          errorMsg.includes('segments') ||
          errorMsg.includes('Invalid header')
        ) {
          console.warn('⚠️ Token JWT inválido, corrupto o expirado detectado:', errorMsg);
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          localStorage.removeItem('user');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }
      throw new Error(errorMsg || 'Error en la petición');
    }
    
    if (data.success) {
      if (Object.hasOwn(data, 'data')) {
        return data.data;
      }
      return data;
    }
    
    return data;
  } catch (error) {
    console.error('Error en API request:', error);
    throw error;
  }
};

// =====================================================
// AUTENTICACIÓN
// =====================================================

export const login = async (credentials) => {
  console.log('🌐 API: Iniciando sesión...');
  return await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

// =====================================================
// USUARIOS
// =====================================================

export const getUsuariosPorRol = async (rol) => {
  console.log('🌐 API: Obteniendo usuarios por rol:', rol);
  if (rol === 'familia') return await apiRequest('/usuarios/familia');
  if (rol === 'docente') return await apiRequest('/usuarios/docentes');
  return await apiRequest(`/usuarios/por-rol/${rol}`);
};

export const getUsuarioPorId = async (usuarioId) => {
  console.log('🌐 API: Obteniendo usuario por ID:', usuarioId);
  return await apiRequest(`/usuario/${usuarioId}`);
};

export const getUsuarios = async () => {
  console.log('🌐 API: Obteniendo todos los usuarios...');
  return await apiRequest('/usuarios');
};

export const crearUsuario = async (usuario) => {
  console.log('🌐 API: Creando usuario:', usuario);
  return await apiRequest('/usuarios', {
    method: 'POST',
    body: JSON.stringify(usuario),
  });
};

export const actualizarUsuario = async (usuarioId, datos) => {
  console.log('🌐 API: Actualizando usuario:', usuarioId);
  return await apiRequest(`/usuarios/${usuarioId}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
};

export const eliminarUsuario = async (usuarioId) => {
  console.log('🌐 API: Eliminando usuario:', usuarioId);
  return await apiRequest(`/usuarios/${usuarioId}`, {
    method: 'DELETE',
  });
};

// =====================================================
// CURSOS
// =====================================================

export const getCursos = async () => {
  console.log('🌐 API: Obteniendo cursos...');
  return await apiRequest('/cursos/');
};

export const createCurso = async (curso) => {
  console.log('🌐 API: Creando curso:', curso);
  return await apiRequest('/cursos/', {
    method: 'POST',
    body: JSON.stringify(curso)
  });
};

export const updateCurso = async (cursoId, curso) => {
  console.log('🌐 API: Actualizando curso:', cursoId, curso);
  return await apiRequest(`/cursos/${cursoId}`, {
    method: 'PUT',
    body: JSON.stringify(curso)
  });
};

export const deleteCurso = async (cursoId) => {
  console.log('🌐 API: Eliminando curso:', cursoId);
  return await apiRequest(`/cursos/${cursoId}`, {
    method: 'DELETE'
  });
};

export const getEstudiantesPorCurso = async (cursoId) => {
  console.log('🌐 API: Obteniendo estudiantes del curso:', cursoId);
  return await apiRequest(`/estudiantes/por-curso/${cursoId}`);
};

// =====================================================
// DASHBOARD - EXACTAMENTE COMO LOS USAS
// =====================================================

export const getFamiliaDashboard = async (familiaId) => {
  console.log('🌐 API: Obteniendo dashboard familiar para:', familiaId);
  return await apiRequest(`/familia/dashboard/${familiaId}`);
};

export const getDocenteDashboard = async () => {
  console.log('🌐 API: Obteniendo dashboard docente...');
  return await apiRequest(`/docente/dashboard`);
};

// =====================================================
// MENSAJES - AMBAS VERSIONES PARA COMPATIBILIDAD
// =====================================================

export const getMensajesPorUsuario = async (usuarioId) => {
  console.log('🌐 API: Obteniendo mensajes para usuario:', usuarioId);
  return await apiRequest(`/mensajes/${usuarioId}`);
};

export const getMensajes = async (usuarioId) => {
  console.log('🌐 API: Obteniendo mensajes (alias):', usuarioId);
  return await apiRequest(`/mensajes/${usuarioId}`);
};

export const getConversacion = async (usuario1Id, usuario2Id) => {
  console.log('🌐 API: Obteniendo conversación entre:', usuario1Id, 'y', usuario2Id);
  return await apiRequest(`/conversacion/${usuario1Id}/${usuario2Id}`);
};

export const enviarMensaje = async (mensaje) => {
  console.log('🌐 API: Enviando mensaje:', mensaje);
  return await apiRequest('/mensajes/enviar', {
    method: 'POST',
    body: JSON.stringify(mensaje),
  });
};

export const marcarComoLeido = async (mensajeId) => {
  console.log('🌐 API: Marcando mensaje como leído:', mensajeId);
  return await apiRequest(`/mensajes/marcar-leido/${mensajeId}`, {
    method: 'PUT',
  });
};

export const getContactosDocente = async (cursoId = null) => {
  console.log('🌐 API: Obteniendo contactos docentes para curso:', cursoId);
  const query = cursoId ? `?curso_id=${cursoId}` : '';
  return await apiRequest(`/mensajes/contactos-docente${query}`);
};

export const enviarMensajeCurso = async ({ cursoId, asunto, cuerpo }) => {
  console.log('🌐 API: Enviando difusión masiva al curso:', cursoId);
  return await apiRequest('/mensajes/enviar-curso', {
    method: 'POST',
    body: JSON.stringify({
      curso_id: cursoId,
      asunto,
      cuerpo,
    }),
  });
};

export const eliminarMensaje = async (mensajeId) => {
  console.log('🌐 API: Retractando mensaje:', mensajeId);
  return await apiRequest(`/mensajes/${mensajeId}`, {
    method: 'DELETE',
  });
};

export const retractarMensaje = eliminarMensaje;

// =====================================================
// CALIFICACIONES
// =====================================================

export const buscarCalificaciones = async (params) => {
  const queryParams = new URLSearchParams();
  if (params.cursoId) queryParams.append('cursoId', params.cursoId);
  if (params.asignatura) queryParams.append('asignatura', params.asignatura);
  if (params.periodo) queryParams.append('periodo', params.periodo);
  
  console.log('🌐 API: Buscando calificaciones con:', params);
  return await apiRequest(`/calificaciones/buscar?${queryParams}`);
};

export const guardarCalificaciones = async (calificaciones) => {
  console.log('🌐 API: Guardando calificaciones:', calificaciones);
  return await apiRequest('/calificaciones/guardar', {
    method: 'POST',
    body: JSON.stringify({ calificaciones }),
  });
};

export const getCalificacionesHijo = async (estudianteId) => {
  console.log('🌐 API: Obteniendo calificaciones del hijo:', estudianteId);
  return await apiRequest(`/familia/hijo-calificaciones/${estudianteId}`);
};

// =====================================================
// ASISTENCIA
// =====================================================

export const getAsistenciaPorFecha = async (params) => {
  const queryParams = new URLSearchParams();
  if (params.cursoId) queryParams.append('cursoId', params.cursoId);
  if (params.fecha) queryParams.append('fecha', params.fecha);
  
  console.log('🌐 API: Obteniendo asistencia con:', params);
  return await apiRequest(`/asistencia/por-fecha?${queryParams}`);
};

export const guardarAsistencia = async (marcas) => {
  console.log('🌐 API: Guardando asistencia:', marcas);
  return await apiRequest('/asistencia/guardar', {
    method: 'POST',
    body: JSON.stringify({ marcas }),
  });
};

export const getEstadisticasAsistencia = async (params) => {
  const queryParams = new URLSearchParams();
  if (params.cursoId) queryParams.append('cursoId', params.cursoId);
  if (params.fecha) queryParams.append('fecha', params.fecha);
  
  console.log('🌐 API: Obteniendo estadísticas asistencia:', params);
  return await apiRequest(`/asistencia/estadisticas?${queryParams}`);
};

export const getAsistenciaHijo = async (estudianteId) => {
  console.log('🌐 API: Obteniendo asistencia del hijo:', estudianteId);
  return await apiRequest(`/familia/hijo-asistencia/${estudianteId}`);
};

// =====================================================
// OBSERVACIONES - COMPLETAMENTE FUNCIONALES
// =====================================================

export const getObservadorPorCurso = async (cursoId) => {
  console.log('🌐 API: Obteniendo observaciones para curso:', cursoId);
  return await apiRequest(`/observaciones/por-curso/${cursoId}`);
};

export const agregarAnotacion = async (observacion) => {
  console.log('🌐 API: Enviando observación:', observacion);
  return await apiRequest('/observaciones/agregar', {
    method: 'POST',
    body: JSON.stringify(observacion),
  });
};

export const eliminarObservacion = async (observacionId) => {
  console.log('🌐 API: Eliminando observación:', observacionId);
  return await apiRequest(`/observaciones/${observacionId}`, {
    method: 'DELETE',
  });
};

export const getObservacionesHijo = async (estudianteId) => {
  console.log('🌐 API: Obteniendo observaciones del hijo:', estudianteId);
  return await apiRequest(`/familia/hijo-observaciones/${estudianteId}`);
};

export const getEstadisticasObservaciones = async (cursoId) => {
  console.log('🌐 API: Obteniendo estadísticas observaciones para curso:', cursoId);
  // Función placeholder - puedes implementarla después en el backend
  return { 
    estadisticas: { 
      total: 0, 
      positivas: 0, 
      neutrales: 0, 
      negativas: 0 
    } 
  };
};

// =====================================================
// REPORTES ACADÉMICOS
// =====================================================

export const getReporteAcademico = async (estudianteId) => {
  console.log('🌐 API: Obteniendo reporte académico para:', estudianteId);
  return await apiRequest(`/familia/hijo-calificaciones/${estudianteId}`);
};

// =====================================================
// FUNCIONES DE ADMIN
// =====================================================

export const getEstadisticasGenerales = async () => {
  console.log('🌐 API: Obteniendo estadísticas generales...');
  return await apiRequest('/admin/estadisticas');
};

export const getConfiguracion = async () => {
  console.log('🌐 API: Obteniendo configuración...');
  return await apiRequest('/admin/configuracion');
};

export const guardarConfiguracion = async (config) => {
  console.log('🌐 API: Guardando configuración...', config);
  return await apiRequest('/admin/configuracion', {
    method: 'POST',
    body: JSON.stringify(config),
  });
};

// =====================================================
// UTILIDADES Y SALUD DEL SISTEMA
// =====================================================

export const testConexion = async () => {
  console.log('🌐 API: Probando conexión...');
  return await apiRequest('/test-db');
};

export const healthCheck = async () => {
  console.log('🌐 API: Verificando salud del sistema...');
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return await response.json();
  } catch (error) {
    console.error('Error en health check:', error);
    return { status: 'ERROR', message: error.message };
  }
};

export const ping = async () => {
  console.log('🌐 API: Ping al servidor...');
  return await fetch(`${API_BASE_URL.replace('/api', '')}/health`)
    .then(r => r.ok)
    .catch(() => false);
};

// =====================================================
// FUNCIONES UTILITARIAS PARA FECHAS Y FORMATOS
// =====================================================

export const formatearFecha = (fecha) => {
  if (!fecha) return '';
  const date = new Date(fecha);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatearFechaHora = (fecha) => {
  if (!fecha) return '';
  const date = new Date(fecha);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const obtenerFechaHoy = () => {
  return new Date().toISOString().split('T')[0];
};

// =====================================================
// FUNCIONES DE MANEJO DE ERRORES
// =====================================================

export const manejarErrorApi = (error) => {
  console.error('Error en API:', error);
  
  if (error.message.includes('Failed to fetch')) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión.';
  }
  
  if (error.message.includes('404')) {
    return 'El recurso solicitado no fue encontrado.';
  }
  
  if (error.message.includes('401')) {
    return 'No tienes permisos para acceder a este recurso.';
  }
  
  if (error.message.includes('500')) {
    return 'Error interno del servidor. Intenta más tarde.';
  }
  
  return error.message || 'Error desconocido en la API';
};

// =====================================================
// FUNCIONES PARA MANEJO DE TOKENS
// =====================================================

export const guardarToken = (token) => {
  localStorage.setItem('token', token);
};

export const obtenerToken = () => {
  return localStorage.getItem('token');
};

export const eliminarToken = () => {
  localStorage.removeItem('token');
};

export const verificarToken = async () => {
  const token = obtenerToken();
  if (!token) return null;
  
  try {
    const res = await apiRequest('/auth/verify');
    if (res && res.success && res.user) {
      return res.user;
    }
    return null;
  } catch (error) {
    console.error('Error al verificar token:', error);
    eliminarToken();
    return null;
  }
};

// =====================================================
// FUNCIONES PARA CIRCULARES
// =====================================================

export const getCirculares = async (limit = null) => {
  const query = limit ? `?limit=${limit}` : '';
  return apiRequest(`/circulares${query}`);
};

export const getCircular = async (id) => {
  return apiRequest(`/circulares/${id}`);
};

export const crearCircular = async (payload) => {
  return apiRequest('/circulares', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const actualizarCircular = async (id, payload) => {
  return apiRequest(`/circulares/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const eliminarCircular = async (id) => {
  return apiRequest(`/circulares/${id}`, {
    method: 'DELETE'
  });
};


// =====================================================
// ✅ TODOS LOS ALIAS PARA COMPATIBILIDAD TOTAL
// =====================================================

// Para RegistroCalificaciones.jsx
export const getCalificacionesPor = buscarCalificaciones;

// Para dashboards (nombres alternativos)
export const getDashboardFamilia = getFamiliaDashboard;
export const getDashboardDocente = getDocenteDashboard;

// Para usuarios (nombres alternativos)
export const getUsuariosFamilia = () => getUsuariosPorRol('familia');
export const getUsuariosDocentes = () => getUsuariosPorRol('docente');

// Para reportes
export const getCalificacionesEstudiante = getCalificacionesHijo;
export const getAsistenciaEstudiante = getAsistenciaHijo;
export const getObservacionesEstudiante = getObservacionesHijo;

// Para cursos (nombres alternativos)
export const obtenerCursos = getCursos;
export const obtenerEstudiantes = getEstudiantesPorCurso;

// Para observaciones (nombres alternativos)
export const enviarObservacion = agregarAnotacion;
export const crearObservacion = agregarAnotacion;
export const obtenerObservaciones = getObservadorPorCurso;
export const borrarObservacion = eliminarObservacion;

// Para asistencia (nombres alternativos)
export const obtenerAsistencia = getAsistenciaPorFecha;
export const registrarAsistencia = guardarAsistencia;

// Para mensajes (nombres alternativos)
export const obtenerMensajes = getMensajesPorUsuario;
export const crearMensaje = enviarMensaje;

// Para calificaciones (nombres alternativos)
export const obtenerCalificaciones = buscarCalificaciones;
export const registrarCalificaciones = guardarCalificaciones;

// Funciones que podrían estar en otros archivos
export const getEstudiantePorId = async (estudianteId) => {
  console.log('🌐 API: Obteniendo estudiante por ID:', estudianteId);
  return await apiRequest(`/estudiantes/${estudianteId}`);
};

export const getCursoPorId = async (cursoId) => {
  console.log('🌐 API: Obteniendo curso por ID:', cursoId);
  return await apiRequest(`/cursos/${cursoId}`);
};

// Para debugging y desarrollo
export { API_BASE_URL };

// Función catch-all para cualquier export que pueda faltar
export const funcionGenerica = async (endpoint, options = {}) => {
  console.log('🌐 API: Función genérica para:', endpoint);
  return await apiRequest(endpoint, options);
};

// =====================================================
// ENDPOINTS ADMINISTRATIVOS (NUEVOS)
// =====================================================

export const getUsuariosPaginados = async (params = {}) => {
  console.log('🌐 API: Obteniendo usuarios paginados con parámetros:', params);
  const query = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      query.append(key, params[key]);
    }
  });
  return await apiRequest(`/usuarios?${query.toString()}`);
};

export const cambiarEstadoUsuario = async (usuarioId, activo) => {
  console.log('🌐 API: Cambiando estado de usuario:', usuarioId, activo);
  return await apiRequest(`/usuarios/${usuarioId}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ activo }),
  });
};

export const restaurarUsuario = async (usuarioId) => {
  console.log('🌐 API: Restaurando usuario:', usuarioId);
  return await apiRequest(`/usuarios/${usuarioId}/restaurar`, {
    method: 'PUT',
  });
};

export const restablecerPasswordUsuario = async (usuarioId, nuevaPassword) => {
  console.log('🌐 API: Restableciendo contraseña de usuario:', usuarioId);
  return await apiRequest(`/usuarios/${usuarioId}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password: nuevaPassword }),
  });
};

export const getEstadisticasAdmin = async () => {
  console.log('🌐 API: Obteniendo estadísticas del administrador...');
  return await apiRequest('/admin/estadisticas');
};

export const getAuditoriaAdmin = async () => {
  console.log('🌐 API: Obteniendo log de auditoría...');
  return await apiRequest('/admin/auditoria');
};

export const getDocentesConCursos = async () => {
  console.log('🌐 API: Obteniendo docentes con cursos asignados...');
  return await apiRequest('/admin/docentes');
};

export const getMaterias = async () => {
  console.log('🌐 API: Obteniendo materias...');
  return await apiRequest('/materias');
};

export const asignarCursoADocente = async (datos) => {
  console.log('🌐 API: Asignando curso y materia a docente:', datos);
  return await apiRequest('/admin/docentes/asignar', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
};

export const desasignarCursoDeDocente = async (datos) => {
  console.log('🌐 API: Desasignando asignación de docente:', datos);
  return await apiRequest('/admin/docentes/desasignar', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
};

export const getFamiliasConVinculos = async () => {
  console.log('🌐 API: Obteniendo familias con vínculos...');
  return await apiRequest('/admin/familias');
};

export const vincularEstudianteAFamilia = async (datos) => {
  console.log('🌐 API: Vinculando estudiante a familia:', datos);
  return await apiRequest('/admin/familias/vincular', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
};

export const desvincularEstudianteDeFamilia = async (datos) => {
  console.log('🌐 API: Desvinculando estudiante de familia:', datos);
  return await apiRequest('/admin/familias/desvincular', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
};

export const getTodosLosEstudiantes = async () => {
  console.log('🌐 API: Obteniendo todos los estudiantes...');
  return await apiRequest('/estudiantes');
};

export const getEstudiantesDisponibles = async () => {
  console.log('🌐 API: Obteniendo estudiantes disponibles...');
  return await apiRequest('/estudiantes/disponibles');
};

export const getMyCoursesAndSubjects = async () => {
  console.log('🌐 API: Obteniendo cursos y materias asignadas al docente...');
  return await apiRequest('/teacher/my-courses');
};

// =====================================================
// SISTEMA DE EVALUACIÓN POR INDICADORES Y BIMESTRES
// =====================================================

/** Lista los bimestres del año actual */
export const getBimestres = async (anio = null) => {
  const query = anio ? `?anio=${anio}` : '';
  console.log('🌐 API: Obteniendo bimestres...');
  return await apiRequest(`/bimestres${query}`);
};

/** Obtiene los indicadores de logro para curso+materia+bimestre */
export const getIndicadoresBimestre = async ({ cursoId, materiaId, bimestreId }) => {
  const q = new URLSearchParams({ cursoId, materiaId, bimestreId });
  console.log('🌐 API: Obteniendo indicadores de bimestre...');
  return await apiRequest(`/calificaciones-bimestre/indicadores?${q}`);
};

/** Guarda / actualiza los 2 indicadores de logro de un bimestre */
export const guardarIndicadoresBimestre = async ({ cursoId, materiaId, bimestreId, indicadores }) => {
  console.log('🌐 API: Guardando indicadores de bimestre...');
  return await apiRequest('/calificaciones-bimestre/indicadores', {
    method: 'POST',
    body: JSON.stringify({ cursoId, materiaId, bimestreId, indicadores }),
  });
};

/** Obtiene la matriz completa de estudiantes × indicadores × notas */
export const getMatrizCalificaciones = async ({ cursoId, materiaId, bimestreId }) => {
  const q = new URLSearchParams({ cursoId, materiaId, bimestreId });
  console.log('🌐 API: Obteniendo matriz de calificaciones...');
  return await apiRequest(`/calificaciones-bimestre/matriz?${q}`);
};

/** Guarda un lote de notas parciales */
export const guardarMatrizCalificaciones = async (notas) => {
  console.log('🌐 API: Guardando matriz de calificaciones...');
  return await apiRequest('/calificaciones-bimestre/guardar', {
    method: 'POST',
    body: JSON.stringify({ notas }),
  });
};

/** Vista familia: notas por indicador + definitiva de un estudiante */
export const getCalificacionesBimestreFamilia = async (estudianteId) => {
  console.log('🌐 API: Obteniendo calificaciones bimestre para familia:', estudianteId);
  return await apiRequest(`/calificaciones-bimestre/familia/${estudianteId}`);
};

// =====================================================
// TAREAS ACADÉMICAS Y ENTREGAS (DOCENTE)
// =====================================================

export const getTareasDocente = async (params = {}) => {
  console.log('🌐 API: Obteniendo tareas del docente...', params);
  const query = new URLSearchParams();
  if (params.curso_id) query.append('curso_id', params.curso_id);
  if (params.materia_id) query.append('materia_id', params.materia_id);
  if (params.estado) query.append('estado', params.estado);
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return await apiRequest(`/docente/tareas${queryString}`);
};

export const getTareaDocente = async (tareaId) => {
  console.log('🌐 API: Obteniendo detalle de tarea:', tareaId);
  return await apiRequest(`/docente/tareas/${tareaId}`);
};

export const crearTareaDocente = async (payload) => {
  console.log('🌐 API: Creando tarea académica:', payload);
  return await apiRequest('/docente/tareas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const actualizarTareaDocente = async (tareaId, payload) => {
  console.log('🌐 API: Actualizando tarea académica:', tareaId, payload);
  return await apiRequest(`/docente/tareas/${tareaId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const eliminarTareaDocente = async (tareaId) => {
  console.log('🌐 API: Eliminando tarea académica:', tareaId);
  return await apiRequest(`/docente/tareas/${tareaId}`, {
    method: 'DELETE',
  });
};

export const getEntregasTarea = async (tareaId) => {
  console.log('🌐 API: Obteniendo entregas de la tarea:', tareaId);
  return await apiRequest(`/docente/tareas/${tareaId}/entregas`);
};

export const calificarEntregaTarea = async (tareaId, payload) => {
  console.log('🌐 API: Calificando entrega de la tarea:', tareaId, payload);
  return await apiRequest(`/docente/tareas/${tareaId}/calificar`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getSemaforoTareasHijo = async (estudianteId) => {
  console.log('🌐 API: Obteniendo semáforo de tareas para estudiante:', estudianteId);
  return await apiRequest(`/familia/tareas-semaforo/${estudianteId}`);
};


