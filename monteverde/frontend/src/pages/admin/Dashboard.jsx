import React, { useState, useEffect, useRef } from 'react';
import { getEstadisticasAdmin } from '../../services/api';
import Chart from 'chart.js/auto';
import adminImg from '../../assets/img/admin.png';
import DiaTextReveal from '../../components/DiaTextReveal';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const doughnutChartRef = useRef(null);
  const barChartRef = useRef(null);
  const doughnutInstance = useRef(null);
  const barInstance = useRef(null);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  useEffect(() => {
    if (!stats) return;

    // 1. Gráfico de tipo dona: Distribución de usuarios por rol
    if (doughnutChartRef.current) {
      if (doughnutInstance.current) {
        doughnutInstance.current.destroy();
      }

      const ctx = doughnutChartRef.current.getContext('2d');
      doughnutInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Administradores', 'Docentes', 'Familias'],
          datasets: [{
            data: [
              stats.usuarios.admins || 0,
              stats.usuarios.docentes || 0,
              stats.usuarios.familias || 0
            ],
            backgroundColor: [
              'rgba(15, 23, 42, 0.85)',   // Slate oscuro (Admin)
              'rgba(21, 128, 61, 0.85)',   // Emerald (Docente)
              'rgba(180, 83, 9, 0.85)'     // Warm Amber (Familia)
            ],
            borderColor: [
              '#0f172a',
              '#15803d',
              '#b45309'
            ],
            borderWidth: 1.5,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                padding: 15,
                font: { size: 11, weight: 600 }
              }
            }
          }
        }
      });
    }

    // 2. Gráfico de barras: Distribución de estudiantes por curso
    if (barChartRef.current && stats.distribucion_cursos) {
      if (barInstance.current) {
        barInstance.current.destroy();
      }

      const ctx = barChartRef.current.getContext('2d');
      const labels = stats.distribucion_cursos.map(item => item.nombre);
      const dataValues = stats.distribucion_cursos.map(item => item.estudiantes);

      barInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Cantidad Estudiantes',
            data: dataValues,
            backgroundColor: 'rgba(10, 58, 32, 0.75)',
            borderColor: 'var(--color-primary)',
            borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, font: { weight: 500 } }
            },
            x: {
              ticks: { font: { weight: 500 } }
            }
          }
        }
      });
    }

    // Limpieza y destrucción de las instancias de los gráficos al desmontar el componente
    return () => {
      if (doughnutInstance.current) doughnutInstance.current.destroy();
      if (barInstance.current) barInstance.current.destroy();
    };
  }, [stats]);

  const cargarEstadisticas = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const data = await getEstadisticasAdmin();
      if (data) {
        setStats(data);
      } else {
        setErrorMsg('No se recibieron datos de estadísticas.');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Error de conexión al cargar estadísticas.');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', color: 'var(--text-secondary)' }}>
        <div style={{
          border: '4px solid var(--border)',
          borderTop: '4px solid var(--color-primary)',
          borderRadius: '50%',
          width: '45px',
          height: '45px',
          animation: 'spin 1s linear infinite',
          marginBottom: '1.25rem'
        }}></div>
        <span style={{ fontWeight: 600 }}>Calculando estadísticas y bitácoras institucionales...</span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (errorMsg || !stats) {
    return (
      <div style={{ padding: '2.5rem 2rem', background: '#FFE4E6', border: '1px solid #FECDD3', color: '#9F1239', borderRadius: '14px', textAlign: 'center', maxWidth: '500px', margin: '3rem auto' }}>
        <div style={{ color: '#BE123C', marginBottom: '1rem' }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h3 style={{ color: '#9F1239', fontFamily: 'Merriweather, serif', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Fallo en la comunicación con el Backend</h3>
        <p style={{ color: '#BE123C', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{errorMsg || 'No se han podido cargar las métricas agregadas del panel.'}</p>
        <button onClick={cargarEstadisticas} className="btn btn--primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '8px' }}>Reintentar Conexión</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Dynamic Welcome bar */}
      <div className="dashboard-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.75rem 2rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.5rem', border: 'none', padding: 0 }}>
            <DiaTextReveal 
              text="¡Hola de nuevo, Administrador!" 
              colors={["#a8ff78", "#78ffb6", "#ffffff"]} 
            />
          </h2>
          <p style={{ margin: '6px 0 0', color: 'rgba(255, 255, 255, 0.88)', fontSize: '0.9rem', fontWeight: 500 }}>
            Aquí tienes el resumen institucional y la actividad reciente del Colegio MonteVerde.
          </p>
        </div>
        <img 
          src={adminImg} 
          alt="Administrador Monteverde" 
          style={{ 
            width: '120px', 
            height: 'auto', 
            objectFit: 'contain',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))'
          }} 
        />
      </div>

      {/* Primary KPIs Metrics Grid */}
      <div className="dashboard-grid dashboard-grid--4">
        {/* Card 1: Users */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ background: '#EEF2F6', color: 'var(--role-admin)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifycontent: 'center', flexShrink: 0, justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cuentas Activas</span>
            <h3 style={{ margin: '2px 0 0', fontSize: '1.35rem', color: 'var(--text)', fontWeight: 800 }}>{stats.usuarios.activos} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {stats.usuarios.total}</span></h3>
          </div>
        </div>

        {/* Card 2: Students */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ background: '#DCFCE7', color: 'var(--color-success)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifycontent: 'center', flexShrink: 0, justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.91a2 2 0 0 0 1.66 0z" />
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estudiantes</span>
            <h3 style={{ margin: '2px 0 0', fontSize: '1.35rem', color: 'var(--text)', fontWeight: 800 }}>{stats.academia.estudiantes}</h3>
          </div>
        </div>

        {/* Card 3: Attendance Average */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ background: '#FEF3C7', color: 'var(--color-warning)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifycontent: 'center', flexShrink: 0, justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Asistencia Promedio</span>
            <h3 style={{ margin: '2px 0 0', fontSize: '1.35rem', color: 'var(--text)', fontWeight: 800 }}>{stats.academia.promedio_asistencia}%</h3>
          </div>
        </div>

        {/* Card 4: Academic Performance */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ background: '#FFE4E6', color: '#BE123C', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifycontent: 'center', flexShrink: 0, justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Promedio General</span>
            <h3 style={{ margin: '2px 0 0', fontSize: '1.35rem', color: 'var(--text)', fontWeight: 800 }}>{stats.academia.promedio_notes || stats.academia.promedio_notas} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 5.0</span></h3>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* Doughnut Chart Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '380px' }}>
          <h3 className="section-title" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
            Roles en el Sistema
          </h3>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <canvas ref={doughnutChartRef}></canvas>
          </div>
        </div>

        {/* Bar Chart Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '380px' }}>
          <h3 className="section-title" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
            Población Estudiantil por Cursos
          </h3>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <canvas ref={barChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Audit Bitacora Panel (Recent activities) */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem'
        }}>
          <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Merriweather, serif' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Bitácora de Auditoría (Actividad Reciente)
          </h3>
          <span className="badge" style={{ fontSize: '0.72rem', fontWeight: 700 }}>Últimos 5 eventos</span>
        </div>

        {(!stats.actividades_recientes || stats.actividades_recientes.length === 0) ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No se registran actividades administrativas recientes en la base de datos.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.actividades_recientes.map((act) => (
              <div key={act.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '0.85rem 1rem',
                background: 'var(--bg-gray-light)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                transition: 'all 0.15s'
              }}>
                <div style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  background: 
                    act.accion.includes('ELIMINAR') || act.accion.includes('DES') ? '#FFE4E6' :
                    act.accion.includes('CREAR') || act.accion.includes('VINCULAR') ? '#DCFCE7' : '#FEF3C7',
                  color:
                    act.accion.includes('ELIMINAR') || act.accion.includes('DES') ? '#9F1239' :
                    act.accion.includes('CREAR') || act.accion.includes('VINCULAR') ? '#15803d' : '#92400E',
                  border: '1px solid currentColor'
                }}>
                  {act.accion.replace('_', ' ')}
                </div>

                <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600 }}>
                    {act.detalles}
                  </p>
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 550 }}>
                    👤 Administrador: <strong style={{ color: 'var(--text)' }}>{act.usuario_nombre}</strong> &bull; 📅 {new Date(act.fecha).toLocaleString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
