import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import BlurFade from '../../components/BlurFade';
import BarraTitulo from '../../components/BarraTitulo';
import {
  getTareasDocente,
  crearTareaDocente,
  actualizarTareaDocente,
  eliminarTareaDocente,
  getEntregasTarea,
  calificarEntregaTarea,
  getMyCoursesAndSubjects,
  getBimestres,
  getIndicadoresBimestre,
  formatearFecha
} from '../../services/api';

export default function TareasDocente() {
  const [tareas, setTareas] = useState([]);
  const [cursosMaterias, setCursosMaterias] = useState([]);
  const [bimestresList, setBimestresList] = useState([]);
  const [indicadoresList, setIndicadoresList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargandoBimestres, setCargandoBimestres] = useState(false);
  const [cargandoIndicadores, setCargandoIndicadores] = useState(false);
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalEntregas, setModalEntregas] = useState(null);
  const [entregasData, setEntregasData] = useState(null);
  const [cargandoEntregas, setCargandoEntregas] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_vencimiento: '',
    curso_id: '',
    materia_id: '',
    estado: 'PUBLICADA',
    califica_bimestre: false,
    bimestre_id: '',
    indicador_id: '',
    numero_nota: '',
    tipo_evaluacion: 'Taller'
  });
  const [guardando, setGuardando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setCargandoBimestres(true);
      const [tareasRes, cursosRes, bimestresRes] = await Promise.all([
        getTareasDocente(),
        getMyCoursesAndSubjects(),
        getBimestres().catch(err => {
          console.warn('No se pudieron cargar bimestres:', err);
          return [];
        })
      ]);

      const listaTareas = tareasRes?.data ? tareasRes.data : (Array.isArray(tareasRes) ? tareasRes : []);
      const listaCursos = cursosRes?.data ? cursosRes.data : (Array.isArray(cursosRes) ? cursosRes : []);
      const listaBimestres = bimestresRes?.data ? bimestresRes.data : (Array.isArray(bimestresRes) ? bimestresRes : []);

      setTareas(listaTareas);
      setCursosMaterias(listaCursos);
      setBimestresList(listaBimestres);
    } catch (err) {
      console.error('Error cargando tareas o cursos:', err);
    } finally {
      setLoading(false);
      setCargandoBimestres(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cargar indicadores de logro dinámicamente cuando el docente vincula a calificación bimestral
  useEffect(() => {
    if (!formData.califica_bimestre || !formData.curso_id || !formData.materia_id || !formData.bimestre_id) {
      setIndicadoresList([]);
      return;
    }

    const cargarIndicadores = async () => {
      try {
        setCargandoIndicadores(true);
        const res = await getIndicadoresBimestre({
          cursoId: formData.curso_id,
          materiaId: formData.materia_id,
          bimestreId: formData.bimestre_id
        });
        const data = res?.data ? res.data : (Array.isArray(res) ? res : []);
        setIndicadoresList(data);

        // Si el indicador seleccionado actualmente no pertenece a los nuevos indicadores cargados, limpiarlo
        if (formData.indicador_id && !data.some(i => String(i.id) === String(formData.indicador_id))) {
          setFormData(prev => ({ ...prev, indicador_id: '' }));
        }
      } catch (err) {
        console.warn('Error cargando indicadores para la tarea:', err);
        setIndicadoresList([]);
      } finally {
        setCargandoIndicadores(false);
      }
    };

    cargarIndicadores();
  }, [formData.califica_bimestre, formData.curso_id, formData.materia_id, formData.bimestre_id]);

  const abrirCrear = () => {
    const primerCurso = cursosMaterias.length > 0 ? cursosMaterias[0].curso_id : '';
    const primeraMateria = cursosMaterias.length > 0 && cursosMaterias[0].materias?.length > 0 ? cursosMaterias[0].materias[0].materia_id : '';

    setFormData({
      titulo: '',
      descripcion: '',
      fecha_vencimiento: '',
      curso_id: primerCurso,
      materia_id: primeraMateria,
      estado: 'PUBLICADA',
      califica_bimestre: false,
      bimestre_id: '',
      indicador_id: '',
      numero_nota: '',
      tipo_evaluacion: 'Taller'
    });
    setMensajeError('');
    setModalCrear(true);
  };

  const abrirEditar = (tarea) => {
    setModalEditar(tarea);
    setFormData({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion || '',
      fecha_vencimiento: tarea.fecha_vencimiento ? tarea.fecha_vencimiento.split('T')[0] : '',
      curso_id: tarea.curso_id,
      materia_id: tarea.materia_id,
      estado: tarea.estado,
      califica_bimestre: Boolean(tarea.califica_bimestre),
      bimestre_id: tarea.bimestre_id ? String(tarea.bimestre_id) : '',
      indicador_id: tarea.indicador_id ? String(tarea.indicador_id) : '',
      numero_nota: tarea.numero_nota ? String(tarea.numero_nota) : '',
      tipo_evaluacion: tarea.tipo_evaluacion || 'Taller'
    });
    setMensajeError('');
  };

  const handleGuardarCrear = async (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.fecha_vencimiento || !formData.curso_id || !formData.materia_id) {
      setMensajeError('Todos los campos marcados con (*) son obligatorios.');
      return;
    }

    if (formData.califica_bimestre) {
      if (!formData.bimestre_id) {
        setMensajeError('Selecciona el bimestre.');
        return;
      }
      if (!formData.indicador_id) {
        setMensajeError('Selecciona el indicador de logro.');
        return;
      }
      if (!formData.numero_nota) {
        setMensajeError('Selecciona el número de nota.');
        return;
      }
    }

    try {
      setGuardando(true);
      setMensajeError('');
      await crearTareaDocente({
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        fecha_vencimiento: formData.fecha_vencimiento,
        curso_id: parseInt(formData.curso_id),
        materia_id: parseInt(formData.materia_id),
        estado: formData.estado,
        califica_bimestre: formData.califica_bimestre,
        bimestre_id: formData.califica_bimestre ? parseInt(formData.bimestre_id) : null,
        indicador_id: formData.califica_bimestre ? parseInt(formData.indicador_id) : null,
        numero_nota: formData.califica_bimestre ? parseInt(formData.numero_nota) : null,
        tipo_evaluacion: formData.tipo_evaluacion
      });
      setModalCrear(false);
      await cargarDatos();
    } catch (err) {
      setMensajeError(err.message || 'Error al crear la tarea');
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarEditar = async (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.fecha_vencimiento) {
      setMensajeError('Título y Fecha de vencimiento son obligatorios.');
      return;
    }

    if (formData.califica_bimestre) {
      if (!formData.bimestre_id) {
        setMensajeError('Selecciona el bimestre.');
        return;
      }
      if (!formData.indicador_id) {
        setMensajeError('Selecciona el indicador de logro.');
        return;
      }
      if (!formData.numero_nota) {
        setMensajeError('Selecciona el número de nota.');
        return;
      }
    }

    try {
      setGuardando(true);
      setMensajeError('');
      await actualizarTareaDocente(modalEditar.id, {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        fecha_vencimiento: formData.fecha_vencimiento,
        curso_id: parseInt(formData.curso_id),
        materia_id: parseInt(formData.materia_id),
        estado: formData.estado,
        califica_bimestre: formData.califica_bimestre,
        bimestre_id: formData.califica_bimestre ? parseInt(formData.bimestre_id) : null,
        indicador_id: formData.califica_bimestre ? parseInt(formData.indicador_id) : null,
        numero_nota: formData.califica_bimestre ? parseInt(formData.numero_nota) : null,
        tipo_evaluacion: formData.tipo_evaluacion
      });
      setModalEditar(null);
      await cargarDatos();
    } catch (err) {
      setMensajeError(err.message || 'Error al actualizar la tarea');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (tareaId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta tarea y sus entregas asociadas?')) return;
    try {
      await eliminarTareaDocente(tareaId);
      await cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al eliminar tarea');
    }
  };

  const abrirEntregas = async (tarea) => {
    setModalEntregas(tarea);
    try {
      setCargandoEntregas(true);
      const res = await getEntregasTarea(tarea.id);
      setEntregasData(res?.data ? res.data : res);
    } catch (err) {
      console.error('Error cargando entregas:', err);
    } finally {
      setCargandoEntregas(false);
    }
  };

  const handleCalificar = async (estudianteId, calificacion, comentarios, estado) => {
    try {
      const resCalificar = await calificarEntregaTarea(modalEntregas.id, {
        estudiante_id: estudianteId,
        calificacion: calificacion === '' ? null : parseFloat(calificacion),
        comentarios,
        estado
      });
      // Recargar entregas
      const res = await getEntregasTarea(modalEntregas.id);
      setEntregasData(res?.data ? res.data : res);
      // Recargar tareas para actualizar contadores
      await cargarDatos();
      if (resCalificar?.sincronizado_bimestre) {
        console.log('✅ Calificación sincronizada con Gestión Académica (calificaciones_bimestre)');
      }
    } catch (err) {
      alert(err.message || 'Error al registrar calificación');
    }
  };

  // Obtener materias disponibles según el curso seleccionado
  const materiasDelCursoSeleccionado = cursosMaterias.find(
    c => String(c.curso_id) === String(formData.curso_id)
  )?.materias || [];

  // Elementos seleccionados para el Resumen Visual
  const bimestreSeleccionado = bimestresList.find(b => String(b.id) === String(formData.bimestre_id));
  const indicadorSeleccionado = indicadoresList.find(i => String(i.id) === String(formData.indicador_id));
  const notaSeleccionada = formData.numero_nota;
  const resumenValido = Boolean(formData.califica_bimestre && bimestreSeleccionado && indicadorSeleccionado && notaSeleccionada);

  // Filtrado de tareas
  const tareasFiltradas = tareas.filter(t => {
    if (filtroCurso && String(t.curso_id) !== String(filtroCurso)) return false;
    if (filtroEstado && t.estado !== filtroEstado) return false;
    return true;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand border-t-transparent mx-auto mb-4"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando módulo de tareas...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <BlurFade delay={0.05} duration={0.35}>
        <BarraTitulo
          titulo="Gestión de Tareas Académicas"
          subtitulo="Asigna actividades evaluables, revisa entregas de estudiantes y sincroniza notas bimestrales."
          derecha={
            <button
              onClick={abrirCrear}
              className="btn btn--primary"
              style={{
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(17, 153, 142, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>+</span> Nueva Tarea
            </button>
          }
        />
      </BlurFade>

      {/* Filtros */}
      <BlurFade delay={0.1} duration={0.35}>
        <Card className="card-slim">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Curso:</label>
              <select
                value={filtroCurso}
                onChange={e => setFiltroCurso(e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--border)' }}
              >
                <option value="">Todos los cursos</option>
                {cursosMaterias.map(c => (
                  <option key={c.curso_id} value={c.curso_id}>
                    {c.curso_nombre || `${c.curso_nivel}${c.curso_letra}`}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Estado:</label>
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--border)' }}
              >
                <option value="">Todos los estados</option>
                <option value="PUBLICADA">PUBLICADA</option>
                <option value="BORRADOR">BORRADOR</option>
                <option value="CERRADA">CERRADA</option>
              </select>
            </div>

            <div style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Total tareas: <strong>{tareasFiltradas.length}</strong>
            </div>
          </div>
        </Card>
      </BlurFade>

      {/* Listado de Tareas */}
      <BlurFade delay={0.15} duration={0.35}>
        {tareasFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '2.5rem' }}>📝</span>
            <h3 style={{ marginTop: '0.5rem', color: 'var(--text-primary)' }}>No hay tareas registradas</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Crea una nueva tarea para comenzar a recibir entregas.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {tareasFiltradas.map(tarea => (
              <div
                key={tarea.id}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                {/* Header Tarea */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--brand)',
                      letterSpacing: '0.5px'
                    }}>
                      {tarea.curso_grado || tarea.curso_nombre} · {tarea.materia_nombre}
                    </span>
                    <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {tarea.titulo}
                    </h3>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor:
                      tarea.estado === 'PUBLICADA' ? 'rgba(16, 185, 129, 0.1)' :
                      tarea.estado === 'BORRADOR' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color:
                      tarea.estado === 'PUBLICADA' ? '#10b981' :
                      tarea.estado === 'BORRADOR' ? '#ca8a04' : '#ef4444'
                  }}>
                    {tarea.estado}
                  </span>
                </div>

                {/* Badge de Sincronización Bimestral */}
                {tarea.califica_bimestre && (
                  <div style={{
                    padding: '0.4rem 0.65rem',
                    borderRadius: '8px',
                    background: 'rgba(17, 153, 142, 0.08)',
                    border: '1px solid rgba(17, 153, 142, 0.2)',
                    fontSize: '0.76rem',
                    color: '#0e4d2b',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span>🎯</span>
                    <span>
                      {tarea.bimestre_nombre || 'Bimestre'} · Indicador {tarea.indicador_numero || tarea.indicador_id} (Nota {tarea.numero_nota})
                    </span>
                  </div>
                )}

                {/* Descripción */}
                {tarea.descripcion && (
                  <p style={{
                    fontSize: '0.86rem',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {tarea.descripcion}
                  </p>
                )}

                {/* Info Vencimiento y Entregas */}
                <div style={{
                  padding: '0.75rem',
                  background: 'var(--surface, #f8fafc)',
                  borderRadius: '12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  fontSize: '0.8rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Vencimiento:</span>
                    <strong>{tarea.fecha_vencimiento ? formatearFecha(tarea.fecha_vencimiento) : 'Sin fecha'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Entregas / Total:</span>
                    <strong style={{ color: tarea.total_entregadas > 0 ? '#10b981' : 'inherit' }}>
                      {tarea.total_entregadas ?? 0} / {tarea.total_estudiantes ?? 0}
                    </strong>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <button
                    onClick={() => abrirEntregas(tarea)}
                    style={{
                      flex: 2,
                      background: 'var(--brand, #11998e)',
                      color: '#fff',
                      border: 'none',
                      padding: '0.55rem 0.8rem',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    📊 Entregas y Calificar
                  </button>
                  <button
                    onClick={() => abrirEditar(tarea)}
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.05)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      padding: '0.55rem 0.8rem',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(tarea.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: 'none',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                    title="Eliminar tarea"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </BlurFade>

      {/* MODAL CREAR / EDITAR TAREA */}
      {(modalCrear || modalEditar) && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 999
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            maxWidth: '640px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: '#fff',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                {modalCrear ? 'Crear Nueva Tarea Académica' : 'Editar Tarea'}
              </h3>
              <button
                onClick={() => { setModalCrear(false); setModalEditar(null); }}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={modalCrear ? handleGuardarCrear : handleGuardarEditar} style={{ padding: '1.5rem', display: 'grid', gap: '1.15rem' }}>
              {mensajeError && (
                <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.88rem', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚠️</span>
                  <span>{mensajeError}</span>
                </div>
              )}

              {/* Título */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Título de la Tarea *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Taller de fracciones y decimales"
                  value={formData.titulo}
                  onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.95rem' }}
                />
              </div>

              {/* Curso y Materia */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Curso Asignado *
                  </label>
                  <select
                    value={formData.curso_id}
                    onChange={e => {
                      const nuevoCursoId = e.target.value;
                      const cursoObj = cursosMaterias.find(c => String(c.curso_id) === String(nuevoCursoId));
                      const primeraMateria = cursoObj?.materias?.[0]?.materia_id || '';
                      setFormData({
                        ...formData,
                        curso_id: nuevoCursoId,
                        materia_id: primeraMateria,
                        indicador_id: '',
                        numero_nota: ''
                      });
                    }}
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.95rem' }}
                  >
                    {cursosMaterias.map(c => (
                      <option key={c.curso_id} value={c.curso_id}>
                        {c.curso_nombre || `${c.curso_nivel}${c.curso_letra}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Asignatura *
                  </label>
                  <select
                    value={formData.materia_id}
                    onChange={e => {
                      setFormData({
                        ...formData,
                        materia_id: e.target.value,
                        indicador_id: '',
                        numero_nota: ''
                      });
                    }}
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.95rem' }}
                  >
                    {materiasDelCursoSeleccionado.map(m => (
                      <option key={m.materia_id} value={m.materia_id}>
                        {m.materia_nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vencimiento y Estado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Fecha de Vencimiento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_vencimiento}
                    onChange={e => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.95rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Estado *
                  </label>
                  <select
                    value={formData.estado}
                    onChange={e => setFormData({ ...formData, estado: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.95rem' }}
                  >
                    <option value="PUBLICADA">PUBLICADA (Visible para alumnos)</option>
                    <option value="BORRADOR">BORRADOR</option>
                    <option value="CERRADA">CERRADA</option>
                  </select>
                </div>
              </div>

              {/* 1. NUEVO CONTROL PRINCIPAL: CHECKBOX / SWITCH */}
              <div style={{
                padding: '0.85rem 1.1rem',
                borderRadius: '12px',
                background: formData.califica_bimestre ? 'rgba(17, 153, 142, 0.08)' : '#f8fafc',
                border: formData.califica_bimestre ? '1.5px solid #11998e' : '1px solid var(--border)',
                transition: 'all 0.2s'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: formData.califica_bimestre ? '#0f766e' : 'var(--text-primary)',
                  userSelect: 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.califica_bimestre}
                    onChange={e => {
                      const checked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        califica_bimestre: checked,
                        bimestre_id: checked ? (prev.bimestre_id || (bimestresList[0]?.id ? String(bimestresList[0].id) : '')) : '',
                        indicador_id: checked ? prev.indicador_id : '',
                        numero_nota: checked ? prev.numero_nota : ''
                      }));
                    }}
                    style={{ width: '19px', height: '19px', accentColor: 'var(--brand)', cursor: 'pointer' }}
                  />
                  <span>Esta tarea genera una nota bimestral</span>
                </label>
              </div>

              {/* 2. SECCIÓN DE CONFIGURACIÓN ACADÉMICA (DINÁMICA) */}
              {formData.califica_bimestre && (
                <div style={{
                  padding: '1.25rem',
                  borderRadius: '16px',
                  background: '#f8fafc',
                  border: '1.5px solid rgba(17, 153, 142, 0.3)',
                  boxShadow: '0 4px 16px rgba(17, 153, 142, 0.05)',
                  display: 'grid',
                  gap: '1.1rem'
                }}>
                  {/* Encabezado de la sección */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.98rem', color: '#0f766e' }}>
                      <span>📊</span>
                      <span>Configuración de calificación bimestral</span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Esta tarea utilizará su calificación como una de las notas parciales del bimestre.
                    </p>
                  </div>

                  {/* 3. Selector de Bimestre */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                      Bimestre *
                    </label>
                    <select
                      value={formData.bimestre_id}
                      onChange={e => {
                        setFormData({
                          ...formData,
                          bimestre_id: e.target.value,
                          indicador_id: '',
                          numero_nota: ''
                        });
                      }}
                      disabled={cargandoBimestres}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        fontSize: '0.92rem',
                        background: '#fff'
                      }}
                    >
                      <option value="">[ Seleccionar bimestre ▼ ]</option>
                      {bimestresList.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.nombre} {b.anio ? `(${b.anio})` : ''}
                        </option>
                      ))}
                    </select>
                    {cargandoBimestres && (
                      <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                        Cargando bimestres...
                      </small>
                    )}
                  </div>

                  {/* 4. Selector de Indicador */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                      Indicador de logro *
                    </label>
                    <select
                      value={formData.indicador_id}
                      onChange={e => setFormData({ ...formData, indicador_id: e.target.value })}
                      disabled={!formData.bimestre_id || cargandoIndicadores || indicadoresList.length === 0}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        fontSize: '0.92rem',
                        background: (!formData.bimestre_id || cargandoIndicadores) ? '#f1f5f9' : '#fff',
                        cursor: (!formData.bimestre_id || cargandoIndicadores) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="">
                        {!formData.bimestre_id
                          ? 'Selecciona primero un bimestre'
                          : cargandoIndicadores
                          ? 'Cargando indicadores...'
                          : indicadoresList.length === 0
                          ? 'No hay indicadores configurados para esta combinación'
                          : '[ Seleccionar indicador ▼ ]'}
                      </option>
                      {indicadoresList.map(ind => (
                        <option key={ind.id} value={ind.id}>
                          Indicador {ind.numero}: {ind.descripcion?.length > 70 ? `${ind.descripcion.substring(0, 70)}...` : ind.descripcion}
                        </option>
                      ))}
                    </select>

                    {!formData.bimestre_id ? (
                      <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                        Selecciona primero un bimestre.
                      </small>
                    ) : cargandoIndicadores ? (
                      <small style={{ color: '#0f766e', display: 'block', marginTop: '0.25rem' }}>
                        Cargando indicadores...
                      </small>
                    ) : indicadoresList.length === 0 ? (
                      <small style={{ color: '#dc2626', display: 'block', marginTop: '0.25rem', fontWeight: 500 }}>
                        No hay indicadores configurados para esta combinación.
                      </small>
                    ) : null}
                  </div>

                  {/* 5. Selector de Número de Nota y Tipo de Evaluación */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                        Número de nota *
                      </label>
                      <select
                        value={formData.numero_nota}
                        onChange={e => setFormData({ ...formData, numero_nota: e.target.value })}
                        disabled={!formData.indicador_id}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.9rem',
                          borderRadius: '10px',
                          border: '1px solid var(--border)',
                          fontSize: '0.92rem',
                          background: !formData.indicador_id ? '#f1f5f9' : '#fff',
                          cursor: !formData.indicador_id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <option value="">
                          {!formData.indicador_id ? 'Selecciona primero un indicador' : '[ Seleccionar nota ▼ ]'}
                        </option>
                        {formData.indicador_id && (
                          <>
                            <option value="1">Nota 1</option>
                            <option value="2">Nota 2</option>
                            <option value="3">Nota 3</option>
                          </>
                        )}
                      </select>
                      {!formData.indicador_id && (
                        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                          Selecciona primero un indicador.
                        </small>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                        Tipo de evaluación
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Taller, Examen, Quiz..."
                        value={formData.tipo_evaluacion || ''}
                        onChange={e => setFormData({ ...formData, tipo_evaluacion: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.9rem',
                          borderRadius: '10px',
                          border: '1px solid var(--border)',
                          fontSize: '0.92rem',
                          background: '#fff'
                        }}
                      />
                    </div>
                  </div>

                  {/* 6. RESUMEN VISUAL DEL DESTINO */}
                  <div style={{
                    marginTop: '0.25rem',
                    padding: '0.9rem 1.1rem',
                    borderRadius: '12px',
                    background: '#ffffff',
                    border: '1px dashed #0f766e',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ fontWeight: 700, color: '#0f766e', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📍 Destino de calificación</span>
                    </div>
                    {resumenValido ? (
                      <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.84rem', color: '#1e293b', lineHeight: '1.6' }}>
                        <div style={{ fontWeight: 700, color: '#0f766e' }}>
                          {bimestreSeleccionado.nombre}
                        </div>
                        <div style={{ paddingLeft: '1rem', color: '#334155' }}>
                          └── Indicador {indicadorSeleccionado.numero}: {indicadorSeleccionado.descripcion}
                        </div>
                        <div style={{ paddingLeft: '2rem', color: '#059669', fontWeight: 700 }}>
                          └── Nota {notaSeleccionada}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.82rem' }}>
                        Selecciona el bimestre, indicador y número de nota.
                      </div>
                    )}
                  </div>

                  {/* 7. CONFIRMACIÓN VISUAL */}
                  {resumenValido && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#065f46',
                      fontSize: '0.83rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>ℹ️</span>
                      <div>
                        <span>Esta tarea utilizará la calificación obtenida por cada estudiante como:</span>
                        <div style={{ fontWeight: 700, marginTop: '2px' }}>
                          {bimestreSeleccionado.nombre} → Indicador {indicadorSeleccionado.numero} → Nota {notaSeleccionada}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Descripción e Instrucciones */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Descripción e Instrucciones
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre la tarea, pautas de evaluación y entregables..."
                  value={formData.descripcion}
                  onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.95rem', resize: 'vertical' }}
                />
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setModalCrear(false); setModalEditar(null); }}
                  style={{ background: '#f1f5f9', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    background: 'var(--brand)',
                    color: '#fff',
                    border: 'none',
                    padding: '0.65rem 1.5rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {guardando ? 'Guardando...' : (modalCrear ? 'Crear Tarea' : 'Guardar Cambios')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ENTREGAS Y CALIFICACIÓN */}
      {modalEntregas && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 999
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            maxWidth: '850px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: '#fff',
              padding: '1.25rem 1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Entregas: {modalEntregas.titulo}
                </h3>
                <small style={{ opacity: 0.9 }}>
                  {modalEntregas.curso_grado || modalEntregas.curso_nombre} · {modalEntregas.materia_nombre}
                  {modalEntregas.califica_bimestre && (
                    <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                      🎯 Sincroniza: Indicador {modalEntregas.indicador_numero || modalEntregas.indicador_id} (Nota {modalEntregas.numero_nota})
                    </span>
                  )}
                </small>
              </div>
              <button
                onClick={() => { setModalEntregas(null); setEntregasData(null); }}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {cargandoEntregas ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-brand border-t-transparent mx-auto mb-3"></div>
                  <p>Cargando lista de estudiantes...</p>
                </div>
              ) : (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    padding: '0.75rem 1rem',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    fontSize: '0.9rem'
                  }}>
                    <span><strong>Total Estudiantes:</strong> {entregasData?.total_estudiantes ?? 0}</span>
                    <span><strong>Entregas Recibidas:</strong> {entregasData?.total_entregadas ?? 0}</span>
                  </div>

                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {entregasData?.entregas?.map(entrega => (
                      <div
                        key={entrega.estudiante_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.9rem 1.1rem',
                          borderRadius: '12px',
                          border: '1px solid var(--border)',
                          background: entrega.estado === 'CALIFICADA' ? 'rgba(16, 185, 129, 0.04)' : '#fff',
                          gap: '1rem',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div style={{ flex: '1 1 200px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {entrega.estudiante_nombre}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Estado: <span style={{
                              fontWeight: 600,
                              color:
                                entrega.estado === 'CALIFICADA' ? '#059669' :
                                entrega.estado === 'ENTREGADA' ? '#0284c7' : '#e11d48'
                            }}>
                              {entrega.estado}
                            </span>
                          </div>
                        </div>

                        {/* Input de Calificación y Botón Guardar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <input
                            type="number"
                            step="0.1"
                            min="0.0"
                            max="5.0"
                            placeholder="Nota (0.0 - 5.0)"
                            defaultValue={entrega.calificacion ?? ''}
                            id={`nota-input-${entrega.estudiante_id}`}
                            style={{
                              width: '130px',
                              padding: '0.45rem 0.7rem',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              textAlign: 'center'
                            }}
                          />
                          <button
                            onClick={() => {
                              const inputEl = document.getElementById(`nota-input-${entrega.estudiante_id}`);
                              const notaVal = inputEl ? inputEl.value : null;
                              handleCalificar(
                                entrega.estudiante_id,
                                notaVal,
                                entrega.comentarios || '',
                                notaVal !== '' && notaVal !== null ? 'CALIFICADA' : 'ENTREGADA'
                              );
                            }}
                            style={{
                              background: 'var(--brand)',
                              color: '#fff',
                              border: 'none',
                              padding: '0.45rem 0.9rem',
                              borderRadius: '8px',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer'
                            }}
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.75rem', background: '#f8fafc', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setModalEntregas(null); setEntregasData(null); }}
                style={{
                  background: '#64748b',
                  color: '#fff',
                  border: 'none',
                  padding: '0.6rem 1.4rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
