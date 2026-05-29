import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCirculares, crearCircular, formatearFecha, formatearFechaHora } from '../../services/api';

export default function Circulares() {
  const queryClient = useQueryClient();

  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [circularSeleccionada, setCircularSeleccionada] = useState(null);

  // 1. Consulta reactiva de circulares
  const { data: circulares = [], isLoading: cargando } = useQuery({
    queryKey: ['circulares'],
    queryFn: async () => {
      const response = await getCirculares();
      // Si la API retorna un objeto que contiene una lista en .data o similar, resolverlo
      if (response && response.data) {
        return response.data;
      }
      return response || [];
    },
  });

  // 2. Mutación para crear circular
  const createMutation = useMutation({
    mutationFn: crearCircular,
    onSuccess: (respuesta) => {
      const exito = respuesta && (typeof respuesta.success !== 'undefined' ? respuesta.success : true);
      const mensaje = respuesta?.message || 'Circular publicada con éxito';
      
      if (exito) {
        setSuccessMsg(mensaje);
        setTitulo('');
        setContenido('');
        queryClient.invalidateQueries({ queryKey: ['circulares'] });
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(respuesta?.message || 'No se pudo publicar la circular.');
      }
    },
    onError: (error) => {
      setErrorMsg(error.message || 'Error en el servidor al publicar la circular.');
    }
  });

  const handlePublicar = (event) => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!titulo.trim() || !contenido.trim()) {
      setErrorMsg('Por favor completa tanto el título como el contenido de la circular.');
      return;
    }

    createMutation.mutate({
      titulo: titulo.trim(),
      contenido: contenido.trim()
    });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Banner / Page Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', // Degradado Indigo/Violeta Premium
        padding: '1.5rem 2rem',
        borderRadius: '16px',
        color: '#ffffff',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#ffffff', fontWeight: 700 }}>
            Gestión de Circulares
          </h1>
          <p style={{ margin: '5px 0 0', color: '#c7d2fe', fontSize: '0.9rem' }}>
            Redacta y publica circulares oficiales para mantener comunicados a todos los docentes de la institución.
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '68px',
          height: '68px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '14px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(4px)',
          flexShrink: 0,
          color: '#ffffff'
        }}>
          {/* Elegant megaphone SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{
          background: '#d1fae5',
          border: '1px solid #10b981',
          color: '#065f46',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontWeight: 500
        }}>
          ✅ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#991b1b',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontWeight: 500
        }}>
          ❌ {errorMsg}
        </div>
      )}

      {/* Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(300px, 1fr)',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Formulario (Izquierda) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '1.75rem',
          boxShadow: '0 18px 35px rgba(15, 23, 42, 0.04)'
        }}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.3rem', color: '#0f172a', fontWeight: 600 }}>
            Redactar Nueva Circular
          </h2>
          
          <form onSubmit={handlePublicar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.92rem', fontWeight: 600, color: '#334155' }}>
                Título de la Circular
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Suspensión de clases por jornada pedagógica"
                required
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  padding: '0.95rem 1rem',
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.92rem', fontWeight: 600, color: '#334155' }}>
                Contenido / Cuerpo de la Circular
              </label>
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder="Escribe el mensaje detallado aquí..."
                required
                rows={8}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  padding: '0.95rem 1rem',
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '150px',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                background: '#6366f1',
                color: '#ffffff',
                border: 'none',
                padding: '0.95rem 1.5rem',
                borderRadius: '12px',
                cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.15)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!createMutation.isPending) {
                  e.currentTarget.style.background = '#4f46e5';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(79, 70, 229, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                if (!createMutation.isPending) {
                  e.currentTarget.style.background = '#6366f1';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.15)';
                }
              }}
            >
              {createMutation.isPending ? (
                <>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Publicando...
                </>
              ) : (
                'Publicar Circular'
              )}
            </button>
          </form>
        </div>

        {/* Historial (Derecha) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '1.75rem',
          boxShadow: '0 18px 35px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '620px'
        }}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.3rem', color: '#0f172a', fontWeight: 600 }}>
            Historial de Publicaciones
          </h2>

          {cargando ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 0', color: '#64748b' }}>
              <div style={{
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #6366f1',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
              }}></div>
              <span>Cargando circulares...</span>
            </div>
          ) : circulares.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem 1rem',
              color: '#64748b',
              textAlign: 'center',
              border: '2px dashed #e2e8f0',
              borderRadius: '12px'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', color: '#475569' }}>Sin Circulares</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>No has publicado ninguna circular institucional todavía.</p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {circulares.map((circular) => (
                <div 
                  key={circular.id} 
                  onClick={() => setCircularSeleccionada(circular)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.85rem 1.1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6366f1';
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.02)';
                    e.currentTarget.style.transform = 'translateX(3px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <span style={{ 
                    fontWeight: 600, 
                    color: '#1e293b', 
                    fontSize: '0.925rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '70%'
                  }}>
                    {circular.titulo}
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                    background: 'rgba(99, 102, 241, 0.06)',
                    padding: '3px 9px',
                    borderRadius: '20px',
                    fontWeight: 600
                  }}>
                    {circular.fecha_publicacion ? formatearFecha(circular.fecha_publicacion) : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle de Circular (Administrador) */}
      {circularSeleccionada && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(6px)',
          padding: '1.5rem',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* Header del Modal */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              padding: '1.5rem 1.75rem',
              color: '#ffffff',
              position: 'relative'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, paddingRight: '2rem' }}>
                {circularSeleccionada.titulo}
              </h3>
              <p style={{ margin: '0.35rem 0 0', color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.82rem', fontWeight: 500 }}>
                Publicado por: {circularSeleccionada.autor_nombre} · {formatearFechaHora(circularSeleccionada.fecha_publicacion)}
              </p>
              <button 
                onClick={() => setCircularSeleccionada(null)}
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div style={{ padding: '1.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              <p style={{
                margin: 0,
                fontSize: '0.95rem',
                color: '#334155',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {circularSeleccionada.contenido}
              </p>
            </div>

            {/* Footer del Modal */}
            <div style={{
              padding: '1.25rem 1.75rem',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#f8fafc'
            }}>
              <button
                onClick={() => setCircularSeleccionada(null)}
                style={{
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1.5rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(99, 102, 241, 0.15)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#4f46e5'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#6366f1'}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Global CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
