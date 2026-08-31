import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Layers,
  Check,
  CheckSquare,
  Square
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCursos,
  createCurso,
  updateCurso,
  deleteCurso,
  getMaterias,
  getCursoMaterias,
  setCursoMaterias
} from '../../services/api';

const _parseCursoResponse = (respuesta, defaultMessage) => {
  const exito = respuesta && (typeof respuesta.success !== 'undefined' ? respuesta.success : true);
  const mensaje = respuesta?.message || defaultMessage;
  return { exito, mensaje };
};

const _validarFormularioCurso = (nombre, grado) => {
  return nombre.trim() && grado.trim();
};

export default function Cursos() {
  const queryClient = useQueryClient();

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Modal Curso CRUD
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoCurso, setEditandoCurso] = useState(null);
  const [nombreCurso, setNombreCurso] = useState('');
  const [grado, setGrado] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Modal Configurar Asignaturas del Curso
  const [modalMateriasAbierto, setModalMateriasAbierto] = useState(false);
  const [cursoParaMaterias, setCursoParaMaterias] = useState(null);
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState([]);

  // 1. Consultas reactivas
  const { data: cursos = [], isLoading: cargando } = useQuery({
    queryKey: ['cursos'],
    queryFn: getCursos,
  });

  const { data: catalogoMaterias = [] } = useQuery({
    queryKey: ['materias', 'activas'],
    queryFn: () => getMaterias({ activo: true }),
  });

  // 2. Mutaciones para CRUD
  const createMutation = useMutation({
    mutationFn: createCurso,
    onSuccess: (respuesta) => {
      const { exito, mensaje } = _parseCursoResponse(respuesta, 'Curso creado exitosamente');
      if (exito) {
        setSuccessMsg(mensaje);
        queryClient.invalidateQueries({ queryKey: ['cursos'] });
        cerrarModal();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(mensaje);
      }
    },
    onError: (error) => setErrorMsg(error.message || 'Error en el servidor.')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateCurso(id, payload),
    onSuccess: (respuesta) => {
      const { exito, mensaje } = _parseCursoResponse(respuesta, 'Curso actualizado');
      if (exito) {
        setSuccessMsg(mensaje);
        queryClient.invalidateQueries({ queryKey: ['cursos'] });
        cerrarModal();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(mensaje);
      }
    },
    onError: (error) => setErrorMsg(error.message || 'Error en el servidor.')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCurso,
    onSuccess: (respuesta) => {
      const { exito, mensaje } = _parseCursoResponse(respuesta, 'Curso eliminado exitosamente');
      if (exito) {
        setSuccessMsg(mensaje);
        queryClient.invalidateQueries({ queryKey: ['cursos'] });
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(mensaje);
      }
    },
    onError: (error) => setErrorMsg(error.message || 'Error en el servidor.')
  });

  const setMateriasMutation = useMutation({
    mutationFn: ({ cursoId, payload }) => setCursoMaterias(cursoId, payload),
    onSuccess: (res) => {
      if (res?.success) {
        setSuccessMsg(res.message || 'Plan de asignaturas actualizado');
        queryClient.invalidateQueries({ queryKey: ['cursos'] });
        cerrarModalMaterias();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res?.message || 'Error al guardar asignaturas');
      }
    },
    onError: (err) => setErrorMsg(err.message || 'Error en la petición')
  });

  const abrirModal = (curso = null) => {
    if (curso) {
      setEditandoCurso(curso);
      setNombreCurso(curso.nombre_curso || curso.nombre || '');
      setGrado(curso.grado || `${curso.nivel}${curso.letra}`);
      setDescripcion(curso.descripcion || '');
    } else {
      setEditandoCurso(null);
      setNombreCurso('');
      setGrado('');
      setDescripcion('');
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditandoCurso(null);
    setNombreCurso('');
    setGrado('');
    setDescripcion('');
    setErrorMsg('');
  };

  const abrirModalMaterias = async (curso) => {
    setCursoParaMaterias(curso);
    setErrorMsg('');
    try {
      const res = await getCursoMaterias(curso.id);
      if (res?.success && res.data?.materias) {
        const ids = res.data.materias.map(m => m.id);
        setMateriasSeleccionadas(ids);
      } else {
        const ids = (curso.materias || []).map(m => m.id);
        setMateriasSeleccionadas(ids);
      }
    } catch {
      const ids = (curso.materias || []).map(m => m.id);
      setMateriasSeleccionadas(ids);
    }

    setModalMateriasAbierto(true);
  };

  const cerrarModalMaterias = () => {
    setModalMateriasAbierto(false);
    setCursoParaMaterias(null);
    setMateriasSeleccionadas([]);
    setErrorMsg('');
  };

  const handleToggleMateria = (materiaId) => {
    if (materiasSeleccionadas.includes(materiaId)) {
      setMateriasSeleccionadas(materiasSeleccionadas.filter(id => id !== materiaId));
    } else {
      setMateriasSeleccionadas([...materiasSeleccionadas, materiaId]);
    }
  };

  const handleSelectAllMaterias = () => {
    setMateriasSeleccionadas(catalogoMaterias.map(m => m.id));
  };

  const handleDeselectAllMaterias = () => {
    setMateriasSeleccionadas([]);
  };

  const handleGuardarMateriasCurso = (e) => {
    e.preventDefault();
    if (!cursoParaMaterias) return;

    setMateriasMutation.mutate({
      cursoId: cursoParaMaterias.id,
      payload: { materia_ids: materiasSeleccionadas }
    });
  };

  const handleGuardar = (event) => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!_validarFormularioCurso(nombreCurso, grado)) {
      setErrorMsg('Por favor completa el nombre del curso y el grado.');
      return;
    }

    const payload = {
      nombre_curso: nombreCurso.trim(),
      grado: grado.trim(),
      descripcion: descripcion.trim() || null
    };

    if (editandoCurso) {
      updateMutation.mutate({ id: editandoCurso.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEliminar = (cursoId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este curso?')) {
      return;
    }
    deleteMutation.mutate(cursoId);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.75rem',
        background: 'linear-gradient(135deg, #166534 0%, #064e3b 100%)',
        padding: '1.75rem 2rem',
        borderRadius: '18px',
        color: '#ffffff',
        boxShadow: '0 12px 24px -4px rgba(22, 101, 52, 0.25)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex'
            }}>
              <BookOpen size={22} color="#ffffff" />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: '#ffffff' }}>
              Gestión de Cursos
            </h1>
          </div>
          <p style={{ margin: 0, color: '#bbf7d0', fontSize: '0.95rem' }}>
            Crea, edita cursos y configura el catálogo de asignaturas disponibles para cada grado.
          </p>
        </div>

        <button
          onClick={() => abrirModal()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#22c55e',
            color: '#ffffff',
            border: 'none',
            padding: '0.85rem 1.4rem',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.92rem',
            boxShadow: '0 8px 16px rgba(34, 197, 94, 0.3)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={19} strokeWidth={2.5} />
          <span>Nuevo Curso</span>
        </button>
      </div>

      {successMsg && (
        <div style={{
          marginBottom: '1rem',
          background: '#dcfce7',
          color: '#166534',
          padding: '0.85rem 1.2rem',
          borderRadius: '12px',
          border: '1px solid #4ade80',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          marginBottom: '1rem',
          background: '#fee2e2',
          color: '#991b1b',
          padding: '0.85rem 1.2rem',
          borderRadius: '12px',
          border: '1px solid #f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {cargando ? (
        <div style={{
          padding: '4rem 0',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            margin: '0 auto 1rem',
            border: '4px solid #d1d5db',
            borderTop: '4px solid #166534',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span>Cargando cursos...</span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 18px 35px rgba(15, 23, 42, 0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={tableHeaderStyle}>Nombre del Curso</th>
                <th style={tableHeaderStyle}>Grado</th>
                <th style={tableHeaderStyle}>Asignaturas Disponibles</th>
                <th style={tableHeaderStyle}>Descripción</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cursos.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No hay cursos registrados.
                  </td>
                </tr>
              ) : (
                cursos.map((curso) => {
                  const numMaterias = curso.materias_count || (curso.materias ? curso.materias.length : 0);
                  return (
                    <tr key={curso.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tableCellStyle}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          {curso.nombre_curso || curso.nombre}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{
                          background: '#f1f5f9',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: '#334155'
                        }}>
                          {curso.grado || `${curso.nivel}${curso.letra}`}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <button
                          onClick={() => abrirModalMaterias(curso)}
                          style={{
                            background: numMaterias > 0 ? '#ecfdf5' : '#fef3c7',
                            color: numMaterias > 0 ? '#047857' : '#b45309',
                            border: `1px solid ${numMaterias > 0 ? '#a7f3d0' : '#fde68a'}`,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Haga clic para configurar asignaturas"
                        >
                          <Layers size={13} />
                          <span>{numMaterias} Asignatura(s)</span>
                        </button>
                      </td>
                      <td style={tableCellStyle}>{curso.descripcion || '—'}</td>
                      <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => abrirModalMaterias(curso)}
                            style={{
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#065f46',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 700
                            }}
                            title="Asignar Materias"
                          >
                            <Layers size={13} />
                            <span>Asignaturas</span>
                          </button>
                          <button
                            onClick={() => abrirModal(curso)}
                            style={{ ...actionButtonStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Pencil size={14} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleEliminar(curso.id)}
                            style={{ ...deleteButtonStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Trash2 size={14} />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Configurar Asignaturas del Curso */}
      {modalMateriasAbierto && cursoParaMaterias && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.35rem', fontWeight: 800 }}>
                  Asignaturas de {cursoParaMaterias.nombre_curso || cursoParaMaterias.nombre}
                </h2>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  Selecciona las asignaturas que componen el plan de estudios para este curso/grado.
                </p>
              </div>
              <button
                onClick={cerrarModalMaterias}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
                {materiasSeleccionadas.length} de {catalogoMaterias.length} asignaturas seleccionadas
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSelectAllMaterias}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#166534',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Seleccionar Todas
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllMaterias}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#64748b',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Deseleccionar
                </button>
              </div>
            </div>

            <form onSubmit={handleGuardarMateriasCurso}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '0.75rem',
                maxHeight: '360px',
                overflowY: 'auto',
                padding: '4px',
                marginBottom: '1.25rem'
              }}>
                {catalogoMaterias.map((m) => {
                  const estaSeleccionada = materiasSeleccionadas.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMateria(m.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        border: estaSeleccionada ? '1.5px solid #166534' : '1px solid #e2e8f0',
                        background: estaSeleccionada ? '#f0fdf4' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={estaSeleccionada}
                        onChange={() => {}} // Handled by container
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: '#166534'
                        }}
                      />
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                            {m.nombre}
                          </span>
                          {m.codigo && (
                            <span style={{ fontSize: '0.72rem', color: '#64748b', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>
                              {m.codigo}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                          {m.area || 'General'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={cerrarModalMaterias} style={secondaryButtonStyle}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={setMateriasMutation.isPending}
                  style={primaryButtonStyle}
                >
                  {setMateriasMutation.isPending ? 'Guardando...' : 'Guardar Asignaturas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Curso */}
      {modalAbierto && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.35rem', fontWeight: 800 }}>
                  {editandoCurso ? 'Editar Curso' : 'Nuevo Curso'}
                </h2>
                <p style={{ margin: '0.3rem 0 0', color: '#475569', fontSize: '0.88rem' }}>
                  {editandoCurso ? 'Actualiza los datos del curso existente.' : 'Registra un nuevo curso para la institución.'}
                </p>
              </div>
              <button 
                onClick={cerrarModal} 
                style={{ 
                  border: 'none', 
                  background: '#f1f5f9', 
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer', 
                  color: '#475569', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardar}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <label style={labelStyle}>
                  Nombre del curso *
                  <input
                    type="text"
                    value={nombreCurso}
                    onChange={(e) => setNombreCurso(e.target.value)}
                    style={inputStyle}
                    placeholder="Ej. Octavo A"
                    required
                  />
                </label>

                <label style={labelStyle}>
                  Grado *
                  <input
                    type="text"
                    value={grado}
                    onChange={(e) => setGrado(e.target.value)}
                    style={inputStyle}
                    placeholder="Ej. 8A"
                    required
                  />
                </label>

                <label style={labelStyle}>
                  Descripción
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    style={{ ...inputStyle, minHeight: '92px', resize: 'vertical' }}
                    placeholder="Detalles del curso, objetivos o notas internas"
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={cerrarModal} style={secondaryButtonStyle}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={primaryButtonStyle}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Guardando...'
                    : editandoCurso ? 'Guardar cambios' : 'Crear curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const tableHeaderStyle = {
  textAlign: 'left',
  padding: '1rem 1.25rem',
  color: '#334155',
  fontSize: '0.85rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.03em'
};

const tableCellStyle = {
  padding: '1.1rem 1.25rem',
  color: '#475569',
  fontSize: '0.92rem',
  verticalAlign: 'middle'
};

const actionButtonStyle = {
  background: '#0ea5e9',
  border: 'none',
  color: '#ffffff',
  padding: '0.5rem 0.75rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.8rem'
};

const deleteButtonStyle = {
  background: '#ef4444',
  border: 'none',
  color: '#ffffff',
  padding: '0.5rem 0.75rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.8rem'
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(15, 23, 42, 0.45)',
  backdropFilter: 'blur(3px)',
  padding: '1.5rem',
  zIndex: 100
};

const modalContentStyle = {
  width: '100%',
  maxWidth: '620px',
  background: '#ffffff',
  padding: '2rem',
  borderRadius: '20px',
  boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  fontWeight: 700,
  color: '#334155',
  fontSize: '0.9rem'
};

const inputStyle = {
  width: '100%',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  padding: '0.85rem 1rem',
  fontSize: '0.92rem',
  color: '#0f172a',
  outline: 'none'
};

const secondaryButtonStyle = {
  background: '#f8fafc',
  border: '1px solid #cbd5e1',
  color: '#334155',
  padding: '0.7rem 1.25rem',
  borderRadius: '10px',
  fontWeight: 600,
  cursor: 'pointer'
};

const primaryButtonStyle = {
  background: '#166534',
  border: 'none',
  color: '#ffffff',
  padding: '0.7rem 1.4rem',
  borderRadius: '10px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 4px 10px rgba(22, 101, 52, 0.25)'
};
