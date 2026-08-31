import React, { useState } from 'react';
import {
  ChevronRight,
  Sparkles,
  MessageSquare,
  Search,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { getInitials, ACCIONES_RAPIDAS } from './chatUtils';

export default function ChatEmptyState({
  docentes = [],
  contactoSeleccionado = null,
  onAplicarPlantilla,

  onSeleccionarDocente
}) {
  const [pasoDocente, setPasoDocente] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState(null);
  const [busquedaDocente, setBusquedaDocente] = useState('');

  // 1. Caso: No hay docentes disponibles
  if (!docentes || docentes.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: '#F8FAFC'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#F1F5F9',
            color: 'var(--text-muted, #64748B)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}
        >
          <MessageSquare size={30} strokeWidth={1.75} />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text, #0F172A)', margin: '0 0 0.5rem 0' }}>
          No hay docentes disponibles
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748B)', maxWidth: '360px', margin: 0, lineHeight: 1.5 }}>
          Actualmente no tienes contactos docentes vinculados a los cursos de tus hijos para iniciar una conversación.
        </p>
      </div>
    );
  }

  // Manejo al hacer clic en una acción rápida
  const handleClicAccion = (accion) => {
    if (contactoSeleccionado) {
      // Ya hay un docente seleccionado en la conversación activa
      onAplicarPlantilla({
        asunto: accion.asunto,
        texto: accion.texto,
        docente: contactoSeleccionado
      });
    } else if (docentes.length === 1) {
      // Solo hay 1 docente disponible, se asigna directamente
      onAplicarPlantilla({
        asunto: accion.asunto,
        texto: accion.texto,
        docente: docentes[0]
      });
    } else {
      // Hay múltiples docentes y ninguno seleccionado: mostrar selector contextual
      setAccionPendiente(accion);
      setPasoDocente(true);
    }
  };

  const handleElegirDocente = (docente) => {
    if (accionPendiente) {
      onAplicarPlantilla({
        asunto: accionPendiente.asunto,
        texto: accionPendiente.texto,
        docente
      });
      setPasoDocente(false);
      setAccionPendiente(null);
    } else if (onSeleccionarDocente) {
      onSeleccionarDocente(docente);
    }
  };

  // Filtrado de docentes si está en modo selección
  const docentesFiltrados = docentes.filter(d => {
    if (!busquedaDocente.trim()) return true;
    const q = busquedaDocente.toLowerCase();
    const nombreMatch = d.nombre?.toLowerCase().includes(q);
    const materiaMatch = d.materias?.some(m => m.toLowerCase().includes(q)) || d.materia_principal?.toLowerCase().includes(q);
    const cursoMatch = d.cursos?.some(c => c.toLowerCase().includes(q)) || d.curso_principal?.toLowerCase().includes(q);
    return nombreMatch || materiaMatch || cursoMatch;
  });

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
        overflowY: 'auto'
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Cabecera del Empty State */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#ECFDF5',
            color: 'var(--color-primary, #0A3A20)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 4px 12px rgba(10, 58, 32, 0.08)'
          }}
        >
          <Sparkles size={28} strokeWidth={2} />
        </div>

        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--text, #0F172A)',
            margin: '0 0 0.4rem 0',
            textAlign: 'center',
            letterSpacing: '-0.02em'
          }}
        >
          {contactoSeleccionado 
            ? `Inicia una conversación con ${contactoSeleccionado.nombre}`
            : 'No tienes conversaciones todavía'}
        </h3>

        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--text-muted, #64748B)',
            textAlign: 'center',
            margin: '0 0 1.5rem 0',
            lineHeight: 1.45,
            maxWidth: '380px'
          }}
        >
          {pasoDocente
            ? `Selecciona el docente destinatario para: "${accionPendiente?.titulo}"`
            : contactoSeleccionado
              ? 'Elige una de las consultas frecuentes para precargar el mensaje o escribe directamente abajo.'
              : '¿Necesitas comunicarte con un docente? Selecciona un motivo frecuente para comenzar:'}
        </p>

        {/* Vista: Selección de Docente (cuando hay varios y ninguno seleccionado) */}
        {pasoDocente ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
              <button
                type="button"
                onClick={() => { setPasoDocente(false); setAccionPendiente(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary, #0A3A20)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}
              >
                <ArrowLeft size={14} />
                <span>Volver a opciones</span>
              </button>
            </div>

            {/* Buscador de docentes */}
            {docentes.length > 3 && (
              <div style={{ position: 'relative', width: '100%', marginBottom: '0.25rem' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Buscar docente o materia..."
                  value={busquedaDocente}
                  onChange={(e) => setBusquedaDocente(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #E2E8F0)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
              {docentesFiltrados.map((docente) => {
                const materiaDesc = docente.materia_principal || (docente.materias && docente.materias[0]);
                const cursoDesc = docente.curso_principal || (docente.cursos && docente.cursos[0]);
                const tagInfo = materiaDesc && cursoDesc ? `${materiaDesc} · ${cursoDesc}` : materiaDesc || (cursoDesc ? `Curso ${cursoDesc}` : 'Docente');

                return (
                  <button
                    key={docente.id}
                    type="button"
                    onClick={() => handleElegirDocente(docente)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: '#FFFFFF',
                      border: '1px solid var(--border, #E2E8F0)',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary, #0A3A20)';
                      e.currentTarget.style.background = '#ECFDF5';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border, #E2E8F0)';
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary, #0A3A20)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        flexShrink: 0
                      }}
                    >
                      {getInitials(docente.nombre)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text, #0F172A)' }}>
                        {docente.nombre}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-light, #166534)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <BookOpen size={11} />
                        <span>{tagInfo}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--color-primary, #0A3A20)', flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Vista: Tarjetas de Acciones Rápidas */
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {ACCIONES_RAPIDAS.map((accion) => {
              const IconComponent = accion.icono;

              return (
                <button
                  key={accion.id}
                  type="button"
                  onClick={() => handleClicAccion(accion)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: '#FFFFFF',
                    border: '1px solid var(--border, #E2E8F0)',
                    borderRadius: '14px',
                    padding: '0.85rem 1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 5px rgba(15, 23, 42, 0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary, #0A3A20)';
                    e.currentTarget.style.background = '#ECFDF5';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(10, 58, 32, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border, #E2E8F0)';
                    e.currentTarget.style.background = '#FFFFFF';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 5px rgba(15, 23, 42, 0.03)';
                  }}
                >
                  {/* Icono temático con contenedor en verde suave */}
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      color: 'var(--color-primary, #0A3A20)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <IconComponent size={20} strokeWidth={2} />
                  </div>

                  {/* Textos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        color: 'var(--text, #0F172A)',
                        marginBottom: '2px',
                        lineHeight: 1.3
                      }}
                    >
                      {accion.titulo}
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted, #64748B)',
                        lineHeight: 1.35
                      }}
                    >
                      {accion.descripcion}
                    </div>
                  </div>

                  {/* Indicador de acción */}
                  <div
                    style={{
                      color: 'var(--color-primary, #0A3A20)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <ChevronRight size={18} strokeWidth={2.2} />
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
