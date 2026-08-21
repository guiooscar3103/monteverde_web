import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import BarraTitulo from '../../components/BarraTitulo';
import Card from '../../components/Card';
import {
  getMensajesPorUsuario,
  getConversacion,
  enviarMensaje,
  marcarComoLeido,
  getUsuariosPorRol,
  getUsuarioPorId,
  eliminarMensaje
} from '../../services/api';

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
  abrirConversacion
}) {
  return (
    <Card title="Contactos" style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="text"
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          placeholder="🔍 Buscar docente, asunto o mensaje"
          style={{
            width: '100%',
            background: "#f4f4f4",
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '0.5rem 0.85rem',
            fontSize: '0.97rem'
          }}
        />
      </div>
      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
        {docentesFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>No hay coincidencias.</div>
        )}
        {docentesFiltrados.map(docente => (
          <div
            key={`nuevo-${docente.id}`}
            onClick={() => abrirConversacion(docente)}
            style={{
              padding: '0.75rem',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '0.5rem',
              backgroundColor: contactoSeleccionado?.id === docente.id ? '#e3f2fd' : '#f9f9f9',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              👨‍🏫 {docente.nombre}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
              📧 {docente.email}
            </div>
          </div>
        ))}
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
  onRetractar
}) {
  if (!contactoSeleccionado) {
    return (
      <Card style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#666',
          textAlign: 'center',
          flexDirection: 'column'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👨‍🏫</div>
          <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            <strong>Selecciona un docente</strong>
          </p>
          <p style={{ fontSize: '0.9rem', color: '#999' }}>
            Haz clic en cualquier docente de la izquierda<br />
            para iniciar una conversación
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '1rem',
        borderBottom: '2px solid #eee',
        backgroundColor: '#f8f9fa'
      }}>
        <h3 style={{ margin: 0, color: 'var(--brand)', fontSize: '1.2rem' }}>
          💬 Conversación con {contactoSeleccionado.nombre}
        </h3>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
          📧 {contactoSeleccionado.email} • 👤 {contactoSeleccionado.rol}
        </p>
      </div>
      {/* Mensajes */}
      <div style={{
        flex: 1,
        padding: '1rem',
        overflowY: 'auto',
        backgroundColor: '#fafafa'
      }}>
        {conversacionActual.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            padding: '2rem',
            fontSize: '0.9rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💭</div>
            <p>No hay mensajes aún con este docente</p>
            <small>¡Envía tu primera consulta!</small>
          </div>
        ) : (
          conversacionActual.map(mensajeItem => {
            const emisorId = mensajeItem.emisor_id ?? mensajeItem.emisorId;
            const esMio = emisorId == usuario.id;
            const estaEliminado = Boolean(mensajeItem.eliminado);

            return (
              <div
                key={mensajeItem.id}
                style={{
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: esMio ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '0.9rem 1.1rem',
                    borderRadius: '16px',
                    backgroundColor: estaEliminado
                      ? (esMio ? 'rgba(76, 29, 149, 0.08)' : '#f1f5f9')
                      : (esMio ? '#4c1d95' : '#ffffff'),
                    color: estaEliminado
                      ? '#64748b'
                      : (esMio ? 'white' : 'black'),
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: estaEliminado
                      ? '1px dashed #cbd5e1'
                      : (esMio ? 'none' : '1px solid #e0e0e0'),
                    transition: 'all 0.2s ease'
                  }}
                >
                  {!estaEliminado && (
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      marginBottom: '0.35rem',
                      opacity: 0.95
                    }}>
                      📧 {mensajeItem.asunto}
                    </div>
                  )}

                  <div style={{
                    fontSize: '0.92rem',
                    lineHeight: '1.45',
                    marginBottom: '0.4rem',
                    whiteSpace: 'pre-wrap',
                    fontStyle: estaEliminado ? 'italic' : 'normal',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {estaEliminado ? (
                      <span>🚫 Este mensaje fue eliminado por su remitente.</span>
                    ) : (
                      mensajeItem.cuerpo
                    )}
                  </div>

                  <div style={{
                    fontSize: '0.72rem',
                    opacity: estaEliminado ? 0.7 : (esMio ? 0.85 : 0.6),
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    marginTop: '0.2rem'
                  }}>
                    {esMio && !estaEliminado && onRetractar && (
                      <button
                        type="button"
                        onClick={() => onRetractar(mensajeItem)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: esMio ? '#fef08a' : '#ef4444',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          textDecoration: 'underline'
                        }}
                        title="Retractar este mensaje"
                      >
                        ↩ Retractar mensaje
                      </button>
                    )}

                    <span style={{ marginLeft: 'auto' }}>
                      🕐 {new Date(mensajeItem.fecha).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form
        onSubmit={enviarNuevoMensaje}
        style={{
          padding: '1rem',
          borderTop: '2px solid #eee',
          backgroundColor: '#ffffff'
        }}
      >
        <input
          type="text"
          placeholder="📧 Asunto de tu consulta"
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '0.75rem',
            fontSize: '0.9rem',
            fontFamily: 'inherit'
          }}
        />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <textarea
            placeholder="✍️ Escribe tu consulta aquí..."
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              resize: 'none',
              fontSize: '0.9rem',
              minHeight: '80px',
              fontFamily: 'inherit'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviarNuevoMensaje(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={enviando || !nuevoMensaje.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: enviando ? '#ccc' : '#4c1d95',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: enviando ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              minWidth: '100px'
            }}
          >
            {enviando ? '📤...' : '📤 Enviar'}
          </button>
        </div>
      </form>
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
        const [mensajes, usuariosDocente] = await Promise.all([
          getMensajesPorUsuario(usuario.id),
          getUsuariosPorRol('docente').catch(() => [])
        ]);
        setDocentes(usuariosDocente || []);
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

  const filtrarDocentes = (lista) => _filtrarDocentes(lista, filtro, conversaciones);

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
    e.preventDefault();
    if (!nuevoMensaje.trim() || !contactoSeleccionado) {
      setMensaje('⚠️ Escribe un mensaje y selecciona un contacto');
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
      try {
        const mensajesActualizados = await getMensajesPorUsuario(usuario.id);
        await procesarConversaciones(mensajesActualizados);
      } catch {}
      setMensaje('✅ Mensaje enviado correctamente');
      setTimeout(() => setMensaje(''), 3000);
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
        subtitulo="Comunicación con docentes"
        derecha={
          <div style={{ fontSize: '0.9rem', textAlign: 'right', color: '#666' }}>
            <div><strong>{conversaciones.length}</strong> conversaciones</div>
          </div>
        }
      />

      {mensaje && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: mensaje.includes('✅') ? '#d4edda' : mensaje.includes('⚠️') ? '#fff3cd' : '#f8d7da',
          color: mensaje.includes('✅') ? '#155724' : mensaje.includes('⚠️') ? '#856404' : '#721c24',
          border: '1px solid',
          borderColor: mensaje.includes('✅') ? '#c3e6cb' : mensaje.includes('⚠️') ? '#ffeaa7' : '#f5c6cb',
          borderRadius: '6px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {mensaje}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '350px 1fr',
        gap: '1rem',
        height: '70vh'
      }}>
        <ContactosList
          filtro={filtro}
          setFiltro={setFiltro}
          docentesFiltrados={docentesFiltrados}
          contactoSeleccionado={contactoSeleccionado}
          abrirConversacion={abrirConversacion}
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
        />
      </div>

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
              <span style={{ fontSize: '1.75rem' }}>⚠️</span>
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
