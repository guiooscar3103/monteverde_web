import React, { useState, useEffect } from 'react';
import { getConfiguracion, guardarConfiguracion } from '../../services/api';

export default function Configuracion() {
  const [config, setConfig] = useState({
    nombre_institucion: '',
    director: '',
    anio_escolar: '',
    periodo_actual: '',
    direccion: '',
    telefono: '',
    email_contacto: ''
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
      // Ensure we set data correctly depending on format
      if (res && res.data) {
        setConfig(res.data);
      } else if (res) {
        setConfig(res);
      }
    } catch (error) {
      console.error('Error al obtener la configuración:', error);
      setErrorMsg('No se pudo cargar la configuración del sistema.');
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
      if (res.success || res) {
        setSuccessMsg(res.message || 'Configuración institucional guardada exitosamente');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Error al guardar la configuración institucional.');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      setErrorMsg(error.message || 'Ocurrió un error al guardar los ajustes.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: '#64748b' }}>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #7c3aed',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}></div>
        <span>Cargando configuración institucional...</span>
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
      {/* Header Banner */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2.5rem',
        background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)', // Deep Violet-Indigo
        padding: '1.5rem 2rem',
        borderRadius: '16px',
        color: '#ffffff',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#ffffff', fontWeight: 700 }}>
            Configuración del Sistema
          </h1>
          <p style={{ margin: '5px 0 0', color: '#c7d2fe', fontSize: '0.9rem' }}>
            Establezca los detalles organizacionales generales y del período académico de la institución.
          </p>
        </div>
        <div style={{ fontSize: '2.5rem' }}>⚙️</div>
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

      {/* Form Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        padding: '2rem'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Section 1: General Info */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#1e293b', fontWeight: 600, borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏢</span> Información General de la Institución
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Nombre Institución</label>
                <input
                  type="text"
                  name="nombre_institucion"
                  value={config.nombre_institucion}
                  onChange={handleChange}
                  required
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    color: '#334155',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Director / Rector</label>
                <input
                  type="text"
                  name="director"
                  value={config.director}
                  onChange={handleChange}
                  required
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    color: '#334155',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Period */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#1e293b', fontWeight: 600, borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📅</span> Periodo Académico y Ciclos
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Año Escolar Activo</label>
                <input
                  type="text"
                  name="anio_escolar"
                  value={config.anio_escolar}
                  onChange={handleChange}
                  required
                  placeholder="ej. 2026"
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    color: '#334155',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Período Académico Actual</label>
                <select
                  name="periodo_actual"
                  value={config.periodo_actual}
                  onChange={handleChange}
                  required
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    color: '#334155',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                >
                  <option value="Primer Trimestre">Primer Trimestre</option>
                  <option value="Segundo Trimestre">Segundo Trimestre</option>
                  <option value="Tercer Trimestre">Tercer Trimestre</option>
                  <option value="Primer Semestre">Primer Semestre</option>
                  <option value="Segundo Semestre">Segundo Semestre</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Contact details */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#1e293b', fontWeight: 600, borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📞</span> Datos de Contacto y Ubicación
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Dirección Física</label>
                <input
                  type="text"
                  name="direccion"
                  value={config.direccion}
                  onChange={handleChange}
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    color: '#334155',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Teléfono de Contacto</label>
                  <input
                    type="text"
                    name="telefono"
                    value={config.telefono}
                    onChange={handleChange}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      color: '#334155',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Correo de Soporte / Contacto</label>
                  <input
                    type="email"
                    name="email_contacto"
                    value={config.email_contacto}
                    onChange={handleChange}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      color: '#334155',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit area */}
          <div style={{
            borderTop: '1px solid #e2e8f0',
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
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
            >
              Revertir Ajustes
            </button>

            <button
              type="submit"
              disabled={guardando}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.75rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.25)',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'none';
              }}
            >
              {guardando ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
