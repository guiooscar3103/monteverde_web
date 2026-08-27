import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquarePlus } from 'lucide-react';

export default function ChatComposer({
  asunto,
  setAsunto,
  nuevoMensaje,
  setNuevoMensaje,
  onEnviar,
  enviando,
  isFirstMessage = false,
  placeholder = "Escribe un mensaje..."
}) {
  const textareaRef = useRef(null);

  // Auto-ajustar altura del textarea según el contenido escrito
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const newHeight = Math.min(Math.max(el.scrollHeight, 44), 130);
      el.style.height = `${newHeight}px`;
    }
  }, [nuevoMensaje]);

  const handleKeyDown = (e) => {
    // Enter sin Shift -> Enviar mensaje
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!enviando && nuevoMensaje.trim()) {
        onEnviar(e);
      }
    }
  };

  const puedeEnviar = !enviando && nuevoMensaje.trim().length > 0;

  return (
    <form
      onSubmit={onEnviar}
      style={{
        padding: '0.85rem 1.25rem',
        borderTop: '1px solid var(--border, #E2E8F0)',
        backgroundColor: '#FFFFFF',
        position: 'relative',
        zIndex: 4
      }}
    >
      {/* 1. Modo Primer Mensaje: Campo de Asunto Opcional y Sutil */}
      {isFirstMessage && (
        <div style={{ marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.25rem' }}>
            <MessageSquarePlus size={13} style={{ color: 'var(--color-primary-light, #166534)' }} />
            <label
              htmlFor="chat-asunto-input"
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-secondary, #475569)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px'
              }}
            >
              Asunto <span style={{ color: 'var(--text-muted, #64748B)', fontWeight: 400, textTransform: 'none' }}>(opcional)</span>
            </label>
          </div>
          <input
            id="chat-asunto-input"
            type="text"
            placeholder="Ej. Consulta sobre la tarea / Horario de clase..."
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            disabled={enviando}
            style={{
              width: '100%',
              padding: '0.5rem 0.85rem',
              border: '1px solid var(--border, #CBD5E1)',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontFamily: 'inherit',
              color: 'var(--text, #0F172A)',
              backgroundColor: '#F8FAFC',
              outline: 'none',
              transition: 'border-color 0.15s ease'
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary, #0A3A20)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border, #CBD5E1)')}
          />
        </div>
      )}

      {/* 2. Barra de Chat: Textarea Multilínea + Botón Enviar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.5rem',
          backgroundColor: '#F8FAFC',
          border: '1.5px solid var(--border, #E2E8F0)',
          borderRadius: '16px',
          padding: '0.35rem 0.5rem 0.35rem 0.85rem',
          transition: 'all 0.15s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
        onFocusCapture={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary, #0A3A20)';
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(10, 58, 32, 0.08)';
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.borderColor = 'var(--border, #E2E8F0)';
          e.currentTarget.style.backgroundColor = '#F8FAFC';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
        }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={placeholder}
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={enviando}
          aria-label="Escribe tu mensaje"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            resize: 'none',
            fontSize: '0.92rem',
            lineHeight: '1.45',
            color: 'var(--text, #0F172A)',
            fontFamily: 'inherit',
            padding: '0.4rem 0',
            minHeight: '38px',
            maxHeight: '130px',
            overflowY: 'auto'
          }}
        />

        {/* Botón de Envío con Icono y Feedback de Carga */}
        <button
          type="submit"
          disabled={!puedeEnviar}
          aria-label="Enviar mensaje"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: puedeEnviar ? 'var(--color-primary, #0A3A20)' : '#CBD5E1',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: puedeEnviar ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            boxShadow: puedeEnviar ? '0 2px 6px rgba(10, 58, 32, 0.25)' : 'none'
          }}
          title={puedeEnviar ? "Enviar mensaje (Enter)" : "Escribe un mensaje para enviar"}
        >
          {enviando ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            <Send size={17} style={{ marginLeft: '1px' }} />
          )}
        </button>
      </div>

      {/* Micro-texto de Ayuda / Accesibilidad */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.35rem',
          padding: '0 0.25rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted, #64748B)'
        }}
      >
        <span>
          Presiona <strong>Enter ↵</strong> para enviar · <strong>Shift + Enter</strong> para nueva línea
        </span>
        {isFirstMessage && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--color-primary-light, #166534)' }}>
            <Sparkles size={11} />
            <span>Primer mensaje</span>
          </span>
        )}
      </div>
    </form>
  );
}
