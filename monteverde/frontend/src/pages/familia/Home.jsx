import Card from '../../components/Card';
import ButtonLink from '../../components/ButtonLink';
import DiaTextReveal from '../../components/DiaTextReveal';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Calendar,
  Activity,
  MessageSquareQuote,
  Info,
  X
} from 'lucide-react';
import { 
  getFamiliaDashboard, 
  getMensajesPorUsuario, 
  getCirculares, 
  getSemaforoTareasHijo,
  formatearFecha, 
  formatearFechaHora 
} from '../../services/api';
import familiaImg from '../../assets/img/familia.png';
import logoColegio from '../../assets/img/logo-colegio.png';

export default function FamiliaHome() {
  const { usuario } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [ultimoMensaje, setUltimoMensaje] = useState(null);
  const [circulares, setCirculares] = useState([]);
  const [circularSeleccionada, setCircularSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [selectedHijoIndex, setSelectedHijoIndex] = useState(0);

  // Estados del Semáforo de Tareas con datos reales y acordeón interactivo
  const [semaforoData, setSemaforoData] = useState(null);
  const [loadingSemaforo, setLoadingSemaforo] = useState(false);
  const [errorSemaforo, setErrorSemaforo] = useState('');
  const [categoriaExpandida, setCategoriaExpandida] = useState(null);
  const [tareaExpandidaId, setTareaExpandidaId] = useState(null);

  // Carga inicial de datos del dashboard familiar
  useEffect(() => {
    const cargarDatos = async () => {
      if (!usuario?.id) {
        setMensaje('Usuario no disponible');
        setLoading(false);
        return;
      }

      try {
        const [dashboard, mensajes, circularesRes] = await Promise.all([
          getFamiliaDashboard(usuario.id),
          getMensajesPorUsuario(usuario.id).catch(err => {
            console.warn('No se pudieron cargar mensajes:', err);
            return [];
          }),
          getCirculares(5).catch(err => {
            console.warn('No se pudieron cargar circulares:', err);
            return [];
          })
        ]);

        setDashboardData(dashboard);

        if (circularesRes) {
          const listaCirculares = circularesRes.data ? circularesRes.data : circularesRes;
          setCirculares(listaCirculares);
        }

        if (mensajes && mensajes.length > 0) {
          const mensajesRecibidos = mensajes.filter(m => m.receptor_id === usuario.id);
          if (mensajesRecibidos.length > 0) {
            setUltimoMensaje(mensajesRecibidos[0]);
          }
        }
      } catch (error) {
        console.error('Error al cargar dashboard:', error);
        setMensaje('Error al cargar información: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [usuario]);

  const hijoSeleccionado = dashboardData?.hijos?.[selectedHijoIndex] || {};

  // Cargar datos reales del semáforo al cambiar o seleccionar estudiante activo
  useEffect(() => {
    const estudianteId = hijoSeleccionado?.id;
    if (!estudianteId) {
      setSemaforoData(null);
      return;
    }

    const cargarSemaforo = async () => {
      try {
        setLoadingSemaforo(true);
        setErrorSemaforo('');
        setCategoriaExpandida(null);
        setTareaExpandidaId(null);
        const res = await getSemaforoTareasHijo(estudianteId);
        const data = res?.data ? res.data : res;
        setSemaforoData(data);
      } catch (err) {
        console.error('❌ Error al cargar semáforo de tareas:', err);
        setErrorSemaforo('No fue posible cargar el estado de las tareas.');
      } finally {
        setLoadingSemaforo(false);
      }
    };

    cargarSemaforo();
  }, [hijoSeleccionado?.id]);

  if (loading) {
    return (
      <div className="grid" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent mx-auto mb-4"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando tu vista familiar...</p>
      </div>
    );
  }

  // Tareas clasificadas según respuesta real del backend
  const entregadasCount = semaforoData?.entregadas ?? 0;
  const pendientesCount = semaforoData?.pendientes ?? 0;
  const proximasCount = semaforoData?.proximas_a_vencer ?? 0;
  const vencidasCount = semaforoData?.vencidas ?? 0;
  const totalTareas = semaforoData?.total ?? 0;
  const detalleTareas = semaforoData?.detalle ?? [];

  const itemsSemaforo = [
    { 
      key: 'ENTREGADA', 
      label: 'Entregadas', 
      value: entregadasCount, 
      color: 'status-chip--green',
      IconComponent: CheckCircle2,
      subtext: 'Actividades enviadas o calificadas'
    },
    { 
      key: 'PENDIENTE', 
      label: 'Pendientes', 
      value: pendientesCount, 
      color: 'status-chip--yellow',
      IconComponent: Clock,
      subtext: 'Faltan más de 48 horas para la entrega'
    },
    { 
      key: 'PROXIMA_A_VENCER', 
      label: 'Próximas a vencer', 
      value: proximasCount, 
      color: 'status-chip--red',
      IconComponent: AlertTriangle,
      subtext: 'Vencen en 48 horas o menos'
    }
  ];

  // Si existen tareas vencidas, se incluye como categoría de alerta
  if (vencidasCount > 0) {
    itemsSemaforo.push({
      key: 'VENCIDA',
      label: 'Vencidas',
      value: vencidasCount,
      color: 'status-chip--red',
      IconComponent: AlertTriangle,
      subtext: 'Fecha límite superada sin entrega'
    });
  }

  // Helper para renderizar el badge de estado de una actividad específica
  const renderBadgeEstadoTarea = (tarea) => {
    if (tarea.calificacion !== null && tarea.calificacion !== undefined) {
      return (
        <span style={{
          padding: '3px 9px',
          borderRadius: '20px',
          backgroundColor: '#dcfce7',
          color: '#15803d',
          fontWeight: 700,
          fontSize: '0.8rem',
          border: '1px solid #bbf7d0',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <CheckCircle2 size={12} />
          <span>Calificado ({tarea.calificacion.toFixed(1)} / 5.0)</span>
        </span>
      );
    }

    if (tarea.entrega_estado === 'ENTREGADA') {
      return (
        <span style={{
          padding: '3px 9px',
          borderRadius: '20px',
          backgroundColor: '#e0f2fe',
          color: '#0369a1',
          fontWeight: 700,
          fontSize: '0.8rem',
          border: '1px solid #bae6fd',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <CheckCircle2 size={12} />
          <span>Entregado</span>
        </span>
      );
    }

    if (tarea.estado_calculado === 'PROXIMA_A_VENCER') {
      return (
        <span style={{
          padding: '3px 9px',
          borderRadius: '20px',
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          fontWeight: 700,
          fontSize: '0.8rem',
          border: '1px solid #fecaca',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Clock size={12} />
          <span>Próximo a vencer</span>
        </span>
      );
    }

    if (tarea.estado_calculado === 'VENCIDA') {
      return (
        <span style={{
          padding: '3px 9px',
          borderRadius: '20px',
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          fontWeight: 700,
          fontSize: '0.8rem',
          border: '1px solid #fee2e2',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <AlertTriangle size={12} />
          <span>Vencida</span>
        </span>
      );
    }

    return (
      <span style={{
        padding: '3px 9px',
        borderRadius: '20px',
        backgroundColor: '#fef9c3',
        color: '#854d0e',
        fontWeight: 700,
        fontSize: '0.8rem',
        border: '1px solid #fef08a',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <Clock size={12} />
        <span>Pendiente</span>
      </span>
    );
  };

  return (
    <div className="mobile-overview">
      <div style={{ display: 'grid', gap: '1rem', padding: '1.5rem', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(236,252,245,0.95), rgba(255,255,255,0.85))', boxShadow: '0 12px 30px rgba(14,77,43,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logoColegio} alt="Monteverde School" style={{ width: '68px', height: 'auto' }} />
          <div>
            <h2 style={{ margin: 0 }}>
              <DiaTextReveal 
                text={`¡Hola, ${usuario?.nombre || ''}!`} 
                colors={["#11998e", "#38ef7d", "#a8ff78"]} 
              />
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '.35rem' }}>Así marcha el día académico de tu familia en Monteverde School.</p>
          </div>
        </div>
        <img src={familiaImg} alt="Dashboard Familiar" style={{ width: '100%', borderRadius: '20px', maxHeight: '230px', objectFit: 'cover' }} />
      </div>

      {mensaje && (
        <div style={{ padding: '1rem', backgroundColor: '#FDECEA', color: '#912E2E', borderRadius: '16px', border: '1px solid #F5C6CB' }}>
          {mensaje}
        </div>
      )}

      {/* Selector premium de hijo (hermanos vinculados) */}
      {dashboardData?.hijos?.length > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255,255,255,0.9)',
          padding: '1rem',
          borderRadius: '18px',
          border: '1px solid rgba(14,77,43,.08)',
          boxShadow: '0 4px 15px rgba(14,77,43,0.03)',
          marginBottom: '1rem',
          backdropFilter: 'blur(8px)'
        }}>
          <GraduationCap size={20} style={{ color: 'var(--brand)', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Hijo:
          </span>
          <select
            value={selectedHijoIndex}
            onChange={(e) => setSelectedHijoIndex(parseInt(e.target.value))}
            style={{
              flexGrow: 1,
              padding: '0.55rem 1rem',
              borderRadius: '12px',
              border: '2px solid rgba(14,77,43,0.1)',
              outline: 'none',
              background: '#fff',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#0e4d2b',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
              transition: 'all 0.2s'
            }}
          >
            {dashboardData.hijos.map((hijo, idx) => (
              <option key={hijo.id} value={idx}>
                {hijo.nombre} ({hijo.curso})
              </option>
            ))}
          </select>
        </div>
      )}

      <Card title="Vista de Hoy">
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '18px', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{hijoSeleccionado.nombre || 'Estudiante'}</strong>
              <span className="status-chip status-chip--green">En progreso</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '.75rem' }}>{hijoSeleccionado.curso || 'Grado 5º'} · {hijoSeleccionado.grado || 'A'}</p>
            <div style={{ marginTop: '1rem', display: 'grid', gap: '.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Clase de hoy</span><strong>{hijoSeleccionado.clase_hoy || 'Lenguaje'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Sala</span><strong>{hijoSeleccionado.sala || 'Aula 7'}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '.75rem' }}>
            <ButtonLink to="/familia/reporte" variant="primary">Ver reporte académico</ButtonLink>
          </div>
        </div>
      </Card>

      {/* El Semáforo de Tareas (Datos Reales Persistentes y Acordeón Enriquecido) */}
      <Card title="El Semáforo de Tareas">
        {loadingSemaforo ? (
          <div style={{ textAlign: 'center', padding: '1.75rem', color: 'var(--text-secondary)' }}>
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-brand border-t-transparent mx-auto mb-2"></div>
            <p style={{ fontSize: '0.88rem', margin: 0 }}>Cargando tareas de {hijoSeleccionado.nombre || 'estudiante'}...</p>
          </div>
        ) : errorSemaforo ? (
          <div style={{ textAlign: 'center', padding: '1.25rem', color: '#dc2626', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600 }}>{errorSemaforo}</p>
            <button
              onClick={() => {
                if (hijoSeleccionado?.id) {
                  setLoadingSemaforo(true);
                  getSemaforoTareasHijo(hijoSeleccionado.id)
                    .then(res => setSemaforoData(res?.data || res))
                    .catch(() => setErrorSemaforo('No fue posible cargar el estado de las tareas.'))
                    .finally(() => setLoadingSemaforo(false));
                }
              }}
              style={{
                padding: '0.4rem 0.9rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {totalTareas === 0 && (
              <div style={{ textAlign: 'center', padding: '0.75rem', color: '#64748b', fontSize: '0.86rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <Info size={14} />
                <span>{hijoSeleccionado.nombre || 'El estudiante'} no tiene tareas registradas actualmente en su curso.</span>
              </div>
            )}

            {itemsSemaforo.map(item => {
              const tareasCategoria = detalleTareas.filter(t => t.estado_calculado === item.key);
              const estaExpandida = categoriaExpandida === item.key;
              const IconComp = item.IconComponent;

              return (
                <div 
                  key={item.key} 
                  style={{ 
                    borderRadius: '16px', 
                    background: '#fff', 
                    border: '1px solid rgba(14,77,43,.08)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Encabezado de la Categoría */}
                  <div 
                    onClick={() => {
                      if (tareasCategoria.length > 0) {
                        setCategoriaExpandida(estaExpandida ? null : item.key);
                      }
                    }}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '1rem',
                      cursor: tareasCategoria.length > 0 ? 'pointer' : 'default',
                      backgroundColor: estaExpandida ? 'rgba(17, 153, 142, 0.04)' : '#fff'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <IconComp size={16} />
                        <span>{item.label}</span>
                      </div>
                      <small style={{ color: 'var(--text-secondary)' }}>{item.subtext}</small>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`status-chip ${item.color}`}>{item.value}</span>
                      {tareasCategoria.length > 0 && (
                        <ChevronDown size={16} style={{ color: '#94a3b8', transition: 'transform 0.2s', transform: estaExpandida ? 'rotate(180deg)' : 'none' }} />
                      )}
                    </div>
                  </div>

                  {/* Lista de actividades en esta categoría con acordeón expandible */}
                  {estaExpandida && tareasCategoria.length > 0 && (
                    <div style={{ 
                      padding: '0.65rem 1rem 1rem 1rem', 
                      borderTop: '1px solid rgba(14,77,43,.06)',
                      backgroundColor: 'rgba(17, 153, 142, 0.015)',
                      display: 'grid',
                      gap: '0.65rem'
                    }}>
                      {tareasCategoria.map(tarea => {
                        const tareaId = tarea.tarea_id || tarea.id;
                        const estaTareaAbierta = tareaExpandidaId === tareaId;

                        return (
                          <div 
                            key={tareaId}
                            style={{
                              borderRadius: '12px',
                              background: '#ffffff',
                              border: estaTareaAbierta ? '1.5px solid rgba(17, 153, 142, 0.4)' : '1px solid #e2e8f0',
                              boxShadow: estaTareaAbierta ? '0 4px 12px rgba(14,77,43,0.06)' : 'none',
                              overflow: 'hidden',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {/* Fila compacta interactiva */}
                            <div 
                              onClick={() => setTareaExpandidaId(estaTareaAbierta ? null : tareaId)}
                              style={{
                                padding: '0.75rem 0.95rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                backgroundColor: estaTareaAbierta ? 'rgba(17, 153, 142, 0.03)' : '#ffffff'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                                <ChevronRight size={15} style={{ 
                                  color: 'var(--brand)', 
                                  transition: 'transform 0.2s', 
                                  transform: estaTareaAbierta ? 'rotate(90deg)' : 'none',
                                  flexShrink: 0
                                }} />
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ 
                                    fontWeight: 700, 
                                    fontSize: '0.9rem', 
                                    color: '#1e293b',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {tarea.titulo}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <BookOpen size={12} />
                                    <span>{tarea.materia_nombre || tarea.materia}</span>
                                    {tarea.fecha_vencimiento && (
                                      <>
                                        <span>•</span>
                                        <Calendar size={12} />
                                        <span>Vence: {formatearFecha(tarea.fecha_vencimiento)}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                {renderBadgeEstadoTarea(tarea)}
                              </div>
                            </div>

                            {/* Acordeón expandido con detalles completos de la tarea */}
                            {estaTareaAbierta && (
                              <div style={{
                                padding: '0.9rem 1rem 1rem 1rem',
                                borderTop: '1px solid #f1f5f9',
                                background: '#fafbfc',
                                display: 'grid',
                                gap: '0.75rem',
                                animation: 'fadeIn 0.15s ease-out'
                              }}>
                                {/* Instrucciones / Descripción */}
                                <div>
                                  <div style={{ 
                                    fontSize: '0.78rem', 
                                    fontWeight: 700, 
                                    color: '#0e4d2b', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.5px',
                                    marginBottom: '0.35rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}>
                                    <FileText size={13} />
                                    <span>Descripción e Instrucciones:</span>
                                  </div>
                                  <div style={{
                                    fontSize: '0.86rem',
                                    lineHeight: '1.55',
                                    color: '#334155',
                                    background: '#ffffff',
                                    padding: '0.75rem 0.9rem',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                  }}>
                                    {tarea.descripcion?.trim() ? tarea.descripcion : 'No hay instrucciones adicionales para esta actividad.'}
                                  </div>
                                </div>

                                {/* Grilla de metadatos */}
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                  gap: '0.5rem',
                                  marginTop: '0.2rem'
                                }}>
                                  <div style={{ background: '#fff', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <GraduationCap size={13} style={{ color: '#64748b' }} />
                                    <span style={{ color: '#64748b' }}>Docente: </span>
                                    <strong style={{ color: '#1e293b' }}>{tarea.docente_nombre || 'Docente asignado'}</strong>
                                  </div>
                                  <div style={{ background: '#fff', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <BookOpen size={13} style={{ color: '#64748b' }} />
                                    <span style={{ color: '#64748b' }}>Asignatura: </span>
                                    <strong style={{ color: '#1e293b' }}>{tarea.materia_nombre || tarea.materia}</strong>
                                  </div>
                                  <div style={{ background: '#fff', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Calendar size={13} style={{ color: '#64748b' }} />
                                    <span style={{ color: '#64748b' }}>Fecha límite: </span>
                                    <strong style={{ color: '#1e293b' }}>
                                      {tarea.fecha_vencimiento ? formatearFechaHora(tarea.fecha_vencimiento) : 'Sin fecha'}
                                    </strong>
                                  </div>
                                  <div style={{ background: '#fff', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Activity size={13} style={{ color: '#64748b' }} />
                                    <span style={{ color: '#64748b' }}>Estado: </span>
                                    <strong style={{ color: '#1e293b' }}>
                                      {tarea.calificacion !== null ? 'Calificado' : (tarea.entrega_estado === 'ENTREGADA' ? 'Entregado' : (tarea.estado_calculado === 'PROXIMA_A_VENCER' ? 'Próximo a vencer' : (tarea.estado_calculado === 'VENCIDA' ? 'Vencida' : 'Pendiente')))}
                                    </strong>
                                  </div>
                                </div>

                                {/* Comentarios o retroalimentación del docente si existe */}
                                {tarea.comentarios && (
                                  <div style={{
                                    padding: '0.65rem 0.85rem',
                                    borderRadius: '8px',
                                    background: '#ecfdf5',
                                    border: '1px solid #a7f3d0',
                                    fontSize: '0.82rem',
                                    color: '#065f46',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}>
                                    <MessageSquareQuote size={14} style={{ flexShrink: 0 }} />
                                    <span><strong>Retroalimentación del Docente:</strong> {tarea.comentarios}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Últimas Circulares">
        {circulares.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', padding: '1.5rem', textAlign: 'center', fontSize: '0.95rem' }}>
            No hay circulares publicadas todavía.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '350px', overflowY: 'auto' }}>
            {circulares.map((c) => (
              <li 
                key={c.id} 
                onClick={() => setCircularSeleccionada(c)}
                style={{ 
                  padding: '0.85rem 1.1rem', 
                  borderRadius: '14px', 
                  background: 'var(--surface)', 
                  border: '1px solid rgba(16, 185, 129, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.03)';
                  e.currentTarget.style.transform = 'translateX(3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.08)';
                  e.currentTarget.style.background = 'var(--surface)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <span style={{ 
                  fontWeight: 600, 
                  color: 'var(--brand)', 
                  fontSize: '0.925rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '70%'
                }}>
                  {c.titulo}
                </span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  background: 'rgba(16, 185, 129, 0.06)',
                  padding: '3px 9px',
                  borderRadius: '20px',
                  fontWeight: 600
                }}>
                  {c.fecha_publicacion ? formatearFecha(c.fecha_publicacion) : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Modal de Detalle de Circular */}
      {circularSeleccionada && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(6px)',
          padding: '1.5rem',
          zIndex: 999
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Header del Modal */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(56, 239, 125, 0.05) 100%)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--brand)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Circular Informativa
                </span>
                <h3 style={{ margin: '0.25rem 0 0 0', color: 'var(--text-primary)', fontSize: '1.15rem' }}>
                  {circularSeleccionada.titulo}
                </h3>
              </div>
              <button
                onClick={() => setCircularSeleccionada(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} />
                <span>Publicado: {circularSeleccionada.fecha_publicacion ? formatearFechaHora(circularSeleccionada.fecha_publicacion) : 'Reciente'}</span>
              </div>
              <div style={{ 
                color: 'var(--text-primary)', 
                lineHeight: '1.6', 
                fontSize: '0.95rem',
                whiteSpace: 'pre-wrap'
              }}>
                {circularSeleccionada.contenido}
              </div>
            </div>

            {/* Footer del Modal */}
            <div style={{
              padding: '1rem 1.5rem',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              textAlign: 'right'
            }}>
              <button
                onClick={() => setCircularSeleccionada(null)}
                style={{
                  padding: '0.55rem 1.25rem',
                  backgroundColor: 'var(--brand)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
