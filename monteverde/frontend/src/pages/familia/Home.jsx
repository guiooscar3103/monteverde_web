import Card from '../../components/Card';
import ButtonLink from '../../components/ButtonLink';
import DiaTextReveal from '../../components/DiaTextReveal';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getFamiliaDashboard, getMensajesPorUsuario, getCirculares, formatearFecha, formatearFechaHora } from '../../services/api';
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

  useEffect(() => {
    const cargarDatos = async () => {
      if (!usuario?.id) {
        setMensaje('⚠️ Usuario no disponible');
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

  const hijoSeleccionado = dashboardData?.hijos?.[selectedHijoIndex] || {};
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
          <span style={{ fontSize: '1.25rem' }}>🧑‍🎓</span>
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
