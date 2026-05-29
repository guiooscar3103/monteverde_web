import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocentesConCursos, getCursos, getMaterias, asignarCursoADocente, desasignarCursoDeDocente } from '../../services/api';
import iconoDocente from '../../assets/img/docente.png';

export default function Docentes() {
  const queryClient = useQueryClient();

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [seleccionCurso, setSeleccionCurso] = useState({});
  const [seleccionMateria, setSeleccionMateria] = useState({});

  // 1. Parallel React Queries
  const { data: docentes = [], isLoading: loadingDocentes } = useQuery({
    queryKey: ['admin', 'docentes'],
    queryFn: getDocentesConCursos,
  });

  const { data: cursos = [], isLoading: loadingCursos } = useQuery({
    queryKey: ['cursos'],
    queryFn: getCursos,
  });

  const { data: materias = [], isLoading: loadingMaterias } = useQuery({
    queryKey: ['materias'],
    queryFn: getMaterias,
  });

  const cargando = loadingDocentes || loadingCursos || loadingMaterias;

  // 2. Mutations
  const assignMutation = useMutation({
    mutationFn: asignarCursoADocente,
    onSuccess: (res) => {
      if (res.success) {
        setSuccessMsg(res.message || 'Asignación creada con éxito');
        queryClient.invalidateQueries({ queryKey: ['admin', 'docentes'] });
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert(res.message || 'Error al asignar curso y materia.');
      }
    },
    onError: (error) => {
      alert(error.message || 'Error en la petición.');
    }
  });

  const desassignMutation = useMutation({
    mutationFn: desasignarCursoDeDocente,
    onSuccess: (res) => {
      if (res.success) {
        setSuccessMsg(res.message || 'Asignación removida');
        queryClient.invalidateQueries({ queryKey: ['admin', 'docentes'] });
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert(res.message || 'Error al desasignar curso.');
      }
    },
    onError: (error) => {
      alert(error.message || 'Error en la petición.');
    }
  });

  const handleAsignar = (docenteId) => {
    const cursoId = seleccionCurso[docenteId];
    const materiaId = seleccionMateria[docenteId];
    if (!cursoId || !materiaId) {
      alert('Por favor selecciona un curso y una materia para asignar.');
      return;
    }

    assignMutation.mutate({
      docente_id: docenteId,
      curso_id: parseInt(cursoId),
      materia_id: parseInt(materiaId)
    }, {
      onSuccess: () => {
        setSeleccionCurso({ ...seleccionCurso, [docenteId]: '' });
        setSeleccionMateria({ ...seleccionMateria, [docenteId]: '' });
      }
    });
  };

  const handleDesasignar = (docenteId, asignacion) => {
    if (!window.confirm('¿Está seguro de remover la asignación de este curso para el docente?')) {
      return;
    }

    const payload = asignacion.legacy
      ? { docente_id: docenteId, curso_id: asignacion.curso_id }
      : { assignment_id: asignacion.id };

    desassignMutation.mutate(payload);
  };

  if (cargando) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: '#64748b' }}>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #4f46e5',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}></div>
        <span>Cargando plantilla de docentes...</span>
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
      {/* Banner de cabecera de la página */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #166534 0%, #064e3b 100%)', // Elegante color verde bosque
        padding: '1.5rem 2rem',
        borderRadius: '16px',
        color: '#ffffff',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#ffffff', fontWeight: 700 }}>
            Asignación de Cursos a Docentes
          </h1>
          <p style={{ margin: '5px 0 0', color: '#bbf7d0', fontSize: '0.9rem' }}>
            Asocia a los profesores con los grados y grupos correspondientes para la gestión de calificaciones y asistencia.
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
            src={iconoDocente} 
            alt="Icono Docente" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              borderRadius: '8px'
            }} 
          />
        </div>
      </div>

      {/* Notificaciones del sistema */}
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

      {/* Docentes Grid */}
      {docentes.length === 0 ? (
        <div style={{ padding: '4rem 0', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <span style={{ fontSize: '2.5rem' }}>🧑‍🏫</span>
          <h3 style={{ margin: '1rem 0 0.5rem', color: '#334155' }}>No se registran docentes</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Cree cuentas con rol Docente en la sección "Gestión Usuarios".</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem'
        }}>
          {docentes.map((doc) => (
            <div key={doc.id} className="card" style={{
              background: '#ffffff',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '220px'
            }}>
              <div>
                {/* Header card details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: 700 }}>
                      {doc.nombre}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {doc.email}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    background: '#ecfdf5',
                    color: '#047857',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    ID: #{doc.id}
                  </span>
                </div>

                {/* Assigned Courses Section */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Cursos Asignados
                  </label>
                  
                  {(!doc.cursos_asignados || !Array.isArray(doc.cursos_asignados) || doc.cursos_asignados.length === 0) ? (
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      Sin cursos asignados actualmente.
                    </span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {doc.cursos_asignados.map((cur) => (
                        <div key={cur?.id || `${doc.id}-${cur?.nombre || Math.random()}`} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#334155'
                        }}>
                          <span>
                            {cur.curso_nivel}°{cur.curso_letra} ({cur.curso_nombre})
                            {cur.materia_nombre ? ` — ${cur.materia_nombre}` : ''}
                          </span>
                          <button
                            onClick={() => handleDesasignar(doc.id, cur)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: 0,
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Quitar curso"
                          >
                            &times;
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
                <div style={{ display: 'flex', flexGrow: 1, gap: '0.75rem', alignItems: 'center' }}>
                  <select
                    value={seleccionCurso[doc.id] || ''}
                    onChange={(e) => setSeleccionCurso({ ...seleccionCurso, [doc.id]: e.target.value })}
                    style={{
                      flexGrow: 1,
                      fontSize: '0.85rem',
                      padding: '0.4rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1'
                    }}
                  >
                    <option value="">-- Seleccionar Curso --</option>
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nivel}°{c.letra} - {c.nombre}
                      </option>
                    ))}
                  </select>

                  <select
                    value={seleccionMateria[doc.id] || ''}
                    onChange={(e) => setSeleccionMateria({ ...seleccionMateria, [doc.id]: e.target.value })}
                    style={{
                      flexGrow: 1,
                      fontSize: '0.85rem',
                      padding: '0.4rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1'
                    }}
                  >
                    <option value="">-- Seleccionar Materia --</option>
                    {materias.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleAsignar(doc.id)}
                  style={{
                    background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(22, 101, 52, 0.2)',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                >
                  Asignar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
