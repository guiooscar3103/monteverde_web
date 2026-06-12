import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCursos, createCurso, updateCurso, deleteCurso } from '../../services/api';

// Funciones helper
const _parseCursoResponse = (respuesta, defaultMessage) => {
  const exito = respuesta && (typeof respuesta.success !== 'undefined' ? respuesta.success : true);
  const mensaje = respuesta?.message || defaultMessage;
  return { exito, mensaje };
};

const _crearPayloadCurso = (nombre, grado, descripcion) => ({
  nombre: nombre.trim(),
  grado: grado.trim(),
  descripcion: descripcion.trim()
});

const _validarFormularioCurso = (nombre, grado) => {
  return nombre.trim() && grado.trim();
};

export default function Cursos() {
  const queryClient = useQueryClient();

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoCurso, setEditandoCurso] = useState(null);
  const [nombreCurso, setNombreCurso] = useState('');
  const [grado, setGrado] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // 1. Consulta reactiva de cursos
  const { data: cursos = [], isLoading: cargando } = useQuery({
    queryKey: ['cursos'],
    queryFn: getCursos,
  });

  // 2. Mutaciones para CRUD
  const createMutation = useMutation({
    mutationFn: createCurso,
    onSuccess: (respuesta) => {
      const { exito, mensaje } = _parseCursoResponse(respuesta, 'Curso creado');
      if (exito) {
        setSuccessMsg(mensaje);
        queryClient.invalidateQueries({ queryKey: ['cursos'] });
        cerrarModal();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(mensaje);
      }
    },
    onError: (error) => {
      setErrorMsg(error.message || 'Error en el servidor.');
    }
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
    onError: (error) => {
      setErrorMsg(error.message || 'Error en el servidor.');
    }
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
    onError: (error) => {
      setErrorMsg(error.message || 'Error en el servidor.');
    }
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
    <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.75rem'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.9rem', color: '#0f172a' }}>
            Gestión de Cursos
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>
            Crea, edita y elimina cursos del sistema con nombre, grado y descripción.
          </p>
        </div>

        <button
          onClick={() => abrirModal()}
          style={{
            background: '#10b981',
            color: '#ffffff',
            border: 'none',
            padding: '0.85rem 1.2rem',
            borderRadius: '10px',
            cursor: 'pointer',
            boxShadow: '0 12px 24px rgba(16, 185, 129, 0.18)',
            fontWeight: 700
          }}
        >
          + Nuevo Curso
        </button>
      </div>

      {successMsg && (
        <div style={{
          marginBottom: '1rem',
          background: '#dcfce7',
          color: '#166534',
          padding: '1rem 1.2rem',
          borderRadius: '12px',
          border: '1px solid #4ade80'
        }}>
          ✅ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          marginBottom: '1rem',
          background: '#fee2e2',
          color: '#991b1b',
          padding: '1rem 1.2rem',
          borderRadius: '12px',
          border: '1px solid #f87171'
        }}>
          ❌ {errorMsg}
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
            borderTop: '4px solid #10b981',
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
              <tr style={{ background: '#f8fafc' }}>
                <th style={tableHeaderStyle}>Nombre del Curso</th>
                <th style={tableHeaderStyle}>Grado</th>
                <th style={tableHeaderStyle}>Descripción</th>
                <th style={tableHeaderStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cursos.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No hay cursos registrados.
                  </td>
                </tr>
              ) : (
                cursos.map((curso) => (
                  <tr key={curso.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tableCellStyle}>{curso.nombre_curso || curso.nombre}</td>
                    <td style={tableCellStyle}>{curso.grado || `${curso.nivel}${curso.letra}`}</td>
                    <td style={tableCellStyle}>{curso.descripcion || '—'}</td>
                    <td style={tableCellStyle}>
                      <button
                        onClick={() => abrirModal(curso)}
                        style={actionButtonStyle}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(curso.id)}
                        style={deleteButtonStyle}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a' }}>
                  {editandoCurso ? 'Editar Curso' : 'Nuevo Curso'}
                </h2>
                <p style={{ margin: '0.3rem 0 0', color: '#475569' }}>
                  {editandoCurso ? 'Actualiza los datos del curso existente.' : 'Registra un nuevo curso para la institución.'}
                </p>
              </div>
              <button onClick={cerrarModal} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#475569', fontSize: '1.1rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardar}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <label style={labelStyle}>
                  Nombre del curso
                  <input
                    type="text"
                    value={nombreCurso}
                    onChange={(e) => setNombreCurso(e.target.value)}
                    style={inputStyle}
                    placeholder="Ej. Matemáticas"
                  />
                </label>

                <label style={labelStyle}>
                  Grado
                  <input
                    type="text"
                    value={grado}
                    onChange={(e) => setGrado(e.target.value)}
                    style={inputStyle}
                    placeholder="Ej. 10A"
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
                <button type="submit" style={primaryButtonStyle}>
                  {editandoCurso ? 'Guardar cambios' : 'Crear curso'}
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
  padding: '1rem',
  color: '#334155',
  fontSize: '0.875rem',
  letterSpacing: '0.01em'
};

const tableCellStyle = {
  padding: '1rem',
  color: '#475569',
  fontSize: '0.95rem',
  verticalAlign: 'middle'
};

const actionButtonStyle = {
  background: '#0ea5e9',
  border: 'none',
  color: '#ffffff',
  padding: '0.55rem 0.9rem',
  borderRadius: '8px',
  cursor: 'pointer',
  marginRight: '0.5rem'
};

const deleteButtonStyle = {
  background: '#ef4444',
  border: 'none',
  color: '#ffffff',
  padding: '0.55rem 0.9rem',
  borderRadius: '8px',
  cursor: 'pointer'
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(15, 23, 42, 0.35)',
  padding: '1.5rem',
  zIndex: 50
};

const modalContentStyle = {
  width: '100%',
  maxWidth: '600px',
  background: '#ffffff',
  padding: '1.75rem',
  borderRadius: '18px',
  boxShadow: '0 32px 80px rgba(15, 23, 42, 0.15)'
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  fontWeight: 600,
  color: '#334155',
  fontSize: '0.92rem'
};

const inputStyle = {
  width: '100%',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  padding: '0.95rem 1rem',
  fontSize: '0.95rem',
  color: '#0f172a',
  outline: 'none'
};

const secondaryButtonStyle = {
  background: '#f8fafc',
  border: '1px solid #cbd5e1',
  color: '#334155',
  padding: '0.85rem 1rem',
  borderRadius: '12px',
  cursor: 'pointer'
};

const primaryButtonStyle = {
  background: '#10b981',
  border: 'none',
  color: '#ffffff',
  padding: '0.85rem 1rem',
  borderRadius: '12px',
  cursor: 'pointer'
};
