import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import BarraTitulo from '../../components/BarraTitulo';
import Card from '../../components/Card';
import BlurFade from '../../components/BlurFade';
import { 
  getMensajesPorUsuario, 
  getConversacion, 
  enviarMensaje, 
  marcarComoLeido,
  getUsuariosPorRol,
  getUsuarioPorId 
} from '../../services/api';

export default function MensajesDocente() {
  const { usuario } = useAuth();
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActual, setConversacionActual] = useState([]);
  const [contactoSeleccionado, setContactoSeleccionado] = useState(null);
  const [familias, setFamilias] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [asunto, setAsunto] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [filtro, setFiltro] = useState('');

  // Cargar conversaciones y familias
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [mensajes, usuariosFamilia] = await Promise.all([
          getMensajesPorUsuario(usuario.id),
          getUsuariosPorRol('familia')
        ]);
        setFamilias(usuariosFamilia);
        await procesarConversaciones(mensajes);
      } catch (error) {
        setMensaje('❌ Error al cargar mensajes: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    if (usuario) cargarDatos();
  }, [usuario]);

  const procesarConversaciones = async (mensajes) => {
    const conversacionesMap = {};
    for (const mensaje of mensajes) {
      const contactoId = mensaje.emisorId == usuario.id ? mensaje.receptorId : mensaje.emisorId;
      if (!conversacionesMap[contactoId]) {
        try {
          const contacto = await getUsuarioPorId(contactoId);
          conversacionesMap[contactoId] = {
            contacto,
            ultimoMensaje: mensaje,
            noLeidos: 0
          };
        } catch {
          continue;
        }
      }
      if (mensaje.receptorId == usuario.id && !mensaje.leido) {
        conversacionesMap[contactoId].noLeidos++;
      }
      if (!conversacionesMap[contactoId].ultimoMensaje || 
          new Date(mensaje.fecha) > new Date(conversacionesMap[contactoId].ultimoMensaje.fecha)) {
        conversacionesMap[contactoId].ultimoMensaje = mensaje;
      }
    }
    setConversaciones(Object.values(conversacionesMap).sort((a, b) => 
      new Date(b.ultimoMensaje.fecha) - new Date(a.ultimoMensaje.fecha)
    ));
  };

  // Filtro de contactos por nombre/asunto/cuerpo
  const filtrarContactos = (lista) => {
    if (!filtro.trim()) return lista;
    const filtroLower = filtro.trim().toLowerCase();
    return lista.filter(familia => {
      // Buscar por nombre y email
      if (
        (familia.nombre && familia.nombre.toLowerCase().includes(filtroLower)) ||
        (familia.email && familia.email.toLowerCase().includes(filtroLower))
      ) return true;
      // Buscar por mensaje más reciente
      const conv = conversaciones.find(c => c.contacto.id === familia.id);
      if (conv && (
        (conv.ultimoMensaje?.asunto && conv.ultimoMensaje.asunto.toLowerCase().includes(filtroLower)) ||
        (conv.ultimoMensaje?.cuerpo && conv.ultimoMensaje.cuerpo.toLowerCase().includes(filtroLower))
      )) return true;
      return false;
    });
  };

  const abrirConversacion = async (contacto) => {
    setContactoSeleccionado(contacto);
    setAsunto('');
    try {
      const mensajes = await getConversacion(usuario.id, contacto.id);
      setConversacionActual(mensajes);
      // Marcar como leídos
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

  const enviarNuevoMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !contactoSeleccionado) return;
    setEnviando(true);
    setMensaje('');
    try {
      const mensajeData = {
        emisorId: usuario.id,
        receptorId: contactoSeleccionado.id,
        asunto: asunto || 'Mensaje del docente',
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

  // Contactos filtrados
  const familiasFiltradas = filtrarContactos(familias);

  return (
    <div className="grid">
      <BlurFade delay={0.05} duration={0.3}>
        <BarraTitulo 
          titulo="Mensajes" 
          subtitulo="Comunicación con familias"
          derecha={
            <div style={{ fontSize: '0.9rem', textAlign: 'right', color: '#666' }}>
              <div><strong>{conversaciones.length}</strong> conversaciones</div>
            </div>
          }
        />
      </BlurFade>

      {/* Mensajes de estado */}
      {mensaje && (
        <BlurFade delay={0.08} duration={0.25}>
          <div style={{ 
            padding: '0.75rem 1rem',
            backgroundColor: mensaje.includes('✅') ? '#d4edda' : '#f8d7da',
            color: mensaje.includes('✅') ? '#155724' : '#721c24',
            border: '1px solid',
            borderColor: mensaje.includes('✅') ? '#c3e6cb' : '#f5c6cb',
            borderRadius: '6px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {mensaje}
          </div>
        </BlurFade>
      )}
      
      <BlurFade delay={0.12} duration={0.4}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '350px 1fr', 
          gap: '1rem', 
          height: '70vh'
        }}>
          {/* Lista de contactos con filtro */}
          <Card title="Contactos" style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                placeholder="🔍 Buscar familia, asunto o mensaje"
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
              {familiasFiltradas.length === 0 && (
                <div style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>No hay coincidencias.</div>
              )}
              {familiasFiltradas.map(familia => (
                <div
                  key={`nuevo-${familia.id}`}
                  onClick={() => abrirConversacion(familia)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '0.5rem',
                    backgroundColor: contactoSeleccionado?.id === familia.id ? '#e3f2fd' : '#f9f9f9',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                    👨‍👩‍👧‍👦 {familia.nombre}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                    {familia.email}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          {/* Área de conversación */}
          <Card style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {contactoSeleccionado ? (
              <>
                {/* Header de la conversación */}
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
                      💭 No hay mensajes aún. ¡Envía el primero!
                    </div>
                  ) : (
                    conversacionActual.map(mensajeItem => (
                      <div
                        key={mensajeItem.id}
                        style={{
                          marginBottom: '1rem',
                          display: 'flex',
                          justifyContent: mensajeItem.emisorId == usuario.id ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '75%',
                            padding: '1rem',
                            borderRadius: '16px',
                            backgroundColor: mensajeItem.emisorId == usuario.id ? '#2196f3' : '#ffffff',
                            color: mensajeItem.emisorId == usuario.id ? 'white' : 'black',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            border: mensajeItem.emisorId != usuario.id ? '1px solid #e0e0e0' : 'none'
                          }}
                        >
                          <div style={{ 
                            fontWeight: 'bold', 
                            fontSize: '0.85rem', 
                            marginBottom: '0.5rem',
                            opacity: 0.9
                          }}>
                            📧 {mensajeItem.asunto}
                          </div>
                          <div style={{ 
                            fontSize: '0.95rem', 
                            lineHeight: '1.4',
                            marginBottom: '0.5rem'
                          }}>
                            {mensajeItem.cuerpo}
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            opacity: 0.7,
                            textAlign: 'right'
                          }}>
                            🕐 {new Date(mensajeItem.fecha).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Formulario de envío */}
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
                    placeholder="📧 Asunto del mensaje"
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
                      placeholder="✍️ Escribe tu mensaje aquí..."
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
                        backgroundColor: enviando ? '#ccc' : 'var(--brand)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: enviando ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        minWidth: '100px'
                      }}
                    >
                      {enviando ? '📤 Enviando...' : '📤 Enviar'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#666',
                textAlign: 'center',
                flexDirection: 'column'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  <strong>Selecciona una familia para comenzar</strong>
                </p>
                <p style={{ fontSize: '0.9rem', color: '#999' }}>
                  Haz clic en cualquier contacto de la izquierda para iniciar una conversación
                </p>
              </div>
            )}
          </Card>
        </div>
      </BlurFade>
    </div>
  );
}
