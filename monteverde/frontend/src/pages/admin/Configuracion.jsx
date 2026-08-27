import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Calendar,
  Phone,
  Save,
  Database,
  CheckCircle2,
  AlertCircle,
  RotateCw
} from 'lucide-react';
import { getConfiguracion, guardarConfiguracion } from '../../services/api';

// Funciones helper
const _extraerConfiguracionDelResponse = (res) => {
  if (res?.data) return res.data;
  if (res) return res;
  return {};
};

export default function Configuracion() {
  const [config, setConfig] = useState({
    nombre_institucion: '',
    director: '',
    anio_escolar: '',
    periodo_actual: '',
    direccion: '',
    telefono: '',
    email_contacto: '',
    updated_at: null,
    institucion_id: 'MONTEVERDE_DEFAULT'
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const res = await getConfiguracion();
      const datos = _extraerConfiguracionDelResponse(res);
      if (datos && Object.keys(datos).length > 0) {
        setConfig(prev => ({
          ...prev,
          ...datos
        }));
      }
    } catch (error) {
      console.error('Error al obtener la configuración:', error);
      setErrorMsg(error.message || 'No se pudo cargar la configuración institucional desde la base de datos.');
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setSuccessMsg('');
    setErrorMsg('');
    
    try {
      const res = await guardarConfiguracion(config);
      const datosActualizados = _extraerConfiguracionDelResponse(res);
      
      if (datosActualizados && Object.keys(datosActualizados).length > 0) {
        setConfig(prev => ({
          ...prev,
          ...datosActualizados
        }));
      }

      setSuccessMsg('Configuración institucional guardada y persistida en base de datos exitosamente.');
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (error) {
      console.error('Error al guardar:', error);
      setErrorMsg(error.message || 'Ocurrió un error al persistir los ajustes institucionales.');
    } finally {
      setGuardando(false);
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return null;
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return fechaStr;
    }
  };

  if (cargando) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'var(--text-muted, #64748b)' }}>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid var(--color-primary, #0A3A20)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}></div>
        <span>Cargando configuración institucional desde la base de datos...</span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Banner de cabecera de la página con Identidad MonteVerde */}
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
            Configuración del Sistema
          </h1>
          <p style={{ margin: '5px 0 0', color: '#ECFDF5', fontSize: '0.9rem', opacity: 0.95 }}>
            Establezca los detalles organizacionales y del período académico institucional.
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
          <Settings size={32} strokeWidth={2} />
        </div>
      </div>

      {/* Notificaciones del sistema */}
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

      {/* Form Card */}
      <div style={{
        background: 'var(--bg-white, #ffffff)',
        borderRadius: '18px',
        border: '1px solid var(--border, #e2e8f0)',
        boxShadow: '0 18px 35px rgba(15, 23, 42, 0.04)',
        padding: '2rem'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Section 1: General Info */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text, #1e293b)', fontWeight: 700, borderBottom: '1px solid var(--border, #e2e8f0)', paddingBottom: '0.65rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} style={{ color: 'var(--color-primary-light, #166534)' }} />
              <span>Información General de la Institución</span>
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>Nombre Institución *</label>
                <input
                  type="text"
                  name="nombre_institucion"
                  value={config.nombre_institucion || ''}
                  onChange={handleChange}
                  required
                  disabled={guardando}
                  maxLength={150}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                    fontSize: '0.92rem',
                    color: 'var(--text, #0F172A)',
                    outline: 'none',
                    backgroundColor: guardando ? '#f8fafc' : '#ffffff',
                    transition: 'all 0.2s'
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>Director / Rector *</label>
                <input
                  type="text"
                  name="director"
                  value={config.director || ''}
                  onChange={handleChange}
                  required
                  disabled={guardando}
                  maxLength={150}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                    fontSize: '0.92rem',
                    color: 'var(--text, #0F172A)',
                    outline: 'none',
                    backgroundColor: guardando ? '#f8fafc' : '#ffffff',
                    transition: 'all 0.2s'
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
            </div>
          </div>

          {/* Section 2: Academic Period */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text, #1e293b)', fontWeight: 700, borderBottom: '1px solid var(--border, #e2e8f0)', paddingBottom: '0.65rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} style={{ color: 'var(--color-primary-light, #166534)' }} />
              <span>Periodo Académico y Ciclos</span>
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>Año Escolar Activo *</label>
                <input
                  type="text"
                  name="anio_escolar"
                  value={config.anio_escolar || ''}
                  onChange={handleChange}
                  required
                  disabled={guardando}
                  maxLength={20}
                  placeholder="ej. 2026"
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                    fontSize: '0.92rem',
                    color: 'var(--text, #0F172A)',
                    outline: 'none',
                    backgroundColor: guardando ? '#f8fafc' : '#ffffff',
                    transition: 'all 0.2s'
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>Período Académico Actual *</label>
                <select
                  name="periodo_actual"
                  value={config.periodo_actual || 'Primer Trimestre'}
                  onChange={handleChange}
                  required
                  disabled={guardando}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                    fontSize: '0.92rem',
                    color: 'var(--text, #0F172A)',
                    outline: 'none',
                    background: guardando ? '#f8fafc' : '#ffffff',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary, #0A3A20)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(10, 58, 32, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border, #cbd5e1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="Primer Trimestre">Primer Trimestre</option>
                  <option value="Segundo Trimestre">Segundo Trimestre</option>
                  <option value="Tercer Trimestre">Tercer Trimestre</option>
                  <option value="Primer Semestre">Primer Semestre</option>
                  <option value="Segundo Semestre">Segundo Semestre</option>
                  <option value="Bimestre 1">Bimestre 1</option>
                  <option value="Bimestre 2">Bimestre 2</option>
                  <option value="Bimestre 3">Bimestre 3</option>
                  <option value="Bimestre 4">Bimestre 4</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Contact details */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text, #1e293b)', fontWeight: 700, borderBottom: '1px solid var(--border, #e2e8f0)', paddingBottom: '0.65rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={20} style={{ color: 'var(--color-primary-light, #166534)' }} />
              <span>Datos de Contacto y Ubicación</span>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>Dirección Física</label>
                <input
                  type="text"
                  name="direccion"
                  value={config.direccion || ''}
                  onChange={handleChange}
                  disabled={guardando}
                  maxLength={255}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                    fontSize: '0.92rem',
                    color: 'var(--text, #0F172A)',
                    outline: 'none',
                    backgroundColor: guardando ? '#f8fafc' : '#ffffff',
                    transition: 'all 0.2s'
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>Teléfono de Contacto</label>
                  <input
                    type="text"
                    name="telefono"
                    value={config.telefono || ''}
                    onChange={handleChange}
                    disabled={guardando}
                    maxLength={50}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border, #cbd5e1)',
                      fontSize: '0.92rem',
                      color: 'var(--text, #0F172A)',
                      outline: 'none',
                      backgroundColor: guardando ? '#f8fafc' : '#ffffff',
                      transition: 'all 0.2s'
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>Correo de Soporte / Contacto</label>
                  <input
                    type="email"
                    name="email_contacto"
                    value={config.email_contacto || ''}
                    onChange={handleChange}
                    disabled={guardando}
                    maxLength={150}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border, #cbd5e1)',
                      fontSize: '0.92rem',
                      color: 'var(--text, #0F172A)',
                      outline: 'none',
                      backgroundColor: guardando ? '#f8fafc' : '#ffffff',
                      transition: 'all 0.2s'
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
              </div>
            </div>
          </div>

          {/* Technical Info & Last updated */}
          {config.updated_at && (
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '0.85rem 1.1rem', 
              background: '#ECFDF5', 
              borderRadius: '10px',
              border: '1px solid #A7F3D0',
              fontSize: '0.82rem', 
              color: 'var(--color-primary-light, #166534)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Database size={15} style={{ color: 'var(--color-primary-light, #166534)' }} />
                <span>Fuente de verdad: <strong>Base de datos persistente</strong></span>
              </span>
              <span>Última actualización: <strong>{formatearFecha(config.updated_at)}</strong></span>
            </div>
          )}

          {/* Submit area */}
          <div style={{
            borderTop: '1px solid var(--border, #e2e8f0)',
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={cargarConfiguracion}
              disabled={guardando}
              style={{
                background: '#f8fafc',
                color: 'var(--text-secondary, #475569)',
                border: '1px solid var(--border, #cbd5e1)',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: guardando ? 'not-allowed' : 'pointer',
                opacity: guardando ? 0.6 : 1,
                transition: 'all 0.15s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => { if (!guardando) e.currentTarget.style.background = '#e2e8f0'; }}
              onMouseLeave={(e) => { if (!guardando) e.currentTarget.style.background = '#f8fafc'; }}
            >
              <RotateCw size={15} />
              <span>Recargar</span>
            </button>

            <button
              type="submit"
              disabled={guardando}
              style={{
                background: guardando ? '#94a3b8' : 'var(--color-primary, #0A3A20)',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.75rem',
                borderRadius: '10px',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: guardando ? 'not-allowed' : 'pointer',
                boxShadow: guardando ? 'none' : '0 4px 14px rgba(10, 58, 32, 0.25)',
                transition: 'all 0.15s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!guardando) {
                  e.currentTarget.style.background = 'var(--color-primary-light, #166534)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(10, 58, 32, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!guardando) {
                  e.currentTarget.style.background = 'var(--color-primary, #0A3A20)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(10, 58, 32, 0.25)';
                }
              }}
            >
              <Save size={16} />
              <span>{guardando ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
