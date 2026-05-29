import Card from '../../components/Card';
import ButtonLink from '../../components/ButtonLink';
import BlurFade from '../../components/BlurFade';
import DiaTextReveal from '../../components/DiaTextReveal';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCursos, getDocenteDashboard, getMensajes, getCirculares, formatearFecha, formatearFechaHora } from '../../services/api';
import docenteImg from '../../assets/img/docente.png';

export default function DocenteHome() {
  const { usuario } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [ultimoMensaje, setUltimoMensaje] = useState(null);
  const [circulares, setCirculares] = useState([]);
  const [circularSeleccionada, setCircularSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [cursosData] = await Promise.all([
          getCursos(),
          // Cargar circulares en paralelo
          (async () => {
            try {
              const circularesRes = await getCirculares(5);
              if (circularesRes) {
                const listaCirculares = circularesRes.data ? circularesRes.data : circularesRes;
                setCirculares(listaCirculares);
              }
            } catch (err) {
              console.warn('Circulares no disponibles en Home:', err);
            }
          })()
        ]);
        
        setCursos(cursosData);

        if (usuario?.id) {
          try {
            const dashData = await getDocenteDashboard(usuario.id);
            setDashboardData(dashData);
          } catch (err) {
            console.warn('Dashboard data no disponible, usando datos por defecto:', err);
          }

          try {
            const mensajesData = await getMensajes(usuario.id);
            if (mensajesData && mensajesData.length > 0) {
              setUltimoMensaje(mensajesData[0]);
            }
          } catch (err) {
            console.warn('Mensajes no disponibles:', err);
          }
        }
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    if (usuario) {
      cargarDatos();
    }
  }, [usuario]);

  if (loading) {
    return (
      <div className="grid" style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand border-t-transparent mx-auto mb-4"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando tu dashboard...</p>
      </div>
    );
  }

  const agendaHoy = dashboardData?.agenda || [
    { hora: '8:00 AM', clase: 'Música', grado: '5º', sala: 'Aula 12' },
    { hora: '10:00 AM', clase: 'Ciencias', grado: '7º', sala: 'Laboratorio' },
    { hora: '1:30 PM', clase: 'Matemáticas', grado: '8º', sala: 'Aula 5' }
  ];

  const tareasPendientes = dashboardData?.tareas_pendientes || [
    { titulo: 'Proyecto de Ciencias', grado: '5º', entregas: 12, urgencia: 'hoy' },
    { titulo: 'Ensayo de Historia', grado: '7º', entregas: 8, urgencia: 'mañana' },
    { titulo: 'Trabajo de Arte', grado: '6º', entregas: 4, urgencia: 'próxima semana' }
  ];

  return (
    <div className="dashboard-grid" style={{ gap: '1.5rem' }}>
      <BlurFade delay={0.05} duration={0.35}>
        <div className="dashboard-banner" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '1.5rem' }}>
            <div>
              <h1>
                <DiaTextReveal 
                  text={`¡Buen día, Profesor ${usuario?.nombre || ''}!`} 
                  colors={["#11998e", "#38ef7d", "#a8ff78"]} 
                />
              </h1>
              <p>Su agenda hoy en Monteverde School está lista para llevar el día académico con claridad y calma.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <img src={docenteImg} alt="Dashboard Docente" style={{ width: '240px', maxWidth: '100%', height: 'auto' }} />
            </div>
          </div>
        </div>
      </BlurFade>

      <div className="dashboard-grid dashboard-grid--3">
        <BlurFade delay={0.1} duration={0.4}>
          <Card className="card-slim" title="Agenda Diaria">
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {agendaHoy.map((item, index) => (
                <div key={index} style={{ padding: '1rem', background: 'rgba(255,255,255,.92)', borderRadius: '16px', border: '1px solid rgba(14, 77, 43, .08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                    <strong>{item.hora}</strong>
                    <span className="status-chip status-chip--green">Programado</span>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--brand)' }}>{item.clase}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '.95rem' }}>{item.grado} · {item.sala}</div>
                </div>
              ))}
            </div>
          </Card>
        </BlurFade>

        <BlurFade delay={0.15} duration={0.4}>
          <Card className="card-slim" title="Tareas Pendientes por Calificar">
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {tareasPendientes.map((tarea, index) => (
                <div key={index} style={{ padding: '1rem', borderRadius: '16px', background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.35rem' }}>
                    <strong>{tarea.titulo}</strong>
                    <span style={{ color: '#666' }}>{tarea.entregas} entregas</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '.95rem' }}>{tarea.grado}</div>
                  <div className={`status-chip ${tarea.urgencia === 'hoy' ? 'status-chip--red' : tarea.urgencia === 'mañana' ? 'status-chip--yellow' : 'status-chip--green'}`}>
                    {tarea.urgencia === 'hoy' ? 'Urgente' : tarea.urgencia === 'mañana' ? 'Próximo' : 'Planificado'}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </BlurFade>

        <BlurFade delay={0.2} duration={0.4}>
          <Card className="card-slim" title="Accesos Rápidos">
            <div className="dashboard-grid dashboard-grid--2" style={{ gap: '1rem' }}>
              <ButtonLink to="/docente/calificaciones" variant="primary">Crear Actividad</ButtonLink>
              <ButtonLink to="/docente/asistencia" variant="primary">Llamar Asistencia</ButtonLink>
              <ButtonLink to="/docente/mensajes" variant="primary">Ver Mensajes</ButtonLink>
            </div>
          </Card>
        </BlurFade>
      </div>

      <div className="dashboard-grid dashboard-grid--2">
        <BlurFade delay={0.25} duration={0.45}>
          <Card title="Resumen General" className="card-slim">
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderRadius: '16px', background: 'var(--surface)' }}>
                <div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--brand)' }}>{dashboardData?.estadisticas?.total_estudiantes ?? '24'}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Estudiantes activos</div>
                </div>
                <div className="status-chip status-chip--green">+4%</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderRadius: '16px', background: 'var(--surface)' }}>
                <div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--brand)' }}>{dashboardData?.estadisticas?.total_cursos ?? '8'}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Cursos activos</div>
                </div>
                <div className="status-chip status-chip--yellow">Estable</div>
              </div>
            </div>
          </Card>
        </BlurFade>

        <BlurFade delay={0.3} duration={0.45}>
          <Card title="Últimas Circulares" className="card-slim">
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
        </BlurFade>
      </div>

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
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* Header del Modal */}
            <div style={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              padding: '1.5rem 1.75rem',
              color: '#ffffff',
              position: 'relative'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, paddingRight: '2rem' }}>
                {circularSeleccionada.titulo}
              </h3>
              <p style={{ margin: '0.35rem 0 0', color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.82rem', fontWeight: 500 }}>
                Publicado por: {circularSeleccionada.autor_nombre} · {formatearFechaHora(circularSeleccionada.fecha_publicacion)}
              </p>
              <button 
                onClick={() => setCircularSeleccionada(null)}
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div style={{ padding: '1.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              <p style={{
                margin: 0,
                fontSize: '0.95rem',
                color: '#334155',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {circularSeleccionada.contenido}
              </p>
            </div>

            {/* Footer del Modal */}
            <div style={{
              padding: '1.25rem 1.75rem',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#f8fafc'
            }}>
              <button
                onClick={() => setCircularSeleccionada(null)}
                style={{
                  background: '#11998e',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1.5rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(17, 153, 142, 0.15)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#0f857b'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#11998e'}
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
