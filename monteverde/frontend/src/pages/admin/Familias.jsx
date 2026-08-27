import React, { useState, useEffect } from 'react';
import {
  Search,
  SearchX,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  UserMinus,
  UserPlus,
  X
} from 'lucide-react';
import { 
  getFamiliasConVinculos, 
  getEstudiantesDisponibles, 
  vincularEstudianteAFamilia, 
  desvincularEstudianteDeFamilia 
} from '../../services/api';
import iconoFamilia from '../../assets/img/icono familia.png';

// Constantes de estilos
const CARD_STYLES = {
  container: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    minHeight: '230px'
  },
  studentButton: {
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
  }
};

const getEstudianteGrado = (estudiante) => {
  if (!estudiante.curso) return 'Sin Curso';
  return `${estudiante.curso.nivel}°${estudiante.curso.letra} - ${estudiante.curso.nombre}`;
};

const filterEstudiantes = (estudiantes, query, linkedIds) => {
  if (!query.trim()) return estudiantes.filter(e => !linkedIds.includes(e.id));
  
  const q = query.toLowerCase().trim();
  return estudiantes.filter(est => {
    if (linkedIds.includes(est.id)) return false;
    const matchNombre = est.nombre?.toLowerCase().includes(q);
    const matchCurso = est.curso_nombre?.toLowerCase().includes(q) || 
                      (est.curso && `${est.curso.nivel}°${est.curso.letra}`.toLowerCase().includes(q));
    const matchId = est.id?.toString().includes(q);
    return matchNombre || matchCurso || matchId;
  });
};

function StudentDropdown({
  fam,
  estudiantes,
  searchQueries,
  seleccionEstudiante,
  setSeleccionEstudiante,
  setSearchQueries,
  setActiveDropdownFamId
}) {
  const linkedIds = fam.estudiantes?.map(e => e.id) || [];
  const query = (searchQueries[fam.id] || '').toLowerCase().trim();
  
  const filtered = estudiantes.filter(est => {
    if (linkedIds.includes(est.id)) return false;
    if (!query) return true;
    
    const matchNombre = est.nombre?.toLowerCase().includes(query);
    const matchCurso = est.curso_nombre?.toLowerCase().includes(query) || 
                      (est.curso && `${est.curso.nivel}°${est.curso.letra}`.toLowerCase().includes(query));
    const matchId = est.id?.toString().includes(query);
    
    return matchNombre || matchCurso || matchId;
  });

  if (filtered.length === 0) {
    return (
      <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <SearchX size={16} />
        <span>Sin coincidencias disponibles</span>
      </div>
    );
  }

  const handleSelect = (est) => {
    setSeleccionEstudiante({ ...seleccionEstudiante, [fam.id]: est.id });
    setSearchQueries({ ...searchQueries, [fam.id]: est.nombre });
    setActiveDropdownFamId(null);
  };

  const handleMouseEnter = (e) => {
    e.currentTarget.style.backgroundColor = '#eff6ff';
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  return (
    <>
      {filtered.map((est) => (
        <div
          key={est.id}
          onMouseDown={() => handleSelect(est)}
          style={{
            padding: '0.6rem 0.9rem',
            fontSize: '0.85rem',
            color: '#334155',
            cursor: 'pointer',
            borderBottom: '1px solid #f1f5f9',
            transition: 'background 0.15s',
            textAlign: 'left'
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div style={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GraduationCap size={15} style={{ color: 'var(--color-primary)' }} />
            <span>{est.nombre}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', paddingLeft: '21px' }}>
            Curso: {est.curso_nombre || 'Sin curso'} · ID: #{est.id}
          </div>
        </div>
      ))}
    </>
  );
}

export default function Familias() {
  const [familias, setFamilias] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [seleccionEstudiante, setSeleccionEstudiante] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [searchQueries, setSearchQueries] = useState({});
  const [activeDropdownFamId, setActiveDropdownFamId] = useState(null);

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
        // Limpiar el estudiante seleccionado y su query de búsqueda
        setSeleccionEstudiante({ ...seleccionEstudiante, [familiaId]: '' });
        setSearchQueries({ ...searchQueries, [familiaId]: '' });
        // Recargar los datos desde la base de datos
        await cargarDatos();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(res.message || 'Error al vincular estudiante.');
      }
    } catch (error) {
      alert(error.message || 'Error en la petición.');
    }
  };

  const handleDesvincular = async (familiaId, estudianteId, estudianteNombre) => {
    if (!window.confirm(`¿Está seguro de remover la vinculación con el estudiante ${estudianteNombre} para esta familia?`)) {
      return;
    }

    try {
      const res = await desvincularEstudianteDeFamilia({
        familia_id: familiaId,
        estudiante_id: estudianteId
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

  // Filtrar el listado de familias por coincidencia en nombre o correo
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
        background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', // Elegante color azul real profundo
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '68px',
          height: '68px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '14px',
          padding: '6px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(4px)',
          flexShrink: 0
        }}>
          <img 
            src={iconoFamilia} 
            alt="Icono Familia" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain'
            }} 
          />
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
        <Search size={18} strokeWidth={2.2} style={{ color: '#94a3b8', flexShrink: 0 }} />
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
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#64748b' }}>
            <Users size={44} strokeWidth={1.5} />
          </div>
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
                    Estudiantes Vinculados
                  </label>
                  
                  {!fam.estudiantes || fam.estudiantes.length === 0 ? (
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
                      <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                      <span>Sin estudiantes asociados actualmente.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {fam.estudiantes.map((est) => (
                        <div key={est.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          padding: '0.6rem 0.85rem',
                          borderRadius: '10px'
                        }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <GraduationCap size={16} style={{ color: 'var(--color-primary)' }} />
                              <span>{est.nombre}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', paddingLeft: '22px' }}>
                              Grado: {est.curso ? `${est.curso.nivel}°${est.curso.letra} - ${est.curso.nombre}` : 'Sin Curso'} (ID Estudiante: #{est.id})
                            </div>
                          </div>
                          <button
                            onClick={() => handleDesvincular(fam.id, est.id, est.nombre)}
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
                            <UserMinus size={13} />
                            <span>Desvincular</span>
                          </button>
                        </div>
                      ))}
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
                {/* Autocomplete buscador inteligente de estudiantes */}
                <div style={{
                  position: 'relative',
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                    <Search size={15} style={{
                      position: 'absolute',
                      left: '12px',
                      pointerEvents: 'none',
                      color: '#94a3b8'
                    }} />
                    <input
                      type="text"
                      placeholder={estudiantes.length === 0 ? "No hay estudiantes disponibles" : "Buscar alumno por nombre, curso..."}
                      value={searchQueries[fam.id] || ''}
                      onFocus={() => {
                        if (estudiantes.length > 0) setActiveDropdownFamId(fam.id);
                      }}
                      onBlur={() => {
                        // El delay de 250ms es fundamental para que el evento onMouseDown del dropdown ocurra antes del cierre
                        setTimeout(() => setActiveDropdownFamId(null), 250);
                      }}
                      onChange={(e) => {
                        const q = e.target.value;
                        setSearchQueries({ ...searchQueries, [fam.id]: q });
                        setSeleccionEstudiante({ ...seleccionEstudiante, [fam.id]: '' });
                        setActiveDropdownFamId(fam.id);
                      }}
                      style={{
                        width: '100%',
                        fontSize: '0.85rem',
                        padding: '0.55rem 2rem 0.55rem 2.25rem',
                        borderRadius: '10px',
                        border: seleccionEstudiante[fam.id] ? '2px solid #22c55e' : '1px solid #cbd5e1',
                        background: '#ffffff',
                        outline: 'none',
                        color: '#334155',
                        transition: 'all 0.15s'
                      }}
                      disabled={estudiantes.length === 0}
                    />
                    {searchQueries[fam.id] && (
                      <button
                        onClick={() => {
                          setSearchQueries({ ...searchQueries, [fam.id]: '' });
                          setSeleccionEstudiante({ ...seleccionEstudiante, [fam.id]: '' });
                        }}
                        type="button"
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Limpiar búsqueda"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Panel flotante de sugerencias Autocomplete (desplegado hacia arriba para evitar desbordamiento del contenedor) */}
                  {activeDropdownFamId === fam.id && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 1000,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      boxShadow: '0 -10px 15px -3px rgba(0,0,0,0.1), 0 -4px 6px -4px rgba(0,0,0,0.1)',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      marginBottom: '6px'
                    }}>
                      <StudentDropdown
                        fam={fam}
                        estudiantes={estudiantes}
                        searchQueries={searchQueries}
                        seleccionEstudiante={seleccionEstudiante}
                        setSeleccionEstudiante={setSeleccionEstudiante}
                        setSearchQueries={setSearchQueries}
                        setActiveDropdownFamId={setActiveDropdownFamId}
                      />
                    </div>
                  )}
                </div>

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
                    transition: 'all 0.15s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  disabled={estudiantes.length === 0}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'none';
                  }}
                >
                  <UserPlus size={15} />
                  <span>Vincular</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
