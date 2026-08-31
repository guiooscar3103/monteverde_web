import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Send,
  X,
  Mail,
  User,
  GraduationCap,
  Layers,
  Filter
} from 'lucide-react';
import { getRendimientoAcademicoDocente } from '../../services/api';
import BlurFade from '../BlurFade';

export default function DocenteAcademicDashboard({ onNavigateToMessages }) {
  const navigate = useNavigate();

  // Estados de datos
  const [data, setData] = useState(null);
  const [bimestreSeleccionado, setBimestreSeleccionado] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtro y expansión de cards
  const [cardsExpandidas, setCardsExpandidas] = useState({});
  const [filtroEstudiantesPorCard, setFiltroEstudiantesPorCard] = useState({});

  // Modal de contacto con acudiente
  const [modalContacto, setModalContacto] = useState(null);
  const [mensajeEditable, setMensajeEditable] = useState('');
  const [asuntoEditable, setAsuntoEditable] = useState('');

  // Cargar datos desde la API
  const cargarRendimiento = useCallback(async (bimestreId = null) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRendimientoAcademicoDocente({ bimestreId });
      const payload = res?.data ? res.data : res;
      setData(payload);

      if (payload?.bimestre?.id && !bimestreId) {
        setBimestreSeleccionado(payload.bimestre.id);
      }
    } catch (err) {
      console.error('Error al cargar rendimiento académico:', err);
      setError(err.message || 'No fue posible cargar el rendimiento académico.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarRendimiento(bimestreSeleccionado || null);
  }, [bimestreSeleccionado, cargarRendimiento]);

  // Manejar cambio de bimestre
  const handleCambioBimestre = (e) => {
    const nuevoBimId = e.target.value ? parseInt(e.target.value, 10) : '';
    setBimestreSeleccionado(nuevoBimId);
  };

  // Alternar expansión de card
  const toggleCard = (asigId, soloRiesgo = false) => {
    setCardsExpandidas((prev) => ({
      ...prev,
      [asigId]: !prev[asigId]
    }));
    if (soloRiesgo) {
      setFiltroEstudiantesPorCard((prev) => ({
        ...prev,
        [asigId]: 'EN_RIESGO'
      }));
    }
  };

  // Alternar filtro dentro de la lista de estudiantes
  const setFiltroCard = (asigId, filtro) => {
    setFiltroEstudiantesPorCard((prev) => ({
      ...prev,
      [asigId]: filtro
    }));
  };

  // Iniciar flujo "Contactar acudiente"
  const handleAbrirContactoAcudiente = (estudiante, asig) => {
    const cursoNombre = asig.curso || asig.curso_nombre || 'el curso';
    const materiaNombre = asig.materia || asig.materia_nombre || 'la materia';
    const bimestreNombre = data?.bimestre?.nombre || 'el bimestre actual';
    const promedioTexto = estudiante.promedio !== null && estudiante.promedio !== undefined
      ? estudiante.promedio.toFixed(2)
      : 'sin calificar';

    const asuntoDefault = `Seguimiento Académico: ${estudiante.nombre} - ${materiaNombre}`;
    const textoDefault = `Estimado/a acudiente de ${estudiante.nombre}:\n\n` +
      `Me comunico desde MonteVerde School para conversar sobre el desempeño académico del estudiante en la asignatura ${materiaNombre} (${cursoNombre}) durante ${bimestreNombre}. ` +
      `Actualmente presenta un promedio de ${promedioTexto}.\n\n` +
      `Quisiera que coordinemos un espacio o tutoría para acompañar su proceso de aprendizaje y fortalecer los indicadores de logro correspondientes.\n\n` +
      `Quedo atento/a a su respuesta para coordinar.`;

    setAsuntoEditable(asuntoDefault);
    setMensajeEditable(textoDefault);
    setModalContacto({
      estudiante,
      asig,
      familia: estudiante.familia
    });
  };

  // Redirigir a Mensajes con el estado precargado
  const handleProcederAMensajeria = () => {
    if (!modalContacto) return;
    const { estudiante, asig, familia } = modalContacto;

    const navState = {
      cursoId: asig.curso_id,
      estudiante,
      contacto: familia || null,
      asuntoInicial: asuntoEditable,
      mensajeInicial: mensajeEditable
    };

    setModalContacto(null);

    if (onNavigateToMessages) {
      onNavigateToMessages(navState);
    } else {
      navigate('/docente/mensajes', { state: navState });
    }
  };

  // Helper de badges de estado usando el sistema de chips institucional de MonteVerde
  const renderBadgeEstado = (estado, promedio) => {
    const promText = promedio !== null && promedio !== undefined ? promedio.toFixed(2) : '-';
    switch (estado) {
      case 'SOBRESALIENTE':
        return (
          <span className="status-chip status-chip--green" style={{ fontWeight: 700 }}>
            Sobresaliente ({promText})
          </span>
        );
      case 'ACEPTABLE':
        return (
          <span className="status-chip status-chip--green" style={{ background: '#E6F4EA', color: '#166534', borderColor: '#BBF7D0', fontWeight: 600 }}>
            Aprobado ({promText})
          </span>
        );
      case 'EN_RIESGO':
        return (
          <span className="status-chip status-chip--red" style={{ fontWeight: 700 }}>
            En Riesgo ({promText})
          </span>
        );
      case 'SIN_DATOS':
      default:
        return (
          <span className="status-chip" style={{ background: '#F1F5F9', color: '#64748B', borderColor: '#CBD5E1' }}>
            Sin Calificar
          </span>
        );
    }
  };

  // =========================================================================
  // RENDER: SKELETON LOADING
  // =========================================================================
  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid var(--border)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ width: '220px', height: '24px', background: 'var(--bg-light)', borderRadius: '8px', marginBottom: '8px' }}></div>
            <div style={{ width: '320px', height: '14px', background: 'var(--bg-light)', borderRadius: '6px' }}></div>
          </div>
          <div style={{ width: '160px', height: '38px', background: 'var(--bg-light)', borderRadius: '10px' }}></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '120px', height: '14px', background: 'var(--bg-light)', borderRadius: '4px', marginBottom: '12px' }}></div>
              <div style={{ width: '90px', height: '32px', background: 'var(--bg-light)', borderRadius: '8px', marginBottom: '8px' }}></div>
              <div style={{ width: '160px', height: '12px', background: 'var(--bg-light)', borderRadius: '4px' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: ERROR STATE
  // =========================================================================
  if (error) {
    return (
      <div style={{
        background: '#ffffff',
        padding: '2.5rem',
        borderRadius: '20px',
        border: '1px solid #FECDD3',
        boxShadow: 'var(--shadow-sm)',
        textAlign: 'center',
        maxWidth: '520px',
        margin: '2rem auto'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: '#FFE4E6',
          color: '#BE123C',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto'
        }}>
          <AlertTriangle size={28} />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
          No fue posible cargar el rendimiento académico
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          {error}
        </p>
        <button
          onClick={() => cargarRendimiento(bimestreSeleccionado || null)}
          className="btn"
          style={{
            background: 'var(--brand)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '0.75rem 1.75rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(10, 58, 32, 0.15)',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  const kpis = data?.kpis || {
    total_estudiantes: 0,
    tasa_aprobacion: 0,
    estudiantes_en_riesgo: 0,
    estudiantes_sin_datos: 0,
    promedio_general: 0
  };

  const asignaciones = data?.asignaciones || [];
  const bimestres = data?.bimestres_disponibles || [];

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* =====================================================================
          HEADER CON ESTÉTICA INSTITUCIONAL MONTEVERDE
      ====================================================================== */}
      <BlurFade delay={0.05} duration={0.35}>
        <div style={{
          background: 'linear-gradient(135deg, #0A3A20 0%, #0F5A31 50%, #166534 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '1.75rem 2rem',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem'
        }}>
          {/* Decoración geométrica institucional */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '650px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: '#A7F3D0',
              marginBottom: '0.65rem',
              border: '1px solid rgba(255, 255, 255, 0.18)'
            }}>
              <Sparkles size={13} />
              <span>Panel Académico Docente</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Rendimiento Académico y Estadísticas
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255, 255, 255, 0.88)', fontSize: '0.92rem', lineHeight: 1.45 }}>
              Supervisa el progreso académico de tus cursos asignados, detecta alertas tempranas y contacta acudientes oportunamente.
            </p>
          </div>

          {/* Selector de Bimestre Institucional */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            padding: '8px 14px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <label htmlFor="selector-bimestre" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#E6F4EA', whiteSpace: 'nowrap' }}>
              Bimestre:
            </label>
            <select
              id="selector-bimestre"
              value={bimestreSeleccionado || (data?.bimestre?.id || '')}
              onChange={handleCambioBimestre}
              style={{
                background: '#0A3A20',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                padding: '6px 32px 6px 12px',
                fontSize: '0.88rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              {bimestres.map((b) => (
                <option key={b.id} value={b.id} style={{ background: '#0F172A', color: '#ffffff' }}>
                  {b.nombre} ({b.anio})
                </option>
              ))}
            </select>
          </div>
        </div>
      </BlurFade>

      {/* =====================================================================
          KPIS GLOBALES
      ====================================================================== */}
      <BlurFade delay={0.1} duration={0.4}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

          {/* KPI 1: Tasa de Aprobación */}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
                  Tasa de Aprobación
                </span>
                <div style={{ fontSize: '2.3rem', fontWeight: 800, color: 'var(--brand)', marginTop: '4px', letterSpacing: '-0.03em' }}>
                  {kpis.tasa_aprobacion.toFixed(1)}%
                </div>
              </div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'var(--surface)',
                color: 'var(--brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(10, 58, 32, 0.12)'
              }}>
                <TrendingUp size={24} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span className="status-chip status-chip--green" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                {kpis.total_estudiantes - kpis.estudiantes_en_riesgo - kpis.estudiantes_sin_datos} aprobados
              </span>
              <span>de {kpis.estudiantes_con_datos || 0} calificados</span>
            </div>
          </div>

          {/* KPI 2: Estudiantes en Riesgo */}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
                  Estudiantes en Riesgo
                </span>
                <div style={{ fontSize: '2.3rem', fontWeight: 800, color: kpis.estudiantes_en_riesgo > 0 ? '#BE123C' : 'var(--brand)', marginTop: '4px', letterSpacing: '-0.03em' }}>
                  {kpis.estudiantes_en_riesgo}
                </div>
              </div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: kpis.estudiantes_en_riesgo > 0 ? '#FFE4E6' : 'var(--surface)',
                color: kpis.estudiantes_en_riesgo > 0 ? '#BE123C' : 'var(--brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(190, 18, 60, 0.15)'
              }}>
                <AlertTriangle size={24} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {kpis.estudiantes_en_riesgo > 0 ? (
                <span style={{ color: '#BE123C', fontWeight: 700 }}>
                  ⚠️ Requieren contacto o tutoría (promedio &lt; 3.0)
                </span>
              ) : (
                <span style={{ color: 'var(--brand)', fontWeight: 600 }}>
                  ✓ Sin estudiantes en riesgo actualmente
                </span>
              )}
            </div>
          </div>

          {/* KPI 3: Promedio General */}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
                  Promedio General Docente
                </span>
                <div style={{ fontSize: '2.3rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px', letterSpacing: '-0.03em' }}>
                  {kpis.promedio_general > 0 ? kpis.promedio_general.toFixed(2) : '-'}{' '}
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ 5.0</span>
                </div>
              </div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: '#E6F4EA',
                color: '#0A3A20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(10, 58, 32, 0.15)'
              }}>
                <Award size={24} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span>Total estudiantes: <strong style={{ color: 'var(--text)' }}>{kpis.total_estudiantes}</strong></span>
              {kpis.estudiantes_sin_datos > 0 && (
                <span style={{ color: '#B45309', fontWeight: 600 }}>({kpis.estudiantes_sin_datos} sin calificar)</span>
              )}
            </div>
          </div>

        </div>
      </BlurFade>

      {/* =====================================================================
          LISTADO DE ASIGNACIONES (CURSO + MATERIA)
      ====================================================================== */}
      {asignaciones.length === 0 ? (
        <BlurFade delay={0.15} duration={0.4}>
          <div style={{
            background: '#ffffff',
            padding: '3rem 2rem',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
            maxWidth: '540px',
            margin: '1.5rem auto'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'var(--surface)',
              color: 'var(--brand)',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              border: '1px solid rgba(10, 58, 32, 0.1)'
            }}>
              <BookOpen size={30} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>
              No tienes asignaciones académicas
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Comunícate con la coordinación académica de MonteVerde si deberías tener cursos o materias asignadas en este ciclo.
            </p>
          </div>
        </BlurFade>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {asignaciones.map((asig, idx) => {
            const isExpanded = !!cardsExpandidas[asig.asignacion_id];
            const filtroActivo = filtroEstudiantesPorCard[asig.asignacion_id] || 'TODOS';

            // Filtrado de estudiantes
            const estudiantesFiltrados = asig.estudiantes.filter((e) => {
              if (filtroActivo === 'EN_RIESGO') return e.estado === 'EN_RIESGO';
              if (filtroActivo === 'APROBADOS') return e.estado === 'SOBRESALIENTE' || e.estado === 'ACEPTABLE';
              if (filtroActivo === 'SIN_DATOS') return e.estado === 'SIN_DATOS';
              return true;
            });

            return (
              <BlurFade key={asig.asignacion_id} delay={0.15 + idx * 0.05} duration={0.4}>
                <div style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease'
                }}>
                  {/* Encabezado del Card */}
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{
                            background: 'var(--brand-light)',
                            color: 'var(--brand)',
                            padding: '3px 10px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            letterSpacing: '0.3px',
                            border: '1px solid rgba(10, 58, 32, 0.15)'
                          }}>
                            {asig.curso}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>•</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {asig.total_estudiantes} Estudiantes
                          </span>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                          {asig.materia}
                        </h3>
                      </div>

                      {/* Promedio y Tasa */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                          Prom: {asig.promedio_grupo > 0 ? asig.promedio_grupo.toFixed(2) : '-'}
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534', marginTop: '2px' }}>
                          {asig.tasa_aprobacion.toFixed(1)}% Aprobación
                        </div>
                      </div>
                    </div>

                    {/* Barra de Progreso Segmentada */}
                    <div style={{ marginTop: '1.25rem' }}>
                      <div
                        style={{
                          width: '100%',
                          height: '10px',
                          background: '#E2E8F0',
                          borderRadius: '999px',
                          overflow: 'hidden',
                          display: 'flex',
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)'
                        }}
                        title={`Aprobados: ${asig.aprobados} | En riesgo: ${asig.en_riesgo} | Sin datos: ${asig.sin_datos}`}
                      >
                        {/* Aprobados (Verde Institucional) */}
                        {asig.porcentaje_aprobados > 0 && (
                          <div
                            style={{
                              width: `${asig.porcentaje_aprobados}%`,
                              background: '#15803D',
                              transition: 'width 0.4s ease'
                            }}
                          />
                        )}
                        {/* En Riesgo (Rojo Alerta) */}
                        {asig.porcentaje_en_riesgo > 0 && (
                          <div
                            style={{
                              width: `${asig.porcentaje_en_riesgo}%`,
                              background: '#BE123C',
                              transition: 'width 0.4s ease'
                            }}
                          />
                        )}
                        {/* Sin Datos (Gris) */}
                        {asig.porcentaje_sin_datos > 0 && (
                          <div
                            style={{
                              width: `${asig.porcentaje_sin_datos}%`,
                              background: '#94A3B8',
                              transition: 'width 0.4s ease'
                            }}
                          />
                        )}
                      </div>

                      {/* Leyenda y Conteo */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.78rem',
                        marginTop: '8px',
                        color: 'var(--text-secondary)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#15803D', display: 'inline-block' }} />
                          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{asig.aprobados}</span>
                          <span>Aprobados</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#BE123C', display: 'inline-block' }} />
                          <span style={{ fontWeight: 700, color: '#BE123C' }}>{asig.en_riesgo}</span>
                          <span>En riesgo</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8', display: 'inline-block' }} />
                          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{asig.sin_datos}</span>
                          <span>Sin datos</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Card */}
                  <div style={{
                    padding: '0.85rem 1.25rem',
                    background: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    borderTop: '1px solid var(--border)'
                  }}>
                    {asig.en_riesgo > 0 ? (
                      <button
                        onClick={() => toggleCard(asig.asignacion_id, true)}
                        style={{
                          background: '#FFE4E6',
                          color: '#9F1239',
                          border: '1px solid #FECDD3',
                          padding: '6px 12px',
                          borderRadius: '10px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <AlertTriangle size={14} />
                        <span>Ver {asig.en_riesgo} en riesgo</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#166534', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={15} />
                        Sin estudiantes en riesgo
                      </span>
                    )}

                    <button
                      onClick={() => toggleCard(asig.asignacion_id, false)}
                      style={{
                        background: '#ffffff',
                        color: 'var(--brand)',
                        border: '1px solid var(--border)',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <span>{isExpanded ? 'Ocultar listado' : 'Ver todos'}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {/* Sección Desplegable: Detalle Individual de Estudiantes */}
                  {isExpanded && (
                    <div style={{
                      padding: '1.25rem',
                      borderTop: '1px solid var(--border)',
                      background: '#FAFDFB',
                      display: 'grid',
                      gap: '0.85rem'
                    }}>
                      {/* Filtros de lista */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid var(--border)'
                      }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Filtrar Estudiantes:
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {['TODOS', 'EN_RIESGO', 'APROBADOS'].map((f) => (
                            <button
                              key={f}
                              onClick={() => setFiltroCard(asig.asignacion_id, f)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                border: '1px solid',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                background: filtroActivo === f ? 'var(--brand)' : '#ffffff',
                                color: filtroActivo === f ? '#ffffff' : 'var(--text-secondary)',
                                borderColor: filtroActivo === f ? 'var(--brand)' : 'var(--border)'
                              }}
                            >
                              {f === 'TODOS' && `Todos (${asig.total_estudiantes})`}
                              {f === 'EN_RIESGO' && `En riesgo (${asig.en_riesgo})`}
                              {f === 'APROBADOS' && `Aprobados (${asig.aprobados})`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Lista de estudiantes */}
                      {estudiantesFiltrados.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          No hay estudiantes para el filtro seleccionado.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gap: '8px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                          {estudiantesFiltrados.map((est) => (
                            <div
                              key={est.estudiante_id}
                              style={{
                                background: '#ffffff',
                                padding: '0.85rem 1rem',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '50%',
                                  background: 'var(--brand-light)',
                                  color: 'var(--brand)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.85rem',
                                  flexShrink: 0
                                }}>
                                  {est.nombre.charAt(0)}
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                                    {est.nombre}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {est.familia ? `Acudiente: ${est.familia.nombre}` : 'Sin acudiente registrado'}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {renderBadgeEstado(est.estado, est.promedio)}

                                {/* Botón "Contactar acudiente" */}
                                <button
                                  onClick={() => handleAbrirContactoAcudiente(est, asig)}
                                  style={{
                                    background: est.estado === 'EN_RIESGO' ? '#BE123C' : 'var(--brand)',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: est.estado === 'EN_RIESGO' ? '0 2px 8px rgba(190, 18, 60, 0.25)' : '0 2px 8px rgba(10, 58, 32, 0.2)',
                                    transition: 'all 0.15s ease'
                                  }}
                                  title={`Contactar acudiente de ${est.nombre}`}
                                >
                                  <MessageSquare size={13} />
                                  <span>Contactar acudiente</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </BlurFade>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          MODAL INSTITUCIONAL PARA CONTACTAR ACUDIENTE
      ====================================================================== */}
      {modalContacto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '560px',
            width: '100%',
            boxShadow: 'var(--shadow-premium)',
            overflow: 'hidden',
            border: '1px solid var(--border)'
          }}>
            {/* Encabezado del Modal */}
            <div style={{
              background: 'linear-gradient(135deg, #0A3A20 0%, #0F5A31 100%)',
              color: '#ffffff',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={20} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                  Contactar Acudiente · MonteVerde
                </h3>
              </div>
              <button
                onClick={() => setModalContacto(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
              <div style={{
                background: 'var(--surface)',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                border: '1px solid var(--border)',
                fontSize: '0.82rem',
                display: 'grid',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estudiante:</span>
                  <strong style={{ color: 'var(--text)' }}>{modalContacto.estudiante.nombre}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Asignatura:</span>
                  <strong style={{ color: 'var(--text)' }}>{modalContacto.asig.materia} ({modalContacto.asig.curso})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Acudiente:</span>
                  <strong style={{ color: 'var(--brand)' }}>{modalContacto.familia ? modalContacto.familia.nombre : 'Familia del estudiante'}</strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                  Asunto:
                </label>
                <input
                  type="text"
                  value={asuntoEditable}
                  onChange={(e) => setAsuntoEditable(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    fontSize: '0.88rem',
                    color: 'var(--text)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                  Mensaje institucional (editable):
                </label>
                <textarea
                  rows={6}
                  value={mensajeEditable}
                  onChange={(e) => setMensajeEditable(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    fontSize: '0.88rem',
                    color: 'var(--text)',
                    lineHeight: '1.5',
                    resize: 'none'
                  }}
                />
                <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  * El mensaje no se envía automáticamente. Se precargará en tu bandeja de mensajería para tu confirmación final.
                </p>
              </div>
            </div>

            {/* Footer del Modal */}
            <div style={{
              padding: '1rem 1.5rem',
              background: 'var(--bg-light)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => setModalContacto(null)}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProcederAMensajeria}
                style={{
                  background: 'var(--brand)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(10, 58, 32, 0.2)',
                  cursor: 'pointer'
                }}
              >
                <Send size={14} />
                <span>Abrir en Mensajería</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
