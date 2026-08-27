import React, { useEffect, useRef } from 'react';
import { MessageSquare, Clock, Undo2, Ban, Tag } from 'lucide-react';

export default function ChatMessageList({
  conversacion,
  usuarioActual,
  onRetractar,
  nombreContacto = 'este contacto',
  emptySubtext = '¡Envía tu primer mensaje a continuación!'
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll al fondo cada vez que cambia la conversación
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversacion]);

  if (!conversacion || conversacion.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
          backgroundColor: '#F8FAFC',
          textAlign: 'center',
          color: 'var(--text-muted, #64748B)'
        }}
      >
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: '#ECFDF5',
            color: 'var(--color-primary, #0A3A20)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.85rem'
          }}
        >
          <MessageSquare size={26} strokeWidth={2} />
        </div>
        <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text, #0F172A)', fontSize: '1rem', fontWeight: 700 }}>
          No hay mensajes aún con {nombreContacto}
        </h4>
        <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted, #64748B)' }}>
          {emptySubtext}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        padding: '1.25rem',
        overflowY: 'auto',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}
    >
      {conversacion.map((msg, index) => {
        const emisorId = msg.emisor_id ?? msg.emisorId;
        const esMio = emisorId == usuarioActual?.id;
        const estaEliminado = Boolean(msg.eliminado);
        const tieneAsunto = Boolean(
          msg.asunto &&
          msg.asunto.trim() &&
          msg.asunto !== 'Sin asunto' &&
          msg.asunto !== 'Consulta familiar' &&
          msg.asunto !== 'Consulta' &&
          msg.asunto !== 'Mensaje'
        );

        return (
          <div
            key={msg.id || index}
            style={{
              display: 'flex',
              justifyContent: esMio ? 'flex-end' : 'flex-start',
              width: '100%'
            }}
          >
            <div
              style={{
                maxWidth: '78%',
                minWidth: '160px',
                padding: '0.75rem 1rem',
                borderRadius: esMio ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                backgroundColor: estaEliminado
                  ? (esMio ? 'rgba(10, 58, 32, 0.05)' : '#F1F5F9')
                  : (esMio ? 'var(--color-primary, #0A3A20)' : '#FFFFFF'),
                color: estaEliminado
                  ? 'var(--text-muted, #64748B)'
                  : (esMio ? '#FFFFFF' : 'var(--text, #0F172A)'),
                boxShadow: estaEliminado ? 'none' : '0 2px 6px rgba(15, 23, 42, 0.05)',
                border: estaEliminado
                  ? '1px dashed #CBD5E1'
                  : (esMio ? 'none' : '1px solid var(--border, #E2E8F0)'),
                transition: 'all 0.15s ease',
                wordBreak: 'break-word'
              }}
            >
              {/* Asunto si es relevante */}
              {!estaEliminado && tieneAsunto && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginBottom: '0.35rem',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    backgroundColor: esMio ? 'rgba(255, 255, 255, 0.18)' : '#ECFDF5',
                    color: esMio ? '#FFFFFF' : 'var(--color-primary-light, #166534)'
                  }}
                >
                  <Tag size={11} />
                  <span>{msg.asunto}</span>
                </div>
              )}

              {/* Cuerpo del Mensaje */}
              <div
                style={{
                  fontSize: '0.92rem',
                  lineHeight: '1.45',
                  whiteSpace: 'pre-wrap',
                  fontStyle: estaEliminado ? 'italic' : 'normal',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px'
                }}
              >
                {estaEliminado ? (
                  <>
                    <Ban size={14} style={{ flexShrink: 0, marginTop: '3px' }} />
                    <span>Este mensaje fue eliminado por su remitente.</span>
                  </>
                ) : (
                  <span>{msg.cuerpo}</span>
                )}
              </div>

              {/* Pie del Mensaje: Hora y Acción Retractar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginTop: '0.35rem',
                  paddingTop: '0.2rem',
                  fontSize: '0.7rem',
                  opacity: estaEliminado ? 0.75 : (esMio ? 0.85 : 0.65)
                }}
              >
                {/* Botón Retractar para mensajes propios */}
                {esMio && !estaEliminado && onRetractar ? (
                  <button
                    type="button"
                    onClick={() => onRetractar(msg)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: esMio ? '#FEF08A' : '#EF4444',
                      fontSize: '0.7rem',
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
                    <Undo2 size={11} />
                    <span>Retractar</span>
                  </button>
                ) : (
                  <span></span>
                )}

                {/* Hora del Mensaje */}
                <span
                  style={{
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Clock size={10} />
                  <span>
                    {new Date(msg.fecha).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
