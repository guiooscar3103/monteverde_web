import React, { useEffect } from 'react';
import { X, User, Mail, BookOpen, GraduationCap, Clock, ShieldCheck } from 'lucide-react';
import { getInitials } from './ChatHeader';

export default function DocentePerfilModal({ docente, isOpen, onClose }) {
  // Manejo de la tecla Escape para accesibilidad
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !docente) return null;

  const iniciales = getInitials(docente.nombre);
  const materias = docente.materias && docente.materias.length > 0
    ? docente.materias
    : (docente.materia_principal ? [docente.materia_principal] : []);

  const cursos = docente.cursos && docente.cursos.length > 0
    ? docente.cursos
    : (docente.curso_principal ? [docente.curso_principal] : []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border, #E2E8F0)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-perfil-docente-title"
      >
        {/* Cabecera del Modal */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} style={{ color: 'var(--color-primary, #0A3A20)' }} />
            <h3
              id="modal-perfil-docente-title"
              style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text, #0F172A)'
              }}
            >
              Perfil del Docente
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de perfil"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748B)',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E2E8F0';
              e.currentTarget.style.color = '#0F172A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted, #64748B)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido Principal */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Tarjeta de Identidad */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary, #0A3A20)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.35rem',
                boxShadow: '0 4px 12px rgba(10, 58, 32, 0.2)',
                border: '3px solid #ECFDF5',
                flexShrink: 0
              }}
            >
              {iniciales}
            </div>

            <div>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text, #0F172A)' }}>
                {docente.nombre}
              </h4>
              <div
                style={{
                  margin: '0.25rem 0 0 0',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary, #475569)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Mail size={13} style={{ color: 'var(--text-muted, #64748B)' }} />
                <span>{docente.email}</span>
              </div>
              <div style={{ marginTop: '0.35rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#ECFDF5',
                    color: 'var(--color-primary-light, #166534)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}
                >
                  <ShieldCheck size={12} />
                  <span>Docente Institucional</span>
                </span>
              </div>
            </div>
          </div>

          {/* Materias y Cursos Asignados */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              padding: '1rem 1.15rem',
              border: '1px solid var(--border, #E2E8F0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            {/* Materias */}
            <div>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-muted, #64748B)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '0.4rem'
                }}
              >
                <BookOpen size={13} />
                <span>Materias a cargo</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {materias.length > 0 ? (
                  materias.map((m, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--border, #E2E8F0)',
                        color: 'var(--text, #0F172A)',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}
                    >
                      {m}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748B)', fontStyle: 'italic' }}>
                    Asignación general MonteVerde
                  </span>
                )}
              </div>
            </div>

            {/* Cursos */}
            <div>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-muted, #64748B)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '0.4rem'
                }}
              >
                <GraduationCap size={13} />
                <span>Cursos asignados</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {cursos.length > 0 ? (
                  cursos.map((c, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--border, #E2E8F0)',
                        color: 'var(--text, #0F172A)',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748B)', fontStyle: 'italic' }}>
                    Cursos institucionales
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Horario de Atención y Canales */}
          <div
            style={{
              padding: '0.9rem 1rem',
              backgroundColor: '#EFF6FF',
              borderRadius: '10px',
              border: '1px solid #BFDBFE',
              display: 'flex',
              gap: '0.75rem'
            }}
          >
            <Clock size={18} style={{ color: '#1D4ED8', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1E40AF', marginBottom: '0.2rem' }}>
                Atención y Consultas
              </div>
              <div style={{ fontSize: '0.8rem', color: '#1E3A8A', lineHeight: '1.4' }}>
                Puedes enviar tus consultas en cualquier momento por esta mensajería. La atención presencial o virtual se coordina mediante cita previa institucional.
              </div>
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid var(--border, #E2E8F0)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#F8FAFC'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid var(--border, #CBD5E1)',
              background: '#FFFFFF',
              color: 'var(--text, #0F172A)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
