import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Check,
  Ban,
  Layers,
  Clock,
  Sparkles,
  RefreshCw,
  Library
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMaterias,
  createMateria,
  updateMateria,
  deleteMateria,
  toggleMateriaActiva
} from '../../services/api';

const AREAS_COMUNES = [
  'Matemáticas',
  'Humanidades y Lengua Castellana',
  'Ciencias Naturales',
  'Ciencias Sociales',
  'Idiomas Extranjeros',
  'Educación Física',
  'Educación Artística',
  'Tecnología e Informática',
  'Filosofía',
  'Ética y Valores',
  'Ciencias Económicas y Políticas',
  'Emprendimiento',
  'General'
];

export default function Asignaturas() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoMateria, setEditandoMateria] = useState(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [area, setArea] = useState('Matemáticas');
  const [areaPersonalizada, setAreaPersonalizada] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [intensidadHoraria, setIntensidadHoraria] = useState(4);
  const [activo, setActivo] = useState(true);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Consulta de asignaturas
  const { data: materias = [], isLoading: cargando } = useQuery({
    queryKey: ['admin', 'materias', 'catalogo-completo'],
    queryFn: () => getMaterias({ include_inactive: true }),
  });

  // 2. Mutaciones
  const createMutation = useMutation({
    mutationFn: createMateria,
    onSuccess: (res) => {
      const isSuccess = res && (typeof res.success !== 'undefined' ? res.success : true);
      if (isSuccess) {
        setSuccessMsg(res?.message || 'Asignatura creada exitosamente');
        queryClient.invalidateQueries({ queryKey: ['admin', 'materias'] });
        queryClient.invalidateQueries({ queryKey: ['materias'] });
        cerrarModal();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res?.message || 'Error al crear asignatura');
      }
    },
    onError: (err) => setErrorMsg(err.message || 'Error de conexión')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateMateria(id, payload),
    onSuccess: (res) => {
      const isSuccess = res && (typeof res.success !== 'undefined' ? res.success : true);
      if (isSuccess) {
        setSuccessMsg(res?.message || 'Asignatura actualizada');
        queryClient.invalidateQueries({ queryKey: ['admin', 'materias'] });
        queryClient.invalidateQueries({ queryKey: ['materias'] });
        cerrarModal();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res?.message || 'Error al actualizar');
      }
    },
    onError: (err) => setErrorMsg(err.message || 'Error de conexión')
  });

  const toggleMutation = useMutation({
    mutationFn: toggleMateriaActiva,
    onSuccess: (res) => {
      const isSuccess = res && (typeof res.success !== 'undefined' ? res.success : true);
      if (isSuccess) {
        setSuccessMsg(res?.message || 'Estado actualizado');
        queryClient.invalidateQueries({ queryKey: ['admin', 'materias'] });
        queryClient.invalidateQueries({ queryKey: ['materias'] });
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res?.message || 'Error al alternar estado');
      }
    },
    onError: (err) => setErrorMsg(err.message || 'Error de conexión')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMateria,
    onSuccess: (res) => {
      const isSuccess = res && (typeof res.success !== 'undefined' ? res.success : true);
      if (isSuccess) {
        setSuccessMsg(res?.message || 'Asignatura procesada');
        queryClient.invalidateQueries({ queryKey: ['admin', 'materias'] });
        queryClient.invalidateQueries({ queryKey: ['materias'] });
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(res?.message || 'Error al eliminar');
      }
    },
    onError: (err) => setErrorMsg(err.message || 'Error de conexión')
  });

  // Métricas
  const metricas = useMemo(() => {
    const total = materias.length;
    const activas = materias.filter(m => m.activo).length;
    const areasUnicas = new Set(materias.map(m => m.area || 'General')).size;
    const totalHoras = materias.reduce((acc, m) => acc + (m.intensidad_horaria || 0), 0);
    const promHoras = total > 0 ? (totalHoras / total).toFixed(1) : 0;
    return { total, activas, inactivas: total - activas, areasUnicas, promHoras };
  }, [materias]);

  // Lista filtrada
  const materiasFiltradas = useMemo(() => {
    return materias.filter(m => {
      const matchSearch =
        !search.trim() ||
        m.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        m.codigo?.toLowerCase().includes(search.toLowerCase()) ||
        m.descripcion?.toLowerCase().includes(search.toLowerCase());

      const matchArea =
        selectedArea === 'ALL' ||
        (m.area || 'General').toLowerCase() === selectedArea.toLowerCase();

      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && m.activo) ||
        (selectedStatus === 'INACTIVE' && !m.activo);

      return matchSearch && matchArea && matchStatus;
    });
  }, [materias, search, selectedArea, selectedStatus]);

  const abrirModal = (materia = null) => {
    setErrorMsg('');
    if (materia) {
      setEditandoMateria(materia);
      setNombre(materia.nombre || '');
      setCodigo(materia.codigo || '');
      if (AREAS_COMUNES.includes(materia.area)) {
        setArea(materia.area);
        setAreaPersonalizada('');
      } else {
        setArea('OTRA');
        setAreaPersonalizada(materia.area || '');
      }
      setDescripcion(materia.descripcion || '');
      setIntensidadHoraria(materia.intensidad_horaria || 0);
      setActivo(materia.activo !== false);
    } else {
      setEditandoMateria(null);
      setNombre('');
      setCodigo('');
      setArea('Matemáticas');
      setAreaPersonalizada('');
      setDescripcion('');
      setIntensidadHoraria(4);
      setActivo(true);
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditandoMateria(null);
    setErrorMsg('');
  };

  const handleGuardar = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre.trim()) {
      setErrorMsg('El nombre de la asignatura es obligatorio.');
      return;
    }

    const areaFinal = area === 'OTRA' ? (areaPersonalizada.trim() || 'General') : area;

    const payload = {
      nombre: nombre.trim(),
      codigo: codigo.trim().toUpperCase() || null,
      area: areaFinal,
      descripcion: descripcion.trim() || null,
      intensidad_horaria: parseInt(intensidadHoraria, 10) || 0,
      activo: Boolean(activo)
    };

    if (editandoMateria) {
      updateMutation.mutate({ id: editandoMateria.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEliminar = (materia) => {
    const accionTexto = materia.activo
      ? `¿Está seguro de eliminar o desactivar la asignatura '${materia.nombre}'?`
      : `¿Eliminar definitivamente la asignatura inactiva '${materia.nombre}'?`;

    if (window.confirm(`${accionTexto}\n\nSi la asignatura tiene calificaciones o tareas vinculadas, se desactivará automáticamente para preservar el historial.`)) {
      deleteMutation.mutate(materia.id);
    }
  };

  const handleToggle = (materiaId) => {
    toggleMutation.mutate(materiaId);
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
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
              <Library size={22} color="#ffffff" />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.4px', color: '#ffffff' }}>
              Gestión de Asignaturas
            </h1>
          </div>
          <p style={{ margin: 0, color: '#bbf7d0', fontSize: '0.95rem' }}>
            Administra el catálogo institucional de materias, áreas de conocimiento y su disponibilidad en los cursos.
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
          <span>Nueva Asignatura</span>
        </button>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div style={{
          background: '#dcfce7',
          border: '1px solid #86efac',
          color: '#14532d',
          padding: '0.9rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)'
        }}>
          <CheckCircle2 size={20} color="#16a34a" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#7f1d1d',
          padding: '0.9rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)'
        }}>
          <AlertCircle size={20} color="#dc2626" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tarjetas de Métricas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.75rem'
      }}>
        <div style={metricCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Catálogo</span>
            <BookOpen size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {metricas.total}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600 }}>Asignaturas registradas</span>
        </div>

        <div style={metricCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Asignaturas Activas</span>
            <CheckCircle2 size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#15803d', marginTop: '6px' }}>
            {metricas.activas}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>Disponibles para asignación</span>
        </div>

        <div style={metricCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Áreas del Saber</span>
            <Layers size={18} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {metricas.areasUnicas}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600 }}>Áreas pedagógicas</span>
        </div>

        <div style={metricCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Intensidad Promedio</span>
            <Clock size={18} color="#ea580c" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {metricas.promHoras} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>hrs/sem</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 600 }}>Carga horaria base</span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div style={{
        background: '#ffffff',
        padding: '1.25rem 1.5rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Buscar por nombre, código o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.4rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="ALL">Todas las Áreas</option>
            {Array.from(new Set(materias.map(m => m.area || 'General'))).map(ar => (
              <option key={ar} value={ar}>{ar}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Solo Activas</option>
            <option value="INACTIVE">Solo Inactivas</option>
          </select>

          {(search || selectedArea !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedArea('ALL');
                setSelectedStatus('ALL');
              }}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#475569',
                padding: '0.65rem 0.9rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Asignaturas */}
      {cargando ? (
        <div style={{ padding: '4rem 0', textAlign: 'center', color: '#64748b' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #166534',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <span>Cargando catálogo de asignaturas...</span>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          overflowX: 'auto',
          boxShadow: '0 16px 32px rgba(15, 23, 42, 0.03)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={thStyle}>Código</th>
                <th style={thStyle}>Asignatura</th>
                <th style={thStyle}>Área Académica</th>
                <th style={thStyle}>Intensidad</th>
                <th style={thStyle}>Estado</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materiasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Library size={38} strokeWidth={1.5} style={{ margin: '0 auto 0.75rem', display: 'block', color: '#cbd5e1' }} />
                    <p style={{ margin: 0, fontWeight: 600, color: '#475569' }}>No se encontraron asignaturas con los criterios indicados.</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Crea una nueva asignatura con el botón superior.</p>
                  </td>
                </tr>
              ) : (
                materiasFiltradas.map((m) => (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      opacity: m.activo ? 1 : 0.65,
                      background: m.activo ? 'transparent' : '#fcfcfc'
                    }}
                  >
                    {/* Código */}
                    <td style={tdStyle}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        background: '#f1f5f9',
                        color: '#0f172a',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {m.codigo || '—'}
                      </span>
                    </td>

                    {/* Asignatura */}
                    <td style={tdStyle}>
                      <div>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', display: 'block' }}>
                          {m.nombre}
                        </span>
                        {m.descripcion && (
                          <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                            {m.descripcion}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Área */}
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '20px'
                      }}>
                        {m.area || 'General'}
                      </span>
                    </td>

                    {/* Intensidad Horaria */}
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.88rem', color: '#334155', fontWeight: 600 }}>
                        {m.intensidad_horaria || 0} hrs/sem
                      </span>
                    </td>

                    {/* Estado */}
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleToggle(m.id)}
                        title="Clic para cambiar estado activo/inactivo"
                        style={{
                          background: m.activo ? '#dcfce7' : '#f1f5f9',
                          color: m.activo ? '#15803d' : '#64748b',
                          border: `1px solid ${m.activo ? '#86efac' : '#cbd5e1'}`,
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        {m.activo ? <Check size={12} strokeWidth={3} /> : <Ban size={12} strokeWidth={2.5} />}
                        <span>{m.activo ? 'Activa' : 'Inactiva'}</span>
                      </button>
                    </td>

                    {/* Acciones */}
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          onClick={() => abrirModal(m)}
                          style={{
                            background: '#e0f2fe',
                            color: '#0284c7',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Editar Asignatura"
                        >
                          <Pencil size={14} />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => handleEliminar(m)}
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Eliminar o Desactivar"
                        >
                          <Trash2 size={14} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  {editandoMateria ? 'Editar Asignatura' : 'Nueva Asignatura'}
                </h2>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  {editandoMateria
                    ? 'Modifica los parámetros académicos de la materia.'
                    : 'Ingresa los datos para registrar una nueva materia en el catálogo institucional.'}
                </p>
              </div>
              <button
                onClick={cerrarModal}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardar}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <label style={formLabelStyle}>
                    Nombre de la Asignatura *
                    <input
                      type="text"
                      placeholder="Ej. Robótica y Programación"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      style={formInputStyle}
                      required
                    />
                  </label>

                  <label style={formLabelStyle}>
                    Código / Sigla
                    <input
                      type="text"
                      placeholder="Ej. ROB"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                      style={{ ...formInputStyle, textTransform: 'uppercase' }}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                  <label style={formLabelStyle}>
                    Área Académica
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      style={formInputStyle}
                    >
                      {AREAS_COMUNES.map((ar) => (
                        <option key={ar} value={ar}>{ar}</option>
                      ))}
                      <option value="OTRA">Otra (Especificar)...</option>
                    </select>
                  </label>

                  <label style={formLabelStyle}>
                    Intensidad (hrs/semana)
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={intensidadHoraria}
                      onChange={(e) => setIntensidadHoraria(e.target.value)}
                      style={formInputStyle}
                    />
                  </label>
                </div>

                {area === 'OTRA' && (
                  <label style={formLabelStyle}>
                    Especificar Área Académica *
                    <input
                      type="text"
                      placeholder="Nombre del área del conocimiento"
                      value={areaPersonalizada}
                      onChange={(e) => setAreaPersonalizada(e.target.value)}
                      style={formInputStyle}
                      required
                    />
                  </label>
                )}

                <label style={formLabelStyle}>
                  Descripción / Enfoque Curricular
                  <textarea
                    placeholder="Detalles sobre las competencias, objetivos o temas cubiertos..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={3}
                    style={{ ...formInputStyle, resize: 'vertical' }}
                  />
                </label>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#f8fafc',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <input
                    type="checkbox"
                    id="chk-activo"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#166534' }}
                  />
                  <label htmlFor="chk-activo" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    Asignatura Activa (disponible para asignación a cursos y docentes)
                  </label>
                </div>
              </div>

              {errorMsg && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, marginTop: '1rem' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={cerrarModal}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '0.7rem 1.25rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{
                    background: '#166534',
                    border: 'none',
                    color: '#ffffff',
                    padding: '0.7rem 1.4rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(22, 101, 52, 0.25)'
                  }}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Guardando...'
                    : editandoMateria ? 'Guardar Cambios' : 'Crear Asignatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const metricCardStyle = {
  background: '#ffffff',
  padding: '1.25rem',
  borderRadius: '14px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.02)'
};

const filterSelectStyle = {
  padding: '0.65rem 1rem',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#334155',
  background: '#ffffff',
  outline: 'none',
  cursor: 'pointer'
};

const thStyle = {
  padding: '1rem 1.25rem',
  color: '#475569',
  fontSize: '0.82rem',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase'
};

const tdStyle = {
  padding: '1.1rem 1.25rem',
  color: '#334155',
  fontSize: '0.9rem',
  verticalAlign: 'middle'
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.45)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  zIndex: 100
};

const modalBoxStyle = {
  background: '#ffffff',
  width: '100%',
  maxWidth: '620px',
  borderRadius: '20px',
  padding: '2rem',
  boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const formLabelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '0.88rem',
  fontWeight: 700,
  color: '#334155'
};

const formInputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  fontSize: '0.92rem',
  color: '#0f172a',
  outline: 'none'
};
