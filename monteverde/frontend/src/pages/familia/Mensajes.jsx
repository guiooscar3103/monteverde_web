import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import BarraTitulo from '../../components/BarraTitulo';
import Card from '../../components/Card';
import {
  GraduationCap,
  Mail,
  Search,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Archive,
  ArchiveRestore,
  Inbox,
  BookOpen
} from 'lucide-react';
import {
  getMensajesPorUsuario,
  getConversacion,
  enviarMensaje,
  marcarComoLeido,
  getUsuariosPorRol,
  getUsuarioPorId,
  eliminarMensaje,
  archivarConversacion,
  desarchivarConversacion,
  getConversacionesArchivadas
} from '../../services/api';
import ChatHeader, { getInitials } from '../../components/chat/ChatHeader';
import ChatComposer from '../../components/chat/ChatComposer';
import ChatMessageList from '../../components/chat/ChatMessageList';
import DocentePerfilModal from '../../components/chat/DocentePerfilModal';


// Funciones helper para reducir complejidad
const _crearMapaConversaciones = (mensajes, usuarioId) => {
  const map = {};
  for (const msg of mensajes) {
    const contactoId = msg.emisor_id === usuarioId ? msg.receptor_id : msg.emisor_id;
    if (!map[contactoId]) {
      map[contactoId] = { ultimoMensaje: msg, noLeidos: 0 };
    }
    if (msg.receptor_id === usuarioId && !msg.leido) {
      map[contactoId].noLeidos++;
    }
    const fechaActual = new Date(msg.fecha);
    const fechaUltimo = new Date(map[contactoId].ultimoMensaje.fecha);
    if (fechaActual > fechaUltimo) {
      map[contactoId].ultimoMensaje = msg;
    }
  }
  return map;
};

const _agregarContactosAlMapa = async (mapa, docentes, usuarioId) => {
  for (const contactoId of Object.keys(mapa)) {
    try {
      const contacto = await getUsuarioPorId(parseInt(contactoId));
      if (contacto.rol === 'docente') {
        mapa[contactoId].contacto = contacto;
      }
    } catch (e) {
      delete mapa[contactoId];
    }
  }
  return mapa;
};

const _formatearConversaciones = (mapa) => {
  return Object.values(mapa)
    .filter(c => c.contacto)
    .sort((a, b) => new Date(b.ultimoMensaje.fecha) - new Date(a.ultimoMensaje.fecha));
};

const _filtrarDocentes = (lista, filtro, conversaciones) => {
  if (!filtro.trim()) return lista;
  const q = filtro.trim().toLowerCase();
  return lista.filter(docente => {
    if (docente.nombre?.toLowerCase().includes(q) || docente.email?.toLowerCase().includes(q)) return true;
    if (docente.materias && docente.materias.some(m => m.toLowerCase().includes(q))) return true;
    if (docente.cursos && docente.cursos.some(c => c.toLowerCase().includes(q))) return true;
    const conv = conversaciones.find(c => c.contacto.id === docente.id);
    if (conv?.ultimoMensaje?.asunto?.toLowerCase().includes(q)) return true;
    if (conv?.ultimoMensaje?.cuerpo?.toLowerCase().includes(q)) return true;
    return false;
  });
};

function ContactosList({
  filtro,
  setFiltro,
  docentesFiltrados,
  contactoSeleccionado,
  abrirConversacion,
  pestana,
  setPestana,
  conteoActivas,
  conteoArchivadas,
  handleDesarchivar
}) {
  return (
    <Card title="Docentes" style={{ padding: '1rem', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Selector de Pestañas: Bandeja Principal | Archivados */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setPestana('activas')}
          style={{
            flex: 1,
            padding: '0.5rem 0.6rem',
            borderRadius: '8px',
            border: pestana === 'activas' ? '1.5px solid var(--color-primary, #0A3A20)' : '1px solid var(--border, #E2E8F0)',
            background: pestana === 'activas' ? '#ECFDF5' : '#F8FAFC',
            color: pestana === 'activas' ? 'var(--color-primary, #0A3A20)' : 'var(--text-muted, #64748B)',
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
            border: pestana === 'archivadas' ? '1.5px solid var(--color-primary, #0A3A20)' : '1px solid var(--border, #E2E8F0)',
            background: pestana === 'archivadas' ? '#ECFDF5' : '#F8FAFC',
            color: pestana === 'archivadas' ? 'var(--color-primary, #0A3A20)' : 'var(--text-muted, #64748B)',
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

      <div style={{ marginBottom: '0.85rem', position: 'relative', flexShrink: 0 }}>
        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          placeholder="Buscar docente o materia..."
          style={{
            width: '100%',
            background: "#F8FAFC",
            border: '1px solid var(--border, #E2E8F0)',
            borderRadius: '8px',
            padding: '0.55rem 0.85rem 0.55rem 2.2rem',
            fontSize: '0.92rem',
            color: 'var(--text, #0F172A)'
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '2px' }}>
        {docentesFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted, #64748B)', padding: '2rem 1rem', fontSize: '0.88rem' }}>
            {pestana === 'archivadas' ? 'No tienes conversaciones archivadas.' : 'No hay docentes disponibles.'}
          </div>
        )}
        {docentesFiltrados.map(docente => {
          const isSelected = contactoSeleccionado?.id === docente.id;
          const iniciales = getInitials(docente.nombre);
          const materiaDesc = docente.materia_principal || (docente.materias && docente.materias[0]);
          const cursoDesc = docente.curso_principal || (docente.cursos && docente.cursos[0]);
          const tagInfo = materiaDesc && cursoDesc ? `${materiaDesc} · ${cursoDesc}` : materiaDesc || (cursoDesc ? `Curso ${cursoDesc}` : 'Docente');

          return (
            <div
              key={`doc-${docente.id}`}
              onClick={() => abrirConversacion(docente)}
              style={{
                padding: '0.75rem 0.85rem',
                border: isSelected ? '1.5px solid var(--color-primary, #0A3A20)' : '1px solid var(--border, #E2E8F0)',
                borderLeft: isSelected ? '4px solid var(--color-primary, #0A3A20)' : '1px solid var(--border, #E2E8F0)',
                borderRadius: '12px',
                cursor: 'pointer',
                marginBottom: '0.5rem',
                backgroundColor: isSelected ? '#ECFDF5' : '#FFFFFF',
                boxShadow: isSelected ? '0 2px 8px rgba(10, 58, 32, 0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? 'var(--color-primary, #0A3A20)' : '#E2E8F0',
                    color: isSelected ? '#FFFFFF' : 'var(--text, #0F172A)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  {iniciales}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: isSelected ? 'var(--color-primary, #0A3A20)' : 'var(--text, #0F172A)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {docente.nombre}
                    </div>
                    {pestana === 'archivadas' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDesarchivar(docente.id);
                        }}
                        style={{
                          background: '#ECFDF5',
                          border: '1px solid var(--color-primary, #0A3A20)',
                          color: 'var(--color-primary, #0A3A20)',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                        title="Desarchivar"
                      >
                        <ArchiveRestore size={11} />
                        <span>Desarchivar</span>
                      </button>
                    )}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--color-primary-light, #166534)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <BookOpen size={11} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tagInfo}</span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={11} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{docente.email}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ConversacionArea({
  contactoSeleccionado,
  conversacionActual,
  usuario,
  enviarNuevoMensaje,
  asunto,
  setAsunto,
  nuevoMensaje,
  setNuevoMensaje,
  enviando,
  onRetractar,
  archivadasIds,
  handleArchivar,
  handleDesarchivar,
  onVerPerfil
}) {
  if (!contactoSeleccionado) {
    return (
      <Card style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-muted, #64748B)',
          textAlign: 'center',
          flexDirection: 'column',
          padding: '2.5rem 1.5rem'
        }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ECFDF5',
              color: 'var(--color-primary, #0A3A20)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}
          >
            <GraduationCap size={36} strokeWidth={1.75} />
          </div>
          <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.4rem 0', fontWeight: 700, color: 'var(--text, #0F172A)' }}>
            Selecciona un docente
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748B)', maxWidth: '320px', lineHeight: '1.45', margin: 0 }}>
            Elige a un docente de la lista para iniciar una conversación institucional o ver tus consultas.
          </p>
        </div>
      </Card>
    );
  }

  const esArchivada = archivadasIds.includes(contactoSeleccionado.id);
  const isFirstMessage = conversacionActual.length === 0;

  return (
    <Card style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 1. Header Contextual del Chat */}
      <ChatHeader
        contacto={contactoSeleccionado}
        esArchivada={esArchivada}
        onVerPerfil={onVerPerfil}
        onArchivar={handleArchivar}
        onDesarchivar={handleDesarchivar}
        esDocenteViewer={false}
      />

      {/* 2. Lista de Mensajes con Scroll Independiente */}
      <ChatMessageList
        conversacion={conversacionActual}
        usuarioActual={usuario}
        onRetractar={onRetractar}
        nombreContacto={contactoSeleccionado.nombre}
        emptySubtext="Envía tu primera consulta o mensaje al docente a continuación."
      />

      {/* 3. Compositor de Chat Fijo en la Parte Inferior */}
      <ChatComposer
        asunto={asunto}
        setAsunto={setAsunto}
        nuevoMensaje={nuevoMensaje}
        setNuevoMensaje={setNuevoMensaje}
        onEnviar={enviarNuevoMensaje}
        enviando={enviando}
        isFirstMessage={isFirstMessage}
        placeholder={`Escribe un mensaje para ${contactoSeleccionado.nombre}...`}
      />
    </Card>
  );
}

export default function FamiliaMensajes() {
  const { usuario } = useAuth();
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActual, setConversacionActual] = useState([]);
  const [contactoSeleccionado, setContactoSeleccionado] = useState(null);
  const [docentes, setDocentes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [asunto, setAsunto] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [filtro, setFiltro] = useState('');

  // Modal Perfil del Docente
  const [perfilModalOpen, setPerfilModalOpen] = useState(false);

  // Pestañas de mensajería: Bandeja principal vs Archivados
  const [pestana, setPestana] = useState('activas'); // 'activas' | 'archivadas'
  const [archivadasIds, setArchivadasIds] = useState([]);

  const handleArchivar = async (contactoId) => {
    try {
      await archivarConversacion(contactoId);
      setArchivadasIds(prev => [...new Set([...prev, contactoId])]);
      if (contactoSeleccionado?.id === contactoId) {
        setContactoSeleccionado(null);
        setConversacionActual([]);
      }
      setMensaje('✅ Conversación archivada');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setMensaje('❌ Error al archivar conversación: ' + error.message);
    }
  };

  const handleDesarchivar = async (contactoId) => {
    try {
      await desarchivarConversacion(contactoId);
      setArchivadasIds(prev => prev.filter(id => id !== contactoId));
      setMensaje('✅ Conversación desarchivada');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setMensaje('❌ Error al desarchivar conversación: ' + error.message);
    }
  };

  // Retractación de mensajes
  const [mensajeParaRetractar, setMensajeParaRetractar] = useState(null);
  const [retractando, setRetractando] = useState(false);

  const handleRetractarMensaje = async () => {
    if (!mensajeParaRetractar) return;
    try {
      setRetractando(true);
      const res = await eliminarMensaje(mensajeParaRetractar.id);
      
      // Actualización inmediata sin recargar
      setConversacionActual(prev => prev.map(m => m.id === mensajeParaRetractar.id ? {
        ...m,
        eliminado: true,
        cuerpo: '🚫 Este mensaje fue eliminado por su remitente.',
        fecha_eliminacion: res?.data?.fecha_eliminacion || new Date().toISOString()
      } : m));

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

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [mensajes, usuariosDocente, archivadasRes] = await Promise.all([
          getMensajesPorUsuario(usuario.id),
          getUsuariosPorRol('docente').catch(() => []),
          getConversacionesArchivadas().catch(() => ({ conversaciones: [] }))
        ]);
        setDocentes(usuariosDocente || []);
        const archList = archivadasRes?.conversaciones || archivadasRes?.data || (Array.isArray(archivadasRes) ? archivadasRes : []);
        setArchivadasIds(archList.map(a => a.contacto_id));
        await procesarConversaciones(mensajes || []);
      } catch (error) {
        setMensaje('❌ Error al cargar mensajes: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (usuario?.id) cargarDatos();
  }, [usuario]);

  const procesarConversaciones = async (mensajes) => {
    let mapa = _crearMapaConversaciones(mensajes, usuario.id);
    mapa = await _agregarContactosAlMapa(mapa, docentes, usuario.id);
    const conversacionesArray = _formatearConversaciones(mapa);
    setConversaciones(conversacionesArray);
  };

  const conteoActivas = docentes.filter(d => !archivadasIds.includes(d.id)).length;
  const conteoArchivadas = docentes.filter(d => archivadasIds.includes(d.id)).length;

  const filtrarDocentes = (lista) => {
    const filtrados = _filtrarDocentes(lista, filtro, conversaciones);
    return filtrados.filter(docente => {
      const esArchivado = archivadasIds.includes(docente.id);
      if (pestana === 'activas') return !esArchivado;
      if (pestana === 'archivadas') return esArchivado;
      return true;
    });
  };

  const abrirConversacion = async (contacto) => {
    setContactoSeleccionado(contacto);
    setAsunto('');
    try {
      const mensajes = await getConversacion(usuario.id, contacto.id);
      setConversacionActual(mensajes || []);
      const mensajesNoLeidos = (mensajes || []).filter(m =>
        m.receptor_id == usuario.id && !m.leido
      );
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

  const enviarNuevoMensaje = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!nuevoMensaje.trim() || !contactoSeleccionado) {
      return;
    }
    setEnviando(true);
    setMensaje('');
    try {
      const mensajeData = {
        emisorId: usuario.id,
        receptorId: contactoSeleccionado.id,
        asunto: asunto.trim() || 'Consulta familiar',
        cuerpo: nuevoMensaje.trim()
      };
      const mensajeEnviado = await enviarMensaje(mensajeData);
      setConversacionActual(prev => [...prev, mensajeEnviado]);
      setNuevoMensaje('');
      setAsunto('');
      // Auto-desarchivar en estado local si estaba archivado
      setArchivadasIds(prev => prev.filter(id => id !== contactoSeleccionado.id));
      try {
        const mensajesActualizados = await getMensajesPorUsuario(usuario.id);
        await procesarConversaciones(mensajesActualizados);
      } catch {}
    } catch (error) {
      setMensaje('❌ Error al enviar mensaje: ' + error.message);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="grid">
        <BarraTitulo titulo="Mensajes" subtitulo="Cargando..." />
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
            <p>Cargando mensajes...</p>
          </div>
        </Card>
      </div>
    );
  }

  const docentesFiltrados = filtrarDocentes(docentes);

  return (
    <div className="grid">
      <BarraTitulo
        titulo="Mensajes"
        subtitulo="Comunicación institucional con docentes"
        derecha={
          <div style={{ fontSize: '0.9rem', textAlign: 'right', color: 'var(--text-muted, #64748B)' }}>
            <div><strong>{conversaciones.length}</strong> conversaciones activas</div>
          </div>
        }
      />

      {mensaje && (
        <div style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: mensaje.includes('Error') ? '#fee2e2' : mensaje.includes('Escribe') ? '#fef3c7' : '#d1fae5',
          color: mensaje.includes('Error') ? '#991b1b' : mensaje.includes('Escribe') ? '#92400e' : '#065f46',
          border: '1px solid',
          borderColor: mensaje.includes('Error') ? '#ef4444' : mensaje.includes('Escribe') ? '#f59e0b' : '#10b981',
          borderRadius: '10px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontWeight: 600
        }}>
          {mensaje.includes('Error') ? (
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
          ) : mensaje.includes('Escribe') ? (
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          )}
          <span>{mensaje.replace(/^[✅❌⚠️]\s*/, '')}</span>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '350px 1fr',
        gap: '1rem',
        height: '72vh'
      }}>
        <ContactosList
          filtro={filtro}
          setFiltro={setFiltro}
          docentesFiltrados={docentesFiltrados}
          contactoSeleccionado={contactoSeleccionado}
          abrirConversacion={abrirConversacion}
          pestana={pestana}
          setPestana={setPestana}
          conteoActivas={conteoActivas}
          conteoArchivadas={conteoArchivadas}
          handleDesarchivar={handleDesarchivar}
        />

        <ConversacionArea
          contactoSeleccionado={contactoSeleccionado}
          conversacionActual={conversacionActual}
          usuario={usuario}
          enviarNuevoMensaje={enviarNuevoMensaje}
          asunto={asunto}
          setAsunto={setAsunto}
          nuevoMensaje={nuevoMensaje}
          setNuevoMensaje={setNuevoMensaje}
          enviando={enviando}
          onRetractar={(msg) => setMensajeParaRetractar(msg)}
          archivadasIds={archivadasIds}
          handleArchivar={handleArchivar}
          handleDesarchivar={handleDesarchivar}
          onVerPerfil={() => setPerfilModalOpen(true)}
        />
      </div>

      {/* MODAL PERFIL DEL DOCENTE */}
      <DocentePerfilModal
        docente={contactoSeleccionado}
        isOpen={perfilModalOpen}
        onClose={() => setPerfilModalOpen(false)}
      />

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
