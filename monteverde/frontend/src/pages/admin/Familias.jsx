import React, { useState, useEffect } from 'react';
import { 
  getFamiliasConVinculos, 
  getEstudiantesDisponibles, 
  vincularEstudianteAFamilia, 
  desvincularEstudianteDeFamilia 
} from '../../services/api';

export default function Familias() {
  const [familias, setFamilias] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Student selection state per family card
  const [seleccionEstudiante, setSeleccionEstudiante] = useState({});
  // Search text for filtering families
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const [resFamilias, resEstudiantes] = await Promise.all([
        getFamiliasConVinculos(),
        getEstudiantesDisponibles()
      ]);
      if (resFamilias) setFamilias(resFamilias);
      if (resEstudiantes) setEstudiantes(resEstudiantes);
    } catch (error) {
      console.error('Error al cargar datos de familia/estudiantes:', error);
      setErrorMsg('Error al cargar las cuentas familiares o la lista de estudiantes.');
    } finally {
      setCargando(false);
    }
  };

  const handleVincular = async (familiaId) => {
    const estudianteId = seleccionEstudiante[familiaId];
    if (!estudianteId) {
      alert('Por favor selecciona un estudiante para vincular.');
      return;
    }

    try {
      const res = await vincularEstudianteAFamilia({
        familia_id: familiaId,
        estudiante_id: parseInt(estudianteId)
      });
      if (res.success) {
        setSuccessMsg(res.message || 'Vínculo establecido con éxito');
        // Clear select
        setSeleccionEstudiante({ ...seleccionEstudiante, [familiaId]: '' });
        // Reload
        await cargarDatos();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(res.message || 'Error al vincular estudiante.');
      }
    } catch (error) {
      alert(error.message || 'Error en la petición.');
    }
  };

  const handleDesvincular = async (familiaId) => {
    if (!window.confirm('¿Está seguro de remover la vinculación con el estudiante para esta familia?')) {
      return;
    }

    try {
      const res = await desvincularEstudianteDeFamilia({
        familia_id: familiaId
      });
      if (res.success) {
        setSuccessMsg(res.message || 'Vínculo familiar removido');
        await cargarDatos();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(res.message || 'Error al desvincular estudiante.');
      }
    } catch (error) {
      alert(error.message || 'Error en la petición.');
    }
  };

  // Filter families by name or email
  const familiasFiltradas = familias.filter(f => 
    f.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    f.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: '#64748b' }}>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}></div>
        <span>Cargando cuentas de familias...</span>
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
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', // Elegant Royal Blue
        padding: '1.5rem 2rem',
        borderRadius: '16px',
        color: '#ffffff',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#ffffff', fontWeight: 700 }}>
            Vínculos Familiares
          </h1>
          <p style={{ margin: '5px 0 0', color: '#bfdbfe', fontSize: '0.9rem' }}>
            Vincule cuentas del rol Familia con sus respectivos alumnos matriculados para permitirles ver calificaciones y reportes de asistencia.
          </p>
        </div>
        <div style={{ fontSize: '2.5rem' }}>👨‍👩‍👧‍👦</div>
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

      {/* Filter and Search Bar */}
      <div style={{
        background: '#ffffff',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Buscar familia por nombre o correo electrónico..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            fontSize: '0.95rem',
            color: '#1e293b',
            width: '100%'
          }}
        />
      </div>

      {/* Grid List */}
      {familiasFiltradas.length === 0 ? (
        <div style={{ padding: '4rem 0', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <span style={{ fontSize: '2.5rem' }}>👥</span>
          <h3 style={{ margin: '1rem 0 0.5rem', color: '#334155' }}>No se encontraron cuentas familiares</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Cree usuarios con rol Familia en la sección "Gestión Usuarios" o ajuste su búsqueda.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem'
        }}>
          {familiasFiltradas.map((fam) => (
            <div key={fam.id} style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              minHeight: '230px'
            }}>
              <div>
                {/* Header card details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: 700 }}>
                      {fam.nombre}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {fam.email}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    ID: #{fam.id}
                  </span>
                </div>

                {/* Assigned Student Section */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Estudiante Vinculado
                  </label>
                  
                  {!fam.estudiante ? (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      background: '#fffbeb', 
                      border: '1px solid #fde68a', 
                      color: '#b45309', 
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}>
                      <span>⚠️ Sin estudiante asociado actualmente.</span>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '10px'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                          🧑‍🎓 {fam.estudiante.nombre}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          Grado: {fam.estudiante.curso ? `${fam.estudiante.curso.nivel}°${fam.estudiante.curso.letra} - ${fam.estudiante.curso.nombre}` : 'Sin Curso'} (ID Estudiante: #{fam.estudiante.id})
                        </div>
                      </div>
                      <button
                        onClick={() => handleDesvincular(fam.id)}
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fca5a5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fee2e2';
                        }}
                        title="Remover vinculación"
                      >
                        Desvincular
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Controls */}
              <div style={{
                borderTop: '1px solid #f1f5f9',
                paddingTop: '1rem',
                marginTop: 'auto',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <select
                  value={seleccionEstudiante[fam.id] || ''}
                  onChange={(e) => setSeleccionEstudiante({ ...seleccionEstudiante, [fam.id]: e.target.value })}
                  style={{
                    flexGrow: 1,
                    fontSize: '0.85rem',
                    padding: '0.45rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    outline: 'none',
                    color: '#334155'
                  }}
                  disabled={estudiantes.length === 0}
                >
                  <option value="">-- Seleccionar Alumno --</option>
                  {estudiantes.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nombre} {est.curso_nombre ? `- ${est.curso_nombre}` : ''}
                    </option>
                  ))}
                </select>
                {estudiantes.length === 0 && (
                  <span style={{
                    color: '#7c3aed',
                    fontSize: '0.8rem',
                    marginLeft: '0.75rem',
                    fontWeight: 600
                  }}>
                    No existen estudiantes disponibles
                  </span>
                )}

                <button
                  onClick={() => handleVincular(fam.id)}
                  style={{
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.45rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(29, 78, 216, 0.2)',
                    transition: 'all 0.15s'
                  }}
                  disabled={estudiantes.length === 0}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'none';
                  }}
                >
                  Vincular
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
