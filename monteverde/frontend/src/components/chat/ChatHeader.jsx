import React from 'react';
import { User, Archive, ArchiveRestore, BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';

/**
 * Genera iniciales a partir de un nombre.
 * Ej: "Carlos Rodríguez" -> "CR"
 */
export function getInitials(nombre) {
  if (!nombre) return 'U';
  const parts = nombre.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * ChatHeader - Encabezado contextual moderno del chat institucional MonteVerde
 */
export default function ChatHeader({
  contacto,
  esArchivada = false,
  onVerPerfil,
  onArchivar,
  onDesarchivar,
  estudianteContexto = null,
  esDocenteViewer = false
}) {
  if (!contacto) return null;

  // Determinar línea de contexto académico
  let contextoAcademico = '';
  if (!esDocenteViewer) {
    // Vista Familia: Contacto es un Docente
    const materia = contacto.materia_principal || (contacto.materias && contacto.materias[0]);
    const curso = contacto.curso_principal || (contacto.cursos && contacto.cursos[0]);
    if (materia && curso) {
      contextoAcademico = `${materia} · ${curso}`;
    } else if (materia) {
      contextoAcademico = materia;
    } else if (curso) {
      contextoAcademico = `Curso ${curso}`;
    } else {
      contextoAcademico = 'Docente MonteVerde';
    }
  } else {
    // Vista Docente: Contacto es una Familia
    if (estudianteContexto) {
      contextoAcademico = `Acudiente de ${estudianteContexto.nombre}`;
    } else if (contacto.estudiantes && contacto.estudiantes.length > 0) {
      const nombresEst = contacto.estudiantes.map(e => e.nombre).join(', ');
      contextoAcademico = `Acudiente de ${nombresEst}`;
    } else {
      contextoAcademico = 'Familia MonteVerde';
    }
  }

  const iniciales = getInitials(contacto.nombre);

  return (
    <div
      style={{
        padding: '0.85rem 1.25rem',
        borderBottom: '1px solid var(--border, #E2E8F0)',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        flexWrap: 'wrap',
        minHeight: '68px',
        zIndex: 5
      }}
    >
      {/* Información del Docente / Contacto */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: '200px', flex: '1 1 auto' }}>
        {/* Avatar institucional */}
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary, #0A3A20)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.95rem',
            letterSpacing: '0.5px',
            boxShadow: '0 2px 6px rgba(10, 58, 32, 0.2)',
            flexShrink: 0,
            border: '2px solid #ECFDF5'
          }}
          aria-hidden="true"
        >
          {iniciales}
        </div>

        {/* Textos y Jerarquía */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <h3
              style={{
                margin: 0,
                color: 'var(--text, #0F172A)',
                fontSize: '1.02rem',
                fontWeight: 700,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={contacto.nombre}
            >
              {contacto.nombre}
            </h3>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                backgroundColor: '#ECFDF5',
                color: 'var(--color-primary-light, #166534)',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '6px',
                textTransform: 'capitalize'
              }}
            >
              <ShieldCheck size={11} />
              <span>{contacto.rol === 'docente' ? 'Docente' : 'Familia'}</span>
            </span>
          </div>

          <div
            style={{
              margin: '0.2rem 0 0 0',
              fontSize: '0.82rem',
              color: 'var(--text-muted, #64748B)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {contacto.rol === 'docente' ? (
              <BookOpen size={13} style={{ color: 'var(--color-primary-light, #166534)', flexShrink: 0 }} />
            ) : (
              <GraduationCap size={13} style={{ color: 'var(--color-primary-light, #166534)', flexShrink: 0 }} />
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{contextoAcademico}</span>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {/* Ver perfil (Especialmente relevante para Docentes) */}
        {onVerPerfil && (
          <button
            type="button"
            onClick={onVerPerfil}
            aria-label="Ver perfil del docente"
            style={{
              padding: '0.45rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid var(--border, #CBD5E1)',
              background: '#FFFFFF',
              color: 'var(--text-secondary, #475569)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-primary, #0A3A20)';
              e.currentTarget.style.color = 'var(--color-primary, #0A3A20)';
              e.currentTarget.style.background = '#F8FAFC';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border, #CBD5E1)';
              e.currentTarget.style.color = 'var(--text-secondary, #475569)';
              e.currentTarget.style.background = '#FFFFFF';
            }}
          >
            <User size={14} />
            <span>Perfil</span>
          </button>
        )}

        {/* Archivar / Desarchivar */}
        {esArchivada ? (
          <button
            type="button"
            onClick={() => onDesarchivar && onDesarchivar(contacto.id)}
            aria-label="Desarchivar conversación"
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--color-primary, #0A3A20)',
              background: '#ECFDF5',
              color: 'var(--color-primary, #0A3A20)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            title="Desarchivar conversación"
          >
            <ArchiveRestore size={14} />
            <span>Desarchivar</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onArchivar && onArchivar(contacto.id)}
            aria-label="Archivar conversación"
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border, #CBD5E1)',
              background: '#FFFFFF',
              color: 'var(--text-muted, #64748B)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-primary, #0A3A20)';
              e.currentTarget.style.color = 'var(--color-primary, #0A3A20)';
              e.currentTarget.style.background = '#F8FAFC';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border, #CBD5E1)';
              e.currentTarget.style.color = 'var(--text-muted, #64748B)';
              e.currentTarget.style.background = '#FFFFFF';
            }}
            title="Archivar conversación"
          >
            <Archive size={14} />
            <span>Archivar</span>
          </button>
        )}
      </div>
    </div>
  );
}
