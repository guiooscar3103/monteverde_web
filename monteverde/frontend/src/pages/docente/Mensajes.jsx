import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import BarraTitulo from '../../components/BarraTitulo';
import Card from '../../components/Card';
import BlurFade from '../../components/BlurFade';
import {
  User,
  UsersRound,
  GraduationCap,
  Mail,
  Megaphone,
  Info,
  Users,
  MessageSquare,
  Search,
  Ban,
  Undo2,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Archive,
  ArchiveRestore,
  Inbox
} from 'lucide-react';
import { 
  getMensajesPorUsuario, 
  getConversacion, 
  enviarMensaje, 
  marcarComoLeido,
  getContactosDocente,
  getEstudiantesPorCurso,
  enviarMensajeCurso,
  getMyCoursesAndSubjects,
  getUsuarioPorId,
  eliminarMensaje,
  archivarConversacion,
  desarchivarConversacion,
  getConversacionesArchivadas
} from '../../services/api';
import ChatHeader from '../../components/chat/ChatHeader';
import ChatComposer from '../../components/chat/ChatComposer';
import ChatMessageList from '../../components/chat/ChatMessageList';


// Helpers para conversaciones activas
const _buildConversationMap = (mensajes, usuarioId) => {
  const map = {};
  for (const msg of mensajes) {
    const contactoId = msg.emisorId === usuarioId ? msg.receptorId : msg.emisorId;
    if (!map[contactoId]) {
      map[contactoId] = { ultimoMensaje: msg, noLeidos: 0 };
    }
    if (msg.receptorId === usuarioId && !msg.leido) {
      map[contactoId].noLeidos++;
    }
    if (!map[contactoId].ultimoMensaje || new Date(msg.fecha) > new Date(map[contactoId].ultimoMensaje.fecha)) {
      map[contactoId].ultimoMensaje = msg;
    }
  }
  return map;
};

const _addContactosToMap = async (mapa, usuarioId) => {
  for (const contactoId of Object.keys(mapa)) {
    try {
      const contacto = await getUsuarioPorId(parseInt(contactoId));
      mapa[contactoId].contacto = contacto;
    } catch {
      delete mapa[contactoId];
    }
  }
  return mapa;
};

const _formatConversations = (mapa) => {
  return Object.values(mapa)
    .filter(c => c.contacto)
    .sort((a, b) => new Date(b.ultimoMensaje.fecha) - new Date(a.ultimoMensaje.fecha));
};

export default function MensajesDocente() {
  const { usuario } = useAuth();
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActual, setConversacionActual] = useState([]);
  const [contactoSeleccionado, setContactoSeleccionado] = useState(null);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  
  // Cursos, Familias y Estudiantes
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [familias, setFamilias] = useState([]);
  const [estudiantesCurso, setEstudiantesCurso] = useState([]);
  
  // Modo Difusión
  const [modoDifusion, setModoDifusion] = useState(false);
  const [asuntoDifusion, setAsuntoDifusion] = useState('');
  const [cuerpoDifusion, setCuerpoDifusion] = useState('');
  const [enviandoDifusion, setEnviandoDifusion] = useState(false);

  // Modo Mensaje Individual
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [asunto, setAsunto] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Estados de interfaz
  const [loading, setLoading] = useState(true);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [errorLista, setErrorLista] = useState('');
  const [filtro, setFiltro] = useState('');

  // Pestañas de mensajería: Bandeja principal vs Archivados
  const [pestana, setPestana] = useState('activas'); // 'activas' | 'archivadas'
  const [archivadasIds, setArchivadasIds] = useState([]);

  // Retractación de mensajes
  const [mensajeParaRetractar, setMensajeParaRetractar] = useState(null);
  const [retractando, setRetractando] = useState(false);

  const handleArchivar = async (contactoId) => {
    try {
      await archivarConversacion(contactoId);
      setArchivadasIds(prev => [...new Set([...prev, contactoId])]);
      if (contactoSeleccionado?.id === contactoId) {
        setContactoSeleccionado(null);
        setConversacionActual([]);
      }
      setMensaje('✅ Conversación archivada exitosamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setMensaje('❌ Error al archivar conversación: ' + error.message);
    }
  };

  const handleDesarchivar = async (contactoId) => {
    try {
      await desarchivarConversacion(contactoId);
      setArchivadasIds(prev => prev.filter(id => id !== contactoId));
      setMensaje('✅ Conversación desarchivada exitosamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setMensaje('❌ Error al desarchivar conversación: ' + error.message);
    }
  };

  const handleRetractarMensaje = async () => {
    if (!mensajeParaRetractar) return;
    try {
      setRetractando(true);
      const res = await eliminarMensaje(mensajeParaRetractar.id);
      
      // Actualización inmediata del estado local sin recargar toda la página
      setConversacionActual(prev => prev.map(m => m.id === mensajeParaRetractar.id ? {
        ...m,
        eliminado: true,
        cuerpo: '🚫 Este mensaje fue eliminado por su remitente.',
        fecha_eliminacion: res?.data?.fecha_eliminacion || new Date().toISOString()
      } : m));

      // Actualizar también la lista lateral de conversaciones si era el último mensaje
      setConversaciones(prev => prev.map(c => {
        if (c.ultimoMensaje?.id === mensajeParaRetractar.id) {
          return {
            ...c,
            ultimoMensaje: {
              ...c.ultimoMensaje,
              eliminado: true,
              cuerpo: '🚫 Este mensaje fue eliminado por su remitente.'
            }
          };
        }
        return c;
      }));

      setMensajeParaRetractar(null);
      setMensaje('✅ Mensaje retractado exitosamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      const msg = error?.message || '';
      if (msg.includes('403') || msg.toLowerCase().includes('permiso')) {
        alert('No tienes permisos para retractar este mensaje.');
      } else if (msg.includes('404') || msg.toLowerCase().includes('no encontrado')) {
        alert('El mensaje ya no existe.');
      } else {
        alert(msg || 'No fue posible retractar el mensaje. Inténtalo nuevamente.');
      }
    } finally {
      setRetractando(false);
    }
  };

  // 1. Carga inicial: Mensajes, Cursos y Archivadas del docente
  useEffect(() => {
    const cargarInicial = async () => {
      try {
        setLoading(true);
        const [mensajesRes, cursosRes, archivadasRes] = await Promise.all([
          getMensajesPorUsuario(usuario.id),
          getMyCoursesAndSubjects(),
          getConversacionesArchivadas().catch(() => ({ conversaciones: [] }))
        ]);

        const listaCursos = cursosRes?.data ? cursosRes.data : (Array.isArray(cursosRes) ? cursosRes : []);
        setCursos(listaCursos);
        const archList = archivadasRes?.conversaciones || archivadasRes?.data || (Array.isArray(archivadasRes) ? archivadasRes : []);
        setArchivadasIds(archList.map(a => a.contacto_id));
        await procesarConversaciones(mensajesRes);
      } catch (error) {
        setMensaje('❌ Error al cargar datos iniciales: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    if (usuario) cargarInicial();
  }, [usuario]);


  // 2. Carga dinámica según el selector de curso
  const cargarDestinatarios = useCallback(async (cursoId) => {
    try {
      setCargandoLista(true);
      setErrorLista('');
      
      if (cursoId) {
        // Cargar estudiantes del curso con sus familias
        const res = await getEstudiantesPorCurso(cursoId);
        const lista = res?.data ? res.data : (Array.isArray(res) ? res : []);
        setEstudiantesCurso(lista);
        setFamilias([]);
      } else {
        // Cargar todas las familias de todos los cursos
        const res = await getContactosDocente(null);
        const lista = res?.data ? res.data : (Array.isArray(res) ? res : []);
        setFamilias(lista);
        setEstudiantesCurso([]);
      }
    } catch (error) {
      console.error('Error cargando destinatarios:', error);
      setErrorLista('Error al cargar la lista de destinatarios: ' + (error.message || ''));
      setFamilias([]);
      setEstudiantesCurso([]);
    } finally {
      setCargandoLista(false);
    }
  }, []);

  useEffect(() => {
    if (usuario) {
      cargarDestinatarios(cursoSeleccionado);
      // Resetear selecciones al cambiar de curso
      setModoDifusion(false);
      setContactoSeleccionado(null);
      setEstudianteSeleccionado(null);
    }
  }, [usuario, cursoSeleccionado, cargarDestinatarios]);

  const procesarConversaciones = async (mensajes) => {
    let mapa = _buildConversationMap(mensajes, usuario.id);
    mapa = await _addContactosToMap(mapa, usuario.id);
    setConversaciones(_formatConversations(mapa));
  };

  // Abrir conversación 1-a-1 con una familia
  const abrirConversacion = async (contacto, estudiante = null) => {
    setModoDifusion(false);
    setContactoSeleccionado(contacto);
    setEstudianteSeleccionado(estudiante);
    setAsunto('');
    try {
      const mensajes = await getConversacion(usuario.id, contacto.id);
      setConversacionActual(mensajes);
      // Marcar mensajes no leídos como leídos
      const mensajesNoLeidos = mensajes.filter(m => m.receptorId == usuario.id && !m.leido);
      for (const mensajeNoLeido of mensajesNoLeidos) {
        await marcarComoLeido(mensajeNoLeido.id);
      }
      setConversaciones(prev => prev.map(conv => 
        conv.contacto.id === contacto.id 
          ? { ...conv, noLeidos: 0 }
          : conv
      ));
    } catch (error) {
      setMensaje('❌ Error al cargar conversación: ' + error.message);
    }
  };

  // Seleccionar estudiante del curso
  const seleccionarEstudiante = (est) => {
    const familiaAsociada = est.familias && est.familias.length > 0 ? est.familias[0] : null;
    if (familiaAsociada) {
      abrirConversacion(familiaAsociada, est);
    } else {
      setModoDifusion(false);
      setEstudianteSeleccionado(est);
      setContactoSeleccionado(null);
      setConversacionActual([]);
    }
  };

  // Activar modo difusión masiva
  const activarModoDifusion = () => {
    setModoDifusion(true);
    setContactoSeleccionado(null);
    setEstudianteSeleccionado(null);
    setAsuntoDifusion('');
    setCuerpoDifusion('');
  };

  // Enviar mensaje individual privado
  const enviarNuevoMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !contactoSeleccionado) return;
    setEnviando(true);
    setMensaje('');
    try {
      const mensajeData = {
        emisorId: usuario.id,
        receptorId: contactoSeleccionado.id,
        asunto: asunto || (estudianteSeleccionado ? `Mensaje sobre ${estudianteSeleccionado.nombre}` : 'Mensaje del docente'),
        cuerpo: nuevoMensaje.trim()
      };
      const mensajeEnviado = await enviarMensaje(mensajeData);
      setConversacionActual(prev => [...prev, mensajeEnviado]);
      setNuevoMensaje('');
      setAsunto('');
      const mensajesActualizados = await getMensajesPorUsuario(usuario.id);
      await procesarConversaciones(mensajesActualizados);
      setMensaje('✅ Mensaje enviado correctamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setMensaje('❌ Error al enviar mensaje: ' + error.message);
    } finally {
      setEnviando(false);
    }
  };

  // Enviar difusión masiva al curso
  const handleEnviarDifusion = async (e) => {
    e.preventDefault();
    if (!cuerpoDifusion.trim() || !cursoSeleccionado) return;
    setEnviandoDifusion(true);
    setMensaje('');
    try {
      const res = await enviarMensajeCurso({
        cursoId: parseInt(cursoSeleccionado),
        asunto: asuntoDifusion.trim() || 'Circular informativa de curso',
        cuerpo: cuerpoDifusion.trim()
      });

      const count = res?.destinatarios_count ?? 'los';
      setMensaje(`✅ ${res?.message || `Difusión enviada correctamente a ${count} acudientes.`}`);
      setAsuntoDifusion('');
      setCuerpoDifusion('');

      // Recargar conversaciones
      const mensajesActualizados = await getMensajesPorUsuario(usuario.id);
      await procesarConversaciones(mensajesActualizados);
      setTimeout(() => setMensaje(''), 4000);
    } catch (error) {
      setMensaje('❌ Error al enviar difusión: ' + (error.message || 'Error en el servidor'));
    } finally {
      setEnviandoDifusion(false);
    }
  };

  // Obtener nombre del curso seleccionado actual
  const cursoObj = cursos.find(c => String(c.curso_id) === String(cursoSeleccionado));
  const nombreCursoActual = cursoObj ? (cursoObj.curso_nombre || `${cursoObj.curso_nivel}${cursoObj.curso_letra}`) : '';

  // Conteo para pestañas
  const conteoActivas = cursoSeleccionado
    ? estudiantesCurso.filter(est => {
        const f = est.familias && est.familias.length > 0 ? est.familias[0] : null;
        return f ? !archivadasIds.includes(f.id) : true;
      }).length
    : familias.filter(fam => !archivadasIds.includes(fam.id)).length;

  const conteoArchivadas = cursoSeleccionado
    ? estudiantesCurso.filter(est => {
        const f = est.familias && est.familias.length > 0 ? est.familias[0] : null;
        return f ? archivadasIds.includes(f.id) : false;
      }).length
    : familias.filter(fam => archivadasIds.includes(fam.id)).length;

  // Filtros de búsqueda
  const q = filtro.trim().toLowerCase();

  // Filtrado de estudiantes cuando hay un curso seleccionado
  const estudiantesFiltrados = estudiantesCurso.filter(est => {
    const familia = est.familias && est.familias.length > 0 ? est.familias[0] : null;
    const esArchivado = familia ? archivadasIds.includes(familia.id) : false;
    if (pestana === 'activas' && esArchivado) return false;
    if (pestana === 'archivadas' && !esArchivado) return false;

    if (!q) return true;
    if (est.nombre?.toLowerCase().includes(q)) return true;
    if (est.familias && est.familias.some(f => f.nombre?.toLowerCase().includes(q) || f.email?.toLowerCase().includes(q))) return true;
    return false;
  });

  // Filtrado de familias cuando está en "Todos mis cursos"
  const familiasFiltradas = familias.filter(fam => {
    const esArchivado = archivadasIds.includes(fam.id);
    if (pestana === 'activas' && esArchivado) return false;
    if (pestana === 'archivadas' && !esArchivado) return false;

    if (!q) return true;
    if (fam.nombre?.toLowerCase().includes(q) || fam.email?.toLowerCase().includes(q)) return true;
    if (fam.estudiantes && fam.estudiantes.some(est => est.nombre?.toLowerCase().includes(q) || est.curso_grado?.toLowerCase().includes(q))) return true;
    const conv = conversaciones.find(c => c.contacto?.id === fam.id);
    if (conv?.ultimoMensaje?.asunto?.toLowerCase().includes(q) || conv?.ultimoMensaje?.cuerpo?.toLowerCase().includes(q)) return true;
    return false;
  });


  if (loading) {
    return (
      <div className="grid">
        <BarraTitulo titulo="Mensajes" subtitulo="Cargando comunicación escolar..." />
        <Card>
          <div style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
            <p>Cargando mensajes y cursos asignados...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <BlurFade delay={0.05} duration={0.3}>
        <BarraTitulo 
          titulo="Mensajes" 
          subtitulo="Mensajería privada y difusión masiva por curso"
          derecha={
            <div style={{ fontSize: '0.9rem', textAlign: 'right', color: '#666' }}>
              <div><strong>{conversaciones.length}</strong> conversaciones activas</div>
            </div>
          }
        />
      </BlurFade>

      {/* Mensajes de estado / feedback */}
      {mensaje && (
        <BlurFade delay={0.08} duration={0.25}>
          <div style={{ 
            padding: '0.75rem 1.25rem',
            backgroundColor: mensaje.includes('Error') ? '#fee2e2' : '#d1fae5',
            color: mensaje.includes('Error') ? '#991b1b' : '#065f46',
            border: '1px solid',
            borderColor: mensaje.includes('Error') ? '#ef4444' : '#10b981',
            borderRadius: '8px',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 600
          }}>
            {mensaje.includes('Error') ? (
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            )}
            <span>{mensaje.replace(/^[✅❌⚠️]\s*/, '')}</span>
          </div>
        </BlurFade>
      )}
      
      <BlurFade delay={0.12} duration={0.4}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '380px 1fr', 
          gap: '1.25rem', 
          height: '74vh'
        }}>
          {/* Panel Lateral: Selector de Cursos y Lista de Destinatarios */}
          <Card title="Destinatarios" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
            
            {/* 1. Selector de Curso (Fijo) */}
            <div style={{ marginBottom: '0.75rem', flexShrink: 0 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Curso
              </label>
              <select
                value={cursoSeleccionado}
                onChange={e => setCursoSeleccionado(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-white, #fff)',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                <option value="">Todos mis cursos</option>
                {cursos.map(c => (
                  <option key={c.curso_id} value={c.curso_id}>
                    {c.curso_nombre || `${c.curso_nivel}${c.curso_letra}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Pestañas: Bandeja Principal | Archivados */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setPestana('activas')}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.6rem',
                  borderRadius: '8px',
                  border: pestana === 'activas' ? '1.5px solid var(--color-primary, #0A3A20)' : '1px solid var(--border, #e2e8f0)',
                  background: pestana === 'activas' ? '#ECFDF5' : '#f8fafc',
                  color: pestana === 'activas' ? 'var(--color-primary, #0A3A20)' : 'var(--text-secondary, #64748b)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Inbox size={14} />
                <span>Bandeja ({conteoActivas})</span>
              </button>
              <button
                type="button"
                onClick={() => setPestana('archivadas')}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.6rem',
                  borderRadius: '8px',
                  border: pestana === 'archivadas' ? '1.5px solid var(--color-primary, #0A3A20)' : '1px solid var(--border, #e2e8f0)',
                  background: pestana === 'archivadas' ? '#ECFDF5' : '#f8fafc',
                  color: pestana === 'archivadas' ? 'var(--color-primary, #0A3A20)' : 'var(--text-secondary, #64748b)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Archive size={14} />
                <span>Archivados ({conteoArchivadas})</span>
              </button>
            </div>

            {/* 2. Buscador en Tiempo Real (Fijo) */}
            <div style={{ marginBottom: '0.75rem', flexShrink: 0, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                placeholder={cursoSeleccionado ? "Buscar estudiante o familia..." : "Buscar familia, estudiante o mensaje..."}
                style={{
                  width: '100%',
                  background: "#F8FAFC",
                  border: '1px solid var(--border, #e2e8f0)',
                  borderRadius: '8px',
                  padding: '0.55rem 0.85rem 0.55rem 2.1rem',
                  fontSize: '0.92rem',
                  color: 'var(--text, #0F172A)'
                }}
              />
            </div>


            {/* 3. Botón / Tarjeta Fija: Difusión Masiva al Curso (Fijo cuando hay curso seleccionado) */}
            {cursoSeleccionado && (
              <div
                onClick={activarModoDifusion}
                style={{
                  padding: '0.75rem 0.9rem',
                  border: modoDifusion ? '2px solid var(--color-primary, #0A3A20)' : '1.5px dashed var(--color-primary-light, #166534)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  backgroundColor: modoDifusion ? '#ECFDF5' : 'rgba(10, 58, 32, 0.04)',
                  transition: 'all 0.15s ease-in-out',
                  marginBottom: '0.75rem',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Megaphone size={20} style={{ color: 'var(--color-primary, #0A3A20)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-primary, #0A3A20)' }}>
                      Enviar a todo el curso
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Difusión masiva a acudientes de {nombreCursoActual}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Lista Dinámica Desplazable (SCROLL VERTICAL INTERNO) */}
            <div 
              className="custom-scrollbar"
              style={{ 
                flex: 1, 
                minHeight: 0, 
                overflowY: 'auto', 
                overflowX: 'hidden', 
                paddingRight: '4px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.5rem' 
              }}
            >
              {cargandoLista ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mx-auto mb-2"></div>
                  <p style={{ fontSize: '0.88rem' }}>
                    {cursoSeleccionado ? 'Cargando estudiantes...' : 'Cargando contactos...'}
                  </p>
                </div>
              ) : errorLista ? (
                <div style={{ textAlign: 'center', color: '#ef4444', padding: '1.5rem', fontSize: '0.88rem' }}>
                  {errorLista}
                </div>
              ) : cursos.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888', padding: '2rem 1rem', fontSize: '0.88rem' }}>
                  <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <AlertTriangle size={15} />
                    <span>No tienes cursos asignados actualmente.</span>
                  </p>
                </div>
              ) : cursoSeleccionado ? (
                // === VISTA DE CURSO ESPECÍFICO (Lista de Estudiantes Desplazable) ===
                estudiantesCurso.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#888', padding: '2rem 1rem', fontSize: '0.88rem' }}>
                    <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <User size={15} />
                      <span>Este curso no tiene estudiantes registrados.</span>
                    </p>
                  </div>
                ) : estudiantesFiltrados.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#888', padding: '2rem 1rem', fontSize: '0.88rem' }}>
                    <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Search size={15} />
                      <span>No se encontraron estudiantes o familias que coincidan con la búsqueda.</span>
                    </p>
                  </div>
                ) : (
                  estudiantesFiltrados.map(estudiante => {
                    const familia = estudiante.familias && estudiante.familias.length > 0 ? estudiante.familias[0] : null;
                    const isSelected = !modoDifusion && estudianteSeleccionado?.id === estudiante.id;
                    const conv = familia ? conversaciones.find(c => c.contacto?.id === familia.id) : null;
                    const noLeidos = conv?.noLeidos || 0;

                    return (
                      <div
                        key={`est-${estudiante.id}`}
                        onClick={() => seleccionarEstudiante(estudiante)}
                        style={{
                          padding: '0.85rem 1rem',
                          border: isSelected ? '1.5px solid var(--color-primary, #0A3A20)' : '1px solid var(--border, #e2e8f0)',
                          borderLeft: isSelected ? '4px solid var(--color-primary, #0A3A20)' : '1px solid var(--border, #e2e8f0)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#ECFDF5' : '#ffffff',
                          boxShadow: isSelected ? '0 2px 8px rgba(10, 58, 32, 0.08)' : 'none',
                          transition: 'all 0.15s ease-in-out'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isSelected ? 'var(--color-primary, #0A3A20)' : 'var(--text-primary, #0F172A)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} style={{ color: 'var(--color-primary, #0A3A20)', flexShrink: 0 }} />
                            <span>{estudiante.nombre}</span>
                          </div>
                          {noLeidos > 0 && (
                            <span style={{
                              background: '#ef4444',
                              color: '#fff',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '10px'
                            }}>
                              {noLeidos} nuevo{noLeidos > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {familia ? (
                          <div style={{ fontSize: '0.82rem', color: 'var(--color-primary-light, #166534)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <GraduationCap size={13} style={{ flexShrink: 0 }} />
                            <span>Acudiente: {familia.nombre}</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                            <span>Sin acudiente vinculado</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              ) : (
                // === VISTA GENERAL: "Todos mis cursos" (Lista de Familias Desplazable) ===
                familias.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#888', padding: '2rem 1rem', fontSize: '0.88rem' }}>
                    <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <UsersRound size={15} />
                      <span>No hay familias asociadas a tus cursos asignados.</span>
                    </p>
                  </div>
                ) : familiasFiltradas.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#888', padding: '2rem 1rem', fontSize: '0.88rem' }}>
                    <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Search size={15} />
                      <span>No se encontraron contactos que coincidan con la búsqueda.</span>
                    </p>
                  </div>
                ) : (
                  familiasFiltradas.map(familia => {
                    const isSelected = !modoDifusion && contactoSeleccionado?.id === familia.id;
                    const conv = conversaciones.find(c => c.contacto?.id === familia.id);
                    const noLeidos = conv?.noLeidos || 0;

                    const nombresEstudiantes = familia.estudiantes && familia.estudiantes.length > 0
                      ? familia.estudiantes.map(e => e.nombre).join(', ')
                      : 'Sin estudiante asignado';

                    const gradosEstudiantes = familia.estudiantes && familia.estudiantes.length > 0
                      ? Array.from(new Set(familia.estudiantes.map(e => e.curso_grado || e.curso_nombre).filter(Boolean))).join(', ')
                      : '';

                    return (
                      <div
                        key={`fam-${familia.id}`}
                        onClick={() => abrirConversacion(familia)}
                        style={{
                          padding: '0.85rem 1rem',
                          border: isSelected ? '1.5px solid var(--color-primary, #0A3A20)' : '1px solid var(--border, #e2e8f0)',
                          borderLeft: isSelected ? '4px solid var(--color-primary, #0A3A20)' : '1px solid var(--border, #e2e8f0)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#ECFDF5' : '#ffffff',
                          boxShadow: isSelected ? '0 2px 8px rgba(10, 58, 32, 0.08)' : 'none',
                          transition: 'all 0.15s ease-in-out'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isSelected ? 'var(--color-primary, #0A3A20)' : 'var(--text-primary, #0F172A)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <UsersRound size={15} style={{ color: 'var(--color-primary, #0A3A20)', flexShrink: 0 }} />
                            <span>{familia.nombre}</span>
                          </div>
                          {noLeidos > 0 && (
                            <span style={{
                              background: '#ef4444',
                              color: '#fff',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '10px'
                            }}>
                              {noLeidos} nuevo{noLeidos > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary-light, #166534)', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <GraduationCap size={13} style={{ flexShrink: 0 }} />
                          <span>Acudiente de: {nombresEstudiantes}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={12} />
                            <span>{familia.email}</span>
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {pestana === 'archivadas' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDesarchivar(familia.id);
                                }}
                                style={{
                                  background: '#ECFDF5',
                                  border: '1px solid var(--color-primary, #0A3A20)',
                                  color: 'var(--color-primary, #0A3A20)',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Desarchivar"
                              >
                                <ArchiveRestore size={12} />
                                <span>Desarchivar</span>
                              </button>
                            )}
                            {gradosEstudiantes && (
                              <span style={{
                                background: 'rgba(0,0,0,0.06)',
                                padding: '1px 6px',
                                borderRadius: '6px',
                                fontWeight: 600
                              }}>
                                {gradosEstudiantes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )

              )}
            </div>
          </Card>
          
          {/* Panel Principal: Conversación 1-a-1 O Difusión Masiva */}
          <Card style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            
            {/* === MODO 1: DIFUSIÓN MASIVA AL CURSO === */}
            {modoDifusion ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header del Modo Difusión */}
                <div style={{ 
                  padding: '1.25rem 1.5rem', 
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: '#ECFDF5'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Megaphone size={24} style={{ color: 'var(--color-primary, #0A3A20)', flexShrink: 0 }} />
                    <div>
                      <h3 style={{ margin: 0, color: 'var(--color-primary, #0A3A20)', fontSize: '1.18rem', fontWeight: 700 }}>
                        Mensaje Masivo / Circular — {nombreCursoActual}
                      </h3>
                      <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.86rem', color: 'var(--color-primary-light, #166534)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Info size={14} style={{ flexShrink: 0 }} />
                        <span>Este mensaje será enviado individualmente a los acudientes de todos los estudiantes de <strong>{nombreCursoActual}</strong>.</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Formulario de Redacción de Difusión */}
                <form 
                  onSubmit={handleEnviarDifusion}
                  style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    padding: '1.5rem', 
                    gap: '1rem',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Asunto de la Difusión:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Reunión de padres / Aviso de evaluaciones bimestrales"
                      value={asuntoDifusion}
                      onChange={(e) => setAsuntoDifusion(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        color: 'var(--text, #0F172A)'
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Cuerpo del Mensaje:
                    </label>
                    <textarea
                      placeholder="Escribe aquí el contenido del comunicado para todos los acudientes del curso..."
                      value={cuerpoDifusion}
                      onChange={(e) => setCuerpoDifusion(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.85rem 1rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        resize: 'none',
                        fontSize: '0.95rem',
                        lineHeight: '1.5',
                        fontFamily: 'inherit',
                        minHeight: '180px',
                        color: 'var(--text, #0F172A)'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <div style={{ fontSize: '0.84rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={14} />
                      <span>Destinatarios: Acudientes del curso {nombreCursoActual} (sin mensajes duplicados).</span>
                    </div>
                    <button
                      type="submit"
                      disabled={enviandoDifusion || !cuerpoDifusion.trim()}
                      style={{
                        padding: '0.85rem 1.75rem',
                        backgroundColor: enviandoDifusion || !cuerpoDifusion.trim() ? '#94a3b8' : 'var(--color-primary, #0A3A20)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: enviandoDifusion || !cuerpoDifusion.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        boxShadow: '0 2px 6px rgba(10, 58, 32, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Megaphone size={16} />
                      <span>{enviandoDifusion ? 'Enviando difusión...' : 'Enviar a todo el curso'}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : contactoSeleccionado ? (
              // === MODO 2: CONVERSACIÓN PRIVADA 1-A-1 (Chat Institucional Moderno) ===
              <>
                {/* Header contextual de la conversación */}
                <ChatHeader
                  contacto={contactoSeleccionado}
                  esArchivada={archivadasIds.includes(contactoSeleccionado.id)}
                  onArchivar={handleArchivar}
                  onDesarchivar={handleDesarchivar}
                  estudianteContexto={estudianteSeleccionado}
                  esDocenteViewer={true}
                />

                {/* Historial de Mensajes con Scroll Independiente */}
                <ChatMessageList
                  conversacion={conversacionActual}
                  usuarioActual={usuario}
                  onRetractar={(msg) => setMensajeParaRetractar(msg)}
                  nombreContacto={contactoSeleccionado.nombre}
                  emptySubtext="Escribe el primer mensaje para la familia a continuación."
                />

                {/* Compositor de Chat Fijo */}
                <ChatComposer
                  asunto={asunto}
                  setAsunto={setAsunto}
                  nuevoMensaje={nuevoMensaje}
                  setNuevoMensaje={setNuevoMensaje}
                  onEnviar={enviarNuevoMensaje}
                  enviando={enviando}
                  isFirstMessage={conversacionActual.length === 0}
                  placeholder={estudianteSeleccionado ? `Escribe un mensaje para la familia de ${estudianteSeleccionado.nombre}...` : `Escribe un mensaje para ${contactoSeleccionado.nombre}...`}
                />
              </>
            ) : estudianteSeleccionado && (!estudianteSeleccionado.familias || estudianteSeleccionado.familias.length === 0) ? (
              // Estudiante seleccionado sin acudientes vinculados
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#64748b', 
                textAlign: 'center', 
                flexDirection: 'column',
                padding: '2rem'
              }}>
                <AlertTriangle size={44} style={{ color: '#d97706', marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                  {estudianteSeleccionado.nombre} no tiene acudiente vinculado
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: '380px', margin: 0 }}>
                  Para enviarle un mensaje, el estudiante debe estar asociado a un usuario con rol familia desde la administración.
                </p>
              </div>
            ) : (
              // Estado inicial sin selección
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#64748b', 
                textAlign: 'center', 
                flexDirection: 'column',
                padding: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: '#94a3b8' }}>
                  <MessageSquare size={44} strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                  {cursoSeleccionado ? "Selecciona un estudiante o envía una difusión" : "Selecciona una familia para comenzar"}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: '380px', margin: 0 }}>
                  {cursoSeleccionado 
                    ? "Haz clic en un estudiante para conversar en privado con su acudiente, o elige 'Enviar a todo el curso' para emitir un comunicado."
                    : "Filtra por curso en el panel de la izquierda y haz clic en cualquier contacto para iniciar la conversación."}
                </p>
              </div>
            )}
          </Card>
        </div>
      </BlurFade>

      {/* MODAL CONFIRMACIÓN RETRACTAR MENSAJE */}
      {mensajeParaRetractar && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
              <AlertTriangle size={24} style={{ color: '#dc2626', flexShrink: 0 }} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ¿Estás seguro de que deseas retractar este mensaje?
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
              El contenido dejará de estar visible para todos los participantes de la conversación.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                disabled={retractando}
                onClick={() => setMensajeParaRetractar(null)}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: '#f8fafc',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: retractando ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={retractando}
                onClick={handleRetractarMensaje}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: retractando ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)'
                }}
              >
                {retractando ? 'Retractando...' : 'Sí, retractar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
