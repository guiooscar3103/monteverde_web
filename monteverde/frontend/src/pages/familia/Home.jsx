import Card from '../../components/Card';
import ButtonLink from '../../components/ButtonLink';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getFamiliaDashboard, getMensajesPorUsuario } from '../../services/api';
import familiaImg from '../../assets/img/familia.png';
import logoColegio from '../../assets/img/logo-colegio.png';

export default function FamiliaHome() {
  const { usuario } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [ultimoMensaje, setUltimoMensaje] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      if (!usuario?.id) {
        setMensaje('⚠️ Usuario no disponible');
        setLoading(false);
        return;
      }

      try {
        const [dashboard, mensajes] = await Promise.all([
          getFamiliaDashboard(usuario.id),
          getMensajesPorUsuario(usuario.id).catch(err => {
            console.warn('No se pudieron cargar mensajes:', err);
            return [];
          })
        ]);

        setDashboardData(dashboard);

        if (mensajes && mensajes.length > 0) {
          const mensajesRecibidos = mensajes.filter(m => m.receptor_id === usuario.id);
          if (mensajesRecibidos.length > 0) {
            setUltimoMensaje(mensajesRecibidos[0]);
          }
        }
      } catch (error) {
        console.error('❌ Error al cargar dashboard:', error);
        setMensaje('❌ Error al cargar información: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [usuario]);

  if (loading) {
    return (
      <div className="grid" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent mx-auto mb-4"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando tu vista familiar...</p>
      </div>
    );
  }

  const hijoSeleccionado = dashboardData?.hijos?.[0] || {};
  const semaforo = [
    { label: 'Entregado', value: 12, color: 'status-chip--green' },
    { label: 'Pendiente', value: 4, color: 'status-chip--yellow' },
    { label: 'Próximo a vencer', value: 2, color: 'status-chip--red' }
  ];

  return (
    <div className="mobile-overview">
      <div style={{ display: 'grid', gap: '1rem', padding: '1.5rem', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(236,252,245,0.95), rgba(255,255,255,0.85))', boxShadow: '0 12px 30px rgba(14,77,43,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logoColegio} alt="Monteverde School" style={{ width: '68px', height: 'auto' }} />
          <div>
            <h2 style={{ margin: 0 }}>¡Hola, {usuario?.nombre}!</h2>
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

      <Card title="El Semáforo de Tareas">
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          {semaforo.map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '16px', background: '#fff', border: '1px solid rgba(14,77,43,.08)' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{item.label}</div>
                <small style={{ color: 'var(--text-secondary)' }}>Estado actual</small>
              </div>
              <span className={`status-chip ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Últimas Circulares">
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '18px', background: 'var(--surface)' }}>
            <strong>Reunión de padres</strong>
            <p style={{ color: 'var(--text-secondary)', marginTop: '.5rem' }}>El viernes a las 6:00 PM en el Auditorio Principal.</p>
          </div>
          <div style={{ padding: '1rem', borderRadius: '18px', background: 'var(--surface)' }}>
            <strong>Salida pedagógica</strong>
            <p style={{ color: 'var(--text-secondary)', marginTop: '.5rem' }}>Mañana en el museo de ciencias naturales.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
