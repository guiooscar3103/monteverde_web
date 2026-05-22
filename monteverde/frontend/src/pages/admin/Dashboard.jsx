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
              'rgba(239, 68, 68, 0.85)',   // Rojo suave (Administrador)
              'rgba(79, 70, 229, 0.85)',   // Índigo suave (Docente)
              'rgba(16, 185, 129, 0.85)'   // Esmeralda suave (Familia)
            ],
            borderColor: [
              '#ef4444',
              '#4f46e5',
              '#10b981'
            ],
            borderWidth: 1,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: { size: 12, weight: 600 }
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
            backgroundColor: 'rgba(79, 70, 229, 0.75)',
            borderColor: '#4f46e5',
            borderWidth: 1,
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
              ticks: { stepSize: 1 }
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: '#64748b' }}>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #4f46e5',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}></div>
        <span>Calculando estadísticas y bitácoras institucionales...</span>
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
      <div style={{ padding: '2rem', background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', borderRadius: '12px', textAlign: 'center' }}>
        <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h3 style={{ marginTop: '1rem' }}>Fallo en la comunicación con el Backend</h3>
        <p>{errorMsg || 'No se han podido cargar las métricas agregadas del panel.'}</p>
        <button onClick={cargarEstadisticas} className="btn btn--primary" style={{ marginTop: '1rem' }}>Reintentar Conexión</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Dynamic Welcome bar */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        padding: '1.5rem 2rem',
        borderRadius: '16px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.6rem', border: 'none', padding: 0 }}>
            <DiaTextReveal 
              text="¡Hola de nuevo, Administrador!" 
              colors={["#11998e", "#38ef7d", "#a8ff78"]} 
            />
          </h2>
          <p style={{ margin: '5px 0 0', color: '#c7d2fe', fontSize: '0.95rem' }}>
            Aquí tienes el resumen institucional y la actividad reciente del Colegio MonteVerde.
          </p>
        </div>
        <img src={adminImg} alt="Administrador Monteverde" style={{ width: '130px', maxWidth: '120px', objectFit: 'contain' }} />
      </div>

      {/* Primary KPIs Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Card 1: Users */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem' }}>
          <div style={{ background: '#e0e7ff', color: '#4f46e5', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Cuentas Activas</span>
            <h3 style={{ margin: '2px 0 0', fontSize: '1.5rem', color: '#1e293b' }}>{stats.usuarios.activos} / {stats.usuarios.total}</h3>
          </div>
        </div>

        {/* Card 2: Students */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem' }}>
          <div style={{ background: '#d1fae5', color: '#10b981', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.91a2 2 0 0 0 1.66 0z" />
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Estudiantes</span>
            <h3 style={{ margin: '2px 0 0', fontSize: '1.5rem', color: '#1e293b' }}>{stats.academia.estudiantes}</h3>
          </div>
        </div>

        {/* Card 3: Attendance Average */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem' }}>
          <div style={{ background: '#fef3c7', color: '#d97706', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Asistencia Promedio</span>
            <h3 style={{ margin: '2px 0 0', fontSize: '1.5rem', color: '#1e293b' }}>{stats.academia.promedio_asistencia}%</h3>
          </div>
        </div>

        {/* Card 4: Academic Performance */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem' }}>
          <div style={{ background: '#fee2e2', color: '#ef4444', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Promedio de Notas</span>
            <h3 style={{ margin: '2px 0 0', fontSize: '1.5rem', color: '#1e293b' }}>{stats.academia.promedio_notes || stats.academia.promedio_notas} / 5.0</h3>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '1.5rem',
      }}>
        {/* Doughnut Chart Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '380px' }}>
          <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            Roles en el Sistema
          </h3>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <canvas ref={doughnutChartRef}></canvas>
          </div>
        </div>

        {/* Bar Chart Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '380px' }}>
          <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            Población Estudiantil por Cursos
          </h3>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <canvas ref={barChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Audit Bitacora Panel (Recent activities) */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0.75rem',
          marginBottom: '1rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Bitácora de Auditoría (Actividad Reciente)
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Mostrando los últimos 5 eventos</span>
        </div>

        {(!stats.actividades_recientes || stats.actividades_recientes.length === 0) ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
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
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
                borderRadius: '8px',
                transition: 'all 0.15s'
              }}>
                <div style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  background: 
                    act.accion.includes('ELIMINAR') || act.accion.includes('DES') ? '#fee2e2' :
                    act.accion.includes('CREAR') || act.accion.includes('VINCULAR') ? '#d1fae5' : '#fef3c7',
                  color:
                    act.accion.includes('ELIMINAR') || act.accion.includes('DES') ? '#b91c1c' :
                    act.accion.includes('CREAR') || act.accion.includes('VINCULAR') ? '#065f46' : '#d97706'
                }}>
                  {act.accion.replace('_', ' ')}
                </div>

                <div style={{ flexGrow: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e293b', fontWeight: 500 }}>
                    {act.detalles}
                  </p>
                  <small style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                    👤 Administrador: <strong>{act.usuario_nombre}</strong> &bull; 📅 {new Date(act.fecha).toLocaleString()}
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
