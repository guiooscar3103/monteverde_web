import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Pencil,
  Trash2,
  X,
  Send,
  FileText
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCirculares, crearCircular, actualizarCircular, eliminarCircular, formatearFecha, formatearFechaHora } from '../../services/api';

// Funciones helper
const _validarFormCircular = (titulo, contenido) => {
  return titulo.trim() && contenido.trim();
};

const _crearPayloadCircular = (titulo, contenido) => ({
  titulo: titulo.trim(),
  contenido: contenido.trim()
});

const _parseCircularResponse = (respuesta, defaultMessage = 'Circular publicada con éxito') => {
  const exito = respuesta && (typeof respuesta.success !== 'undefined' ? respuesta.success : true);
  const mensaje = respuesta?.message || defaultMessage;
  return { exito, mensaje };
};

export default function Circulares() {
  const queryClient = useQueryClient();

  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [circularSeleccionada, setCircularSeleccionada] = useState(null);
  const [editandoId, setEditandoId] = useState(null);

  // 1. Consulta reactiva de circulares
  const { data: circulares = [], isLoading: cargando } = useQuery({
    queryKey: ['circulares'],
    queryFn: async () => {
      const response = await getCirculares();
      return response?.data || response || [];
    },
  });

  // 2. Mutación para crear circular
  const createMutation = useMutation({
    mutationFn: crearCircular,
    onSuccess: (respuesta) => {
      const { exito, mensaje } = _parseCircularResponse(respuesta);
      
      if (exito) {
        setSuccessMsg(mensaje);
        setTitulo('');
        setContenido('');
        queryClient.invalidateQueries({ queryKey: ['circulares'] });
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(mensaje);
      }
    },
    onError: (error) => {
      setErrorMsg(error.message || 'Error en el servidor al publicar la circular.');
    }
  });

  // Mutación para editar circular
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => actualizarCircular(id, payload),
    onSuccess: (respuesta) => {
      const { exito, mensaje } = _parseCircularResponse(respuesta, 'Circular actualizada con éxito');
      if (exito) {
        setSuccessMsg(mensaje);
        setTitulo('');
        setContenido('');
        setEditandoId(null);
        queryClient.invalidateQueries({ queryKey: ['circulares'] });
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(mensaje);
      }
    },
    onError: (error) => {
      setErrorMsg(error.message || 'Error en el servidor al actualizar la circular.');
    }
  });

  // Mutación para eliminar circular
  const deleteMutation = useMutation({
    mutationFn: eliminarCircular,
    onSuccess: (respuesta) => {
      const { exito, mensaje } = _parseCircularResponse(respuesta, 'Circular eliminada con éxito');
      if (exito) {
        setSuccessMsg(mensaje);
        setCircularSeleccionada(null);
        queryClient.invalidateQueries({ queryKey: ['circulares'] });
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(mensaje);
      }
    },
    onError: (error) => {
      setErrorMsg(error.message || 'Error en el servidor al eliminar la circular.');
    }
  });

  const handleGuardar = (event) => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!_validarFormCircular(titulo, contenido)) {
      setErrorMsg('Por favor completa tanto el título como el contenido de la circular.');
      return;
    }

    const payload = _crearPayloadCircular(titulo, contenido);

    if (editandoId) {
      updateMutation.mutate({ id: editandoId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleCancelarEdicion = () => {
    setTitulo('');
    setContenido('');
    setEditandoId(null);
    setErrorMsg('');
  };

  const iniciarEdicion = (circular) => {
    setEditandoId(circular.id);
    setTitulo(circular.titulo);
    setContenido(circular.contenido);
    setCircularSeleccionada(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminar = (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta circular?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Banner / Page Header con Identidad MonteVerde */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, var(--color-primary, #0A3A20) 0%, var(--color-primary-light, #166534) 100%)',
        padding: '1.5rem 2rem',
        borderRadius: '16px',
        color: '#ffffff',
        boxShadow: '0 10px 15px -3px rgba(10, 58, 32, 0.15)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#ffffff', fontWeight: 700 }}>
            Gestión de Circulares
          </h1>
          <p style={{ margin: '5px 0 0', color: '#ECFDF5', fontSize: '0.9rem', opacity: 0.95 }}>
            Redacta y publica circulares oficiales para mantener comunicados a todos los docentes y familias de la institución.
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          background: 'rgba(255, 255, 255, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '14px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(4px)',
          flexShrink: 0,
          color: '#ffffff'
        }}>
          <Megaphone size={30} strokeWidth={2} />
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{
          background: '#d1fae5',
          border: '1px solid #10b981',
          color: '#065f46',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#991b1b',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
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
          background: 'var(--bg-white, #ffffff)',
          borderRadius: '18px',
          border: '1px solid var(--border, #e2e8f0)',
          padding: '1.75rem',
          boxShadow: '0 18px 35px rgba(15, 23, 42, 0.04)'
        }}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.3rem', color: 'var(--text, #0f172a)', fontWeight: 700 }}>
            {editandoId ? 'Editar Circular' : 'Redactar Nueva Circular'}
          </h2>
          
          <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary, #334155)' }}>
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
                  border: '1px solid var(--border, #cbd5e1)',
                  padding: '0.95rem 1rem',
                  fontSize: '0.95rem',
                  color: 'var(--text, #0f172a)',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary, #0A3A20)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(10, 58, 32, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border, #cbd5e1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary, #334155)' }}>
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
                  border: '1px solid var(--border, #cbd5e1)',
                  padding: '0.95rem 1rem',
                  fontSize: '0.95rem',
                  color: 'var(--text, #0f172a)',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '150px',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary, #0A3A20)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(10, 58, 32, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border, #cbd5e1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{
                  flexGrow: 1,
                  background: 'var(--color-primary, #0A3A20)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.95rem 1.5rem',
                  borderRadius: '12px',
                  cursor: (createMutation.isPending || updateMutation.isPending) ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: '0 6px 16px rgba(10, 58, 32, 0.2)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!createMutation.isPending && !updateMutation.isPending) {
                    e.currentTarget.style.background = 'var(--color-primary-light, #166534)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(10, 58, 32, 0.28)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!createMutation.isPending && !updateMutation.isPending) {
                    e.currentTarget.style.background = 'var(--color-primary, #0A3A20)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(10, 58, 32, 0.2)';
                  }
                }}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid #ffffff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    {editandoId ? 'Guardando...' : 'Publicando...'}
                  </>
                ) : (
                  editandoId ? 'Guardar Cambios' : 'Publicar Circular'
                )}
              </button>

              {editandoId && (
                <button
                  type="button"
                  onClick={handleCancelarEdicion}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '0.95rem 1.5rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e2e8f0';
                    e.currentTarget.style.color = '#334155';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#475569';
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Historial (Derecha) */}
        <div style={{
          background: 'var(--bg-white, #ffffff)',
          borderRadius: '18px',
          border: '1px solid var(--border, #e2e8f0)',
          padding: '1.75rem',
          boxShadow: '0 18px 35px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '620px'
        }}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.3rem', color: 'var(--text, #0f172a)', fontWeight: 700 }}>
            Historial de Publicaciones
          </h2>

          {cargando ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 0', color: 'var(--text-muted, #64748b)' }}>
              <div style={{
                border: '3px solid #f3f3f3',
                borderTop: '3px solid var(--color-primary, #0A3A20)',
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
              border: '2px dashed var(--border, #e2e8f0)',
              borderRadius: '12px'
            }}>
              <FileText size={44} strokeWidth={1.5} style={{ color: '#cbd5e1', marginBottom: '0.75rem' }} />
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
                    border: '1px solid var(--border, #e2e8f0)',
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
                    e.currentTarget.style.borderColor = 'var(--color-primary, #0A3A20)';
                    e.currentTarget.style.background = '#ECFDF5';
                    e.currentTarget.style.transform = 'translateX(3px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border, #e2e8f0)';
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <span style={{ 
                    fontWeight: 600, 
                    color: 'var(--text, #1e293b)', 
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
                    color: 'var(--color-primary-light, #166534)',
                    whiteSpace: 'nowrap',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '3px 9px',
                    borderRadius: '20px',
                    fontWeight: 700
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
          background: 'rgba(15, 23, 42, 0.45)',
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
            boxShadow: '0 25px 50px -12px rgba(10, 58, 32, 0.2)',
            border: '1px solid var(--border, #e2e8f0)',
            overflow: 'hidden'
          }}>
            {/* Header del Modal con Verde Institucional */}
            <div style={{
              background: 'linear-gradient(135deg, var(--color-primary, #0A3A20) 0%, var(--color-primary-light, #166534) 100%)',
              padding: '1.5rem 1.75rem',
              color: '#ffffff',
              position: 'relative'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, paddingRight: '2rem' }}>
                {circularSeleccionada.titulo}
              </h3>
              <p style={{ margin: '0.35rem 0 0', color: '#ECFDF5', fontSize: '0.82rem', fontWeight: 500, opacity: 0.95 }}>
                Publicado por: {circularSeleccionada.autor_nombre} · {formatearFechaHora(circularSeleccionada.fecha_publicacion)}
              </p>
              <button 
                onClick={() => setCircularSeleccionada(null)}
                aria-label="Cerrar modal"
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div style={{ padding: '1.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              <p style={{
                margin: 0,
                fontSize: '0.95rem',
                color: 'var(--text-secondary, #334155)',
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
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => iniciarEdicion(circularSeleccionada)}
                  style={{
                    background: '#e2e8f0',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '0.55rem 1.25rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#cbd5e1'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#e2e8f0'}
                >
                  <Pencil size={14} />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleEliminar(circularSeleccionada.id)}
                  style={{
                    background: '#fee2e2',
                    color: '#991b1b',
                    border: '1px solid #f87171',
                    padding: '0.55rem 1.25rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fca5a5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                >
                  <Trash2 size={14} />
                  <span>Eliminar</span>
                </button>
              </div>

              <button
                onClick={() => setCircularSeleccionada(null)}
                style={{
                  background: 'var(--color-primary, #0A3A20)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.35rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(10, 58, 32, 0.2)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-light, #166534)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-primary, #0A3A20)'}
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
