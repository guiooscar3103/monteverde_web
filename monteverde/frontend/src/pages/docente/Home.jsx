import Card from '../../components/Card';
import ButtonLink from '../../components/ButtonLink';
import BlurFade from '../../components/BlurFade';
import DiaTextReveal from '../../components/DiaTextReveal';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCursos, getDocenteDashboard, getMensajes } from '../../services/api';
import docenteImg from '../../assets/img/docente.png';

export default function DocenteHome() {
  const { usuario } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [ultimoMensaje, setUltimoMensaje] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const cursosData = await getCursos();
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
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
              <li style={{ padding: '1rem', borderRadius: '16px', background: 'var(--surface)' }}>
                <strong>Reunión de padres</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '.35rem' }}>Jueves 22, 5:00 PM en el salón principal.</p>
              </li>
              <li style={{ padding: '1rem', borderRadius: '16px', background: 'var(--surface)' }}>
                <strong>Proyecto ambiental</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '.35rem' }}>Nueva cápsula verde para el jardín escolar.</p>
              </li>
            </ul>
          </Card>
        </BlurFade>
      </div>
    </div>
  );
}
