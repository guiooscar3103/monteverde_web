import { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../../components/Card';
import BlurFade from '../../components/BlurFade';
import BarraTitulo from '../../components/BarraTitulo';
import {
  ClipboardList,
  Target,
  BarChart3,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  MapPin,
  Info,
  Plus,
  Calendar,
  Layers,
  BookOpen,
  GraduationCap
} from 'lucide-react';
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
  getConfiguracionEvaluacionActiva,
  formatearFecha
} from '../../services/api';

export default function TareasDocente() {
  const [tareas, setTareas] = useState([]);
  const [cursosMaterias, setCursosMaterias] = useState([]);
  const [bimestresList, setBimestresList] = useState([]);
  const [indicadoresList, setIndicadoresList] = useState([]);
  const [configEvaluacion, setConfigEvaluacion] = useState(null);
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

  // Carga independiente y resiliente de bimestres
  const recargarBimestres = useCallback(async () => {
    try {
      setCargandoBimestres(true);
      const res = await getBimestres();
      const lista = res?.data ? res.data : (Array.isArray(res) ? res : []);
      setBimestresList(lista);
      return lista;
    } catch (err) {
      console.warn('⚠️ Error al cargar catálogo de bimestres:', err);
      return [];
    } finally {
      setCargandoBimestres(false);
    }
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [tareasRes, cursosRes, bimestresRes, configRes] = await Promise.all([
        getTareasDocente().catch(err => {
          console.warn('No se pudieron cargar tareas:', err);
          return [];
        }),
        getMyCoursesAndSubjects().catch(err => {
          console.warn('No se pudieron cargar asignaciones académicas:', err);
          return [];
        }),
        getBimestres().catch(err => {
          console.warn('No se pudieron cargar bimestres:', err);
          return [];
        }),
        getConfiguracionEvaluacionActiva().catch(() => null)
      ]);

      const listaTareas = tareasRes?.data ? tareasRes.data : (Array.isArray(tareasRes) ? tareasRes : []);
      const listaCursos = cursosRes?.data ? cursosRes.data : (Array.isArray(cursosRes) ? cursosRes : []);
      const listaBimestres = bimestresRes?.data ? bimestresRes.data : (Array.isArray(bimestresRes) ? bimestresRes : []);

      setTareas(listaTareas);
      setCursosMaterias(listaCursos);
      setBimestresList(listaBimestres);
      if (configRes?.estructura) {
        setConfigEvaluacion(configRes.estructura);
      } else if (configRes) {
        setConfigEvaluacion(configRes);
      }
    } catch (err) {
      console.error('Error cargando tareas o cursos:', err);
    } finally {
      setLoading(false);
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

    let cancelado = false;

    const cargarIndicadores = async () => {
      try {
        setCargandoIndicadores(true);
        console.log(`📊 Cargando indicadores: Curso=${formData.curso_id}, Materia=${formData.materia_id}, Bimestre=${formData.bimestre_id}`);
        const res = await getIndicadoresBimestre({
          cursoId: Number.parseInt(formData.curso_id, 10),
          materiaId: Number.parseInt(formData.materia_id, 10),
          bimestreId: Number.parseInt(formData.bimestre_id, 10)
        });

        if (cancelado) return;

        const data = res?.data ? res.data : (Array.isArray(res) ? res : []);
        setIndicadoresList(data);

        // Si el indicador seleccionado actualmente no pertenece a los nuevos indicadores cargados, limpiarlo
        if (formData.indicador_id && !data.some(i => String(i.id) === String(formData.indicador_id))) {
          setFormData(prev => ({ ...prev, indicador_id: '' }));
        }
      } catch (err) {
        if (cancelado) return;
        console.warn('⚠️ Error cargando indicadores para la tarea:', err);
        setIndicadoresList([]);
      } finally {
        if (!cancelado) {
          setCargandoIndicadores(false);
        }
      }
    };

    cargarIndicadores();

    return () => {
      cancelado = true;
    };
  }, [formData.califica_bimestre, formData.curso_id, formData.materia_id, formData.bimestre_id]);

  // Obtener materias disponibles según el curso seleccionado en el formulario
  const materiasDelCursoSeleccionado = useMemo(() => {
    if (!formData.curso_id || !cursosMaterias.length) return [];
    const cursoObj = cursosMaterias.find(c => String(c.curso_id) === String(formData.curso_id));
    return cursoObj?.materias || [];
  }, [cursosMaterias, formData.curso_id]);

  const abrirCrear = async () => {
    // Si la lista de bimestres no está cargada, cargarla inmediatamente
    let bimsDisponibles = bimestresList;
    if (!bimsDisponibles || bimsDisponibles.length === 0) {
      bimsDisponibles = await recargarBimestres();
    }

    const primerCurso = cursosMaterias.length > 0 ? String(cursosMaterias[0].curso_id) : '';
    const cursoObj = cursosMaterias.find(c => String(c.curso_id) === primerCurso);
    const primeraMateria = cursoObj?.materias?.length > 0 ? String(cursoObj.materias[0].materia_id) : '';
    const primerBimestre = bimsDisponibles.length > 0 ? String(bimsDisponibles[0].id) : '';

    setFormData({
      titulo: '',
      descripcion: '',
      fecha_vencimiento: '',
      curso_id: primerCurso,
      materia_id: primeraMateria,
      estado: 'PUBLICADA',
      califica_bimestre: false,
      bimestre_id: primerBimestre,
      indicador_id: '',
      numero_nota: '',
      tipo_evaluacion: 'Taller'
    });
    setMensajeError('');
    setModalCrear(true);
  };

  const abrirEditar = async (tarea) => {
    // Asegurar catálogo de bimestres
    if (!bimestresList || bimestresList.length === 0) {
      await recargarBimestres();
    }

    setModalEditar(tarea);
    setFormData({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion || '',
      fecha_vencimiento: tarea.fecha_vencimiento ? tarea.fecha_vencimiento.split('T')[0] : '',
      curso_id: String(tarea.curso_id),
      materia_id: String(tarea.materia_id),
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
        setMensajeError('Debes seleccionar el período o bimestre correspondiente.');
        return;
      }
      if (!formData.indicador_id) {
        setMensajeError('Debes seleccionar el indicador de logro asociado.');
        return;
      }
      if (!formData.numero_nota) {
        setMensajeError('Debes seleccionar el número de nota parcial del indicador.');
        return;
      }
    }

    try {
      setGuardando(true);
      setMensajeError('');
      await crearTareaDocente({
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion?.trim() || '',
        fecha_vencimiento: formData.fecha_vencimiento,
        curso_id: Number.parseInt(formData.curso_id, 10),
        materia_id: Number.parseInt(formData.materia_id, 10),
        estado: formData.estado,
        califica_bimestre: Boolean(formData.califica_bimestre),
        bimestre_id: formData.califica_bimestre ? Number.parseInt(formData.bimestre_id, 10) : null,
        indicador_id: formData.califica_bimestre ? Number.parseInt(formData.indicador_id, 10) : null,
        numero_nota: formData.califica_bimestre ? Number.parseInt(formData.numero_nota, 10) : null,
        tipo_evaluacion: formData.tipo_evaluacion?.trim() || 'Taller'
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
        setMensajeError('Debes seleccionar el bimestre.');
        return;
      }
      if (!formData.indicador_id) {
        setMensajeError('Debes seleccionar el indicador de logro.');
        return;
      }
      if (!formData.numero_nota) {
        setMensajeError('Debes seleccionar el número de nota.');
        return;
      }
    }

    try {
      setGuardando(true);
      setMensajeError('');
      await actualizarTareaDocente(modalEditar.id, {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion?.trim() || '',
        fecha_vencimiento: formData.fecha_vencimiento,
        curso_id: Number.parseInt(formData.curso_id, 10),
        materia_id: Number.parseInt(formData.materia_id, 10),
        estado: formData.estado,
        califica_bimestre: Boolean(formData.califica_bimestre),
        bimestre_id: formData.califica_bimestre ? Number.parseInt(formData.bimestre_id, 10) : null,
        indicador_id: formData.califica_bimestre ? Number.parseInt(formData.indicador_id, 10) : null,
        numero_nota: formData.califica_bimestre ? Number.parseInt(formData.numero_nota, 10) : null,
        tipo_evaluacion: formData.tipo_evaluacion?.trim() || 'Taller'
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
    if (!globalThis.confirm('¿Estás seguro de que deseas eliminar esta tarea y sus entregas asociadas?')) return;
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
      await calificarEntregaTarea(modalEntregas.id, {
        estudiante_id: estudianteId,
        calificacion: calificacion === '' ? null : Number.parseFloat(calificacion),
        comentarios,
        estado
      });
      // Recargar entregas
      const res = await getEntregasTarea(modalEntregas.id);
      setEntregasData(res?.data ? res.data : res);
      // Recargar tareas para contadores
      await cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al registrar calificación');
    }
  };

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
              <Plus size={18} />
              <span>Nueva Tarea</span>
            </button>
          }
        />
      </BlurFade>

      {/* Filtros */}
      <BlurFade delay={0.1} duration={0.35}>
        <Card className="card-slim">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="filter-course-select" style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Curso:</label>
              <select
                id="filter-course-select"
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
              <label htmlFor="filter-status-select" style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Estado:</label>
              <select
                id="filter-status-select"
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
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#fff', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
              <ClipboardList size={48} strokeWidth={1.5} />
            </div>
            <h3 style={{ marginTop: '0.5rem', color: 'var(--text-primary)', fontWeight: 800 }}>No hay tareas registradas</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
              Crea una nueva tarea académica para asignar actividades evaluables y recibir entregas de tus estudiantes.
            </p>
            <button
              onClick={abrirCrear}
              className="btn btn--primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                fontWeight: 700
              }}
            >
              <Plus size={16} />
              <span>Crear mi primera tarea</span>
            </button>
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
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(17, 153, 142, 0.08)',
                    border: '1px solid rgba(17, 153, 142, 0.2)',
                    fontSize: '0.78rem',
                    color: '#0e4d2b',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Target size={14} style={{ flexShrink: 0, color: 'var(--brand)' }} />
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

                {/* Footer de Tarjeta: Entregas y Acciones */}
                <div style={{
                  marginTop: 'auto',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Vence: <strong>{formatearFecha ? formatearFecha(tarea.fecha_vencimiento) : tarea.fecha_vencimiento?.split('T')[0]}</strong></span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button
                      onClick={() => abrirEntregas(tarea)}
                      className="btn btn--outline btn--sm"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      Ver Entregas ({tarea.total_entregadas || 0}/{tarea.total_estudiantes || 0})
                    </button>
                    <button
                      onClick={() => abrirEditar(tarea)}
                      title="Editar Tarea"
                      style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)', borderRadius: '6px' }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleEliminar(tarea.id)}
                      title="Eliminar Tarea"
                      style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: '#ef4444', borderRadius: '6px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
            maxWidth: '660px',
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
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                {modalCrear ? 'Crear Nueva Tarea Académica' : 'Editar Tarea Académica'}
              </h3>
              <button
                onClick={() => { setModalCrear(false); setModalEditar(null); }}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={modalCrear ? handleGuardarCrear : handleGuardarEditar} style={{ padding: '1.5rem', display: 'grid', gap: '1.15rem' }}>
              {mensajeError && (
                <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.88rem', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{mensajeError}</span>
                </div>
              )}

              {/* Título */}
              <div>
                <label htmlFor="task-title-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Título de la Tarea *
                </label>
                <input
                  id="task-title-input"
                  type="text"
                  required
                  placeholder="Ej. Taller de ejercicios prácticos"
                  value={formData.titulo}
                  onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '0.95rem' }}
                />
              </div>

              {/* Curso y Materia */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label htmlFor="task-course-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Curso Asignado *
                  </label>
                  <select
                    id="task-course-select"
                    value={formData.curso_id}
                    onChange={e => {
                      const nuevoCursoId = e.target.value;
                      const cursoObj = cursosMaterias.find(c => String(c.curso_id) === String(nuevoCursoId));
                      const primeraMateria = cursoObj?.materias?.[0]?.materia_id ? String(cursoObj.materias[0].materia_id) : '';
                      setFormData(prev => ({
                        ...prev,
                        curso_id: nuevoCursoId,
                        materia_id: primeraMateria,
                        indicador_id: '',
                        numero_nota: ''
                      }));
                    }}
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '0.92rem' }}
                  >
                    {cursosMaterias.map(c => (
                      <option key={c.curso_id} value={c.curso_id}>
                        {c.curso_nombre || `${c.curso_nivel}${c.curso_letra}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="task-subject-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Asignatura *
                  </label>
                  <select
                    id="task-subject-select"
                    value={formData.materia_id}
                    onChange={e => {
                      setFormData(prev => ({
                        ...prev,
                        materia_id: e.target.value,
                        indicador_id: '',
                        numero_nota: ''
                      }));
                    }}
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '0.92rem' }}
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
                  <label htmlFor="task-due-date-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Fecha de Vencimiento *
                  </label>
                  <input
                    id="task-due-date-input"
                    type="date"
                    required
                    value={formData.fecha_vencimiento}
                    onChange={e => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '0.92rem' }}
                  />
                </div>

                <div>
                  <label htmlFor="task-status-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Estado *
                  </label>
                  <select
                    id="task-status-select"
                    value={formData.estado}
                    onChange={e => setFormData({ ...formData, estado: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '0.92rem' }}
                  >
                    <option value="PUBLICADA">PUBLICADA (Visible para estudiantes)</option>
                    <option value="BORRADOR">BORRADOR</option>
                    <option value="CERRADA">CERRADA</option>
                  </select>
                </div>
              </div>

              {/* CONTROL DE CALIFICACIÓN BIMESTRAL */}
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

              {/* SECCIÓN DE CONFIGURACIÓN ACADÉMICA DINÁMICA */}
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
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.98rem', color: '#0f766e' }}>
                      <BarChart3 size={18} />
                      <span>Configuración de calificación bimestral</span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Esta tarea utilizará la calificación obtenida por cada estudiante como una nota parcial en la matriz académica.
                    </p>
                  </div>

                  {/* Selector de Bimestre */}
                  <div>
                    <label htmlFor="task-period-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                      Bimestre / Período Académico *
                    </label>
                    <select
                      id="task-period-select"
                      value={formData.bimestre_id}
                      onChange={e => setFormData(prev => ({ ...prev, bimestre_id: e.target.value, indicador_id: '', numero_nota: '' }))}
                      disabled={cargandoBimestres}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '10px',
                        border: '1.5px solid var(--border)',
                        fontSize: '0.92rem',
                        background: '#fff'
                      }}
                    >
                      <option value="">-- Seleccionar bimestre --</option>
                      {bimestresList.map(b => (
                        <option key={b.id} value={String(b.id)}>
                          {b.nombre} {b.anio ? `(${b.anio})` : ''}
                        </option>
                      ))}
                    </select>
                    {cargandoBimestres && (
                      <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                        Cargando catálogo de bimestres...
                      </small>
                    )}
                  </div>

                  {/* Selector de Indicador */}
                  <div>
                    <label htmlFor="task-indicator-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                      Indicador de logro *
                    </label>
                    <select
                      id="task-indicator-select"
                      value={formData.indicador_id}
                      onChange={e => setFormData(prev => ({ ...prev, indicador_id: e.target.value }))}
                      disabled={!formData.bimestre_id || cargandoIndicadores || indicadoresList.length === 0}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '10px',
                        border: '1.5px solid var(--border)',
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
                          ? 'No hay indicadores registrados para este período'
                          : '-- Seleccionar indicador --'}
                      </option>
                      {indicadoresList.map(ind => (
                        <option key={ind.id} value={String(ind.id)}>
                          Indicador {ind.numero}: {ind.descripcion?.length > 75 ? `${ind.descripcion.substring(0, 75)}...` : ind.descripcion}
                        </option>
                      ))}
                    </select>

                    {!formData.bimestre_id ? (
                      <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                        Selecciona primero un bimestre arriba.
                      </small>
                    ) : cargandoIndicadores ? (
                      <small style={{ color: '#0f766e', display: 'block', marginTop: '0.25rem' }}>
                        Consultando indicadores de logro desde la base de datos...
                      </small>
                    ) : indicadoresList.length === 0 ? (
                      <small style={{ color: '#dc2626', display: 'block', marginTop: '0.25rem', fontWeight: 600 }}>
                        No existen indicadores creados para este curso, asignatura y bimestre. Puedes definirlos en el módulo de Gestión Académica.
                      </small>
                    ) : null}
                  </div>

                  {/* Selector de Número de Nota y Tipo de Evaluación */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label htmlFor="task-grade-number-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                        Número de nota *
                      </label>
                      <select
                        id="task-grade-number-select"
                        value={formData.numero_nota}
                        onChange={e => setFormData(prev => ({ ...prev, numero_nota: e.target.value }))}
                        disabled={!formData.indicador_id}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.9rem',
                          borderRadius: '10px',
                          border: '1.5px solid var(--border)',
                          fontSize: '0.92rem',
                          background: !formData.indicador_id ? '#f1f5f9' : '#fff',
                          cursor: !formData.indicador_id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <option value="">
                          {!formData.indicador_id ? 'Selecciona un indicador primero' : '-- Seleccionar nota --'}
                        </option>
                        {formData.indicador_id && Array.from(
                          { length: configEvaluacion?.notas_por_indicador || 3 },
                          (_, i) => i + 1
                        ).map(n => (
                          <option key={n} value={String(n)}>
                            Nota {n}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="task-eval-type-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                        Tipo de evaluación
                      </label>
                      <input
                        id="task-eval-type-input"
                        type="text"
                        placeholder="Ej. Taller, Quiz, Examen..."
                        value={formData.tipo_evaluacion || ''}
                        onChange={e => setFormData(prev => ({ ...prev, tipo_evaluacion: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.9rem',
                          borderRadius: '10px',
                          border: '1.5px solid var(--border)',
                          fontSize: '0.92rem',
                          background: '#fff'
                        }}
                      />
                    </div>
                  </div>

                  {/* Resumen Visual del Destino */}
                  <div style={{
                    marginTop: '0.25rem',
                    padding: '0.9rem 1.1rem',
                    borderRadius: '12px',
                    background: '#ffffff',
                    border: '1px dashed #0f766e',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ fontWeight: 700, color: '#0f766e', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={15} />
                      <span>Destino de calificación</span>
                    </div>
                    {resumenValido ? (
                      <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.84rem', color: '#1e293b', lineHeight: '1.6' }}>
                        <div style={{ fontWeight: 700, color: '#0f766e' }}>
                          {bimestreSeleccionado?.nombre}
                        </div>
                        <div style={{ paddingLeft: '1rem', color: '#334155' }}>
                          └── Indicador {indicadorSeleccionado?.numero}: {indicadorSeleccionado?.descripcion}
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

                  {/* Confirmación Visual */}
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
                      <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <span>Esta tarea sincronizará la calificación de los estudiantes como:</span>
                        <div style={{ fontWeight: 700, marginTop: '2px' }}>
                          {bimestreSeleccionado?.nombre} → Indicador {indicadorSeleccionado?.numero} → Nota {notaSeleccionada}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Descripción e Instrucciones */}
              <div>
                <label htmlFor="task-desc-textarea" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Descripción e Instrucciones
                </label>
                <textarea
                  id="task-desc-textarea"
                  rows={3}
                  placeholder="Detalles sobre la tarea, pautas de evaluación y entregables..."
                  value={formData.descripcion}
                  onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '0.95rem', resize: 'vertical' }}
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
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  Entregas: {modalEntregas.titulo}
                </h3>
                <small style={{ opacity: 0.9 }}>
                  {modalEntregas.curso_grado || modalEntregas.curso_nombre} · {modalEntregas.materia_nombre}
                  {modalEntregas.califica_bimestre && (
                    <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Target size={12} />
                      <span>Sincroniza: Indicador {modalEntregas.indicador_numero || modalEntregas.indicador_id} (Nota {modalEntregas.numero_nota})</span>
                    </span>
                  )}
                </small>
              </div>
              <button
                onClick={() => { setModalEntregas(null); setEntregasData(null); }}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
              >
                <X size={20} />
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
                              color: entrega.estado === 'CALIFICADA' ? '#10b981' : entrega.estado === 'ENTREGADA' ? '#0ea5e9' : '#64748b'
                            }}>
                              {entrega.estado}
                            </span>
                            {entrega.calificacion !== null && entrega.calificacion !== undefined && (
                              <span style={{ marginLeft: '8px', fontWeight: 700, color: 'var(--brand)' }}>
                                Nota: {Number(entrega.calificacion).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="number"
                            step="0.1"
                            min="1.0"
                            max="5.0"
                            placeholder="Nota"
                            defaultValue={entrega.calificacion ?? ''}
                            onBlur={(e) => {
                              const val = e.target.value;
                              if (val !== '' && !isNaN(parseFloat(val))) {
                                handleCalificar(entrega.estudiante_id, val, entrega.comentarios || '', 'CALIFICADA');
                              }
                            }}
                            style={{
                              width: '75px',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              textAlign: 'center',
                              fontWeight: 700
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
