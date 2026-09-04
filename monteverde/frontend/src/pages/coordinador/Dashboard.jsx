import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Library,
  GraduationCap,
  Megaphone,
  CalendarCheck,
  Award,
  ArrowRight,
  Sparkles,
  Users,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getEstadisticasAdmin } from '../../services/api';
import Chart from 'chart.js/auto';

export default function CoordinadorDashboard() {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const barChartRef = useRef(null);
  const barInstance = useRef(null);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  useEffect(() => {
    if (!stats || !barChartRef.current || !stats.distribucion_cursos) return;

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
          label: 'Estudiantes Matriculados',
          data: dataValues,
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderColor: '#059669',
          borderWidth: 1.5,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(5, 150, 105, 0.9)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#064e3b',
            titleFont: { size: 12, weight: 600 },
            bodyFont: { size: 12 },
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, font: { size: 11 } },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: {
            ticks: { font: { size: 11, weight: 600 } },
            grid: { display: false }
          }
        }
      }
    });

    return () => {
      if (barInstance.current) {
        barInstance.current.destroy();
      }
    };
  }, [stats]);

  const cargarEstadisticas = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const data = await getEstadisticasAdmin();
      setStats(data);
    } catch (err) {
      console.error('Error al cargar estadísticas académicas:', err);
      setErrorMsg('No se pudieron sincronizar los indicadores académicos en tiempo real.');
    } finally {
      setCargando(false);
    }
  };

  const metricCards = [
    {
      title: 'Promedio General',
      value: `${stats?.academia?.promedio_notas || stats?.academia?.promedio_notes || '0.0'} / 5.0`,
      description: 'Rendimiento académico global',
      icon: <Award size={24} color="#e11d48" />,
      bgIcon: '#ffe4e6',
      to: '/coordinador/cursos'
    },
    {
      title: 'Asistencia Promedio',
      value: `${stats?.academia?.promedio_asistencia ?? 0}%`,
      description: 'Asistencia escolar institucional',
      icon: <CalendarCheck size={24} color="#d97706" />,
      bgIcon: '#fef3c7',
      to: '/coordinador/cursos'
    },
    {
      title: 'Cursos Activos',
      value: stats?.academia?.cursos ?? stats?.academico?.cursos ?? 0,
      description: 'Grupos y grados configurados',
      icon: <BookOpen size={24} color="#059669" />,
      bgIcon: '#ecfdf5',
      to: '/coordinador/cursos'
    },
    {
      title: 'Cuerpo Docente',
      value: stats?.usuarios?.docentes ?? 0,
      description: 'Profesores activos en el sistema',
      icon: <GraduationCap size={24} color="#7c3aed" />,
      bgIcon: '#f5f3ff',
      to: '/coordinador/docentes'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      {/* Banner de Bienvenida Institucional */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
        borderRadius: '16px',
        padding: '2rem 2.5rem',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.18)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.5px',
            marginBottom: '0.75rem',
            backdropFilter: 'blur(4px)'
          }}>
            <Sparkles size={14} /> GESTIÓN Y COORDINACIÓN ACADÉMICA
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.5px' }}>
            Panel de Coordinación Curricular
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.98rem', lineHeight: '1.5' }}>
            Supervisa los planes de estudio, organiza los cursos lectivos, asigna las cargas horarias de los docentes y mantén comunicada a la comunidad institucional.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/coordinador/cursos')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff',
              color: '#064e3b',
              fontWeight: 700,
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
          >
            Gestionar Cursos <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '1rem 1.5rem',
          borderRadius: '10px',
          fontSize: '0.92rem'
        }}>
          {errorMsg}
        </div>
      )}

      {/* Tarjetas de Métricas Académicas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem'
      }}>
        {metricCards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.to)}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: card.bgIcon,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {card.icon}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                Ver detalle <ArrowRight size={12} />
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                {card.title}
              </span>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', display: 'block' }}>
                {cargando ? '...' : card.value}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.25rem', display: 'block' }}>
                {card.description}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Distribución y Accesos Rápidos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Gráfico de distribución de estudiantes por curso */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.75rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
                Población Estudiantil por Curso
              </h3>
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                Monitoreo del cupo y distribución de alumnos por aula lectiva
              </span>
            </div>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#059669',
              background: '#ecfdf5',
              padding: '4px 10px',
              borderRadius: '20px'
            }}>
              {stats?.academia?.estudiantes ?? stats?.academico?.estudiantes ?? 0} Estudiantes Totales
            </span>
          </div>

          <div style={{ height: '280px', position: 'relative' }}>
            {cargando ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                Cargando métricas de cursos...
              </div>
            ) : (
              <canvas ref={barChartRef} />
            )}
          </div>
        </div>

        {/* Acciones Rápidas del Coordinador */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.75rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
              Operaciones Rápidas
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: '#6b7280' }}>
              Atajos a las tareas más frecuentes de la coordinación académica.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => navigate('/coordinador/cursos')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  color: '#1f2937',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
              >
                <BookOpen size={18} color="#059669" />
                <span>Nuevo Curso o Grado</span>
              </button>

              <button
                onClick={() => navigate('/coordinador/asignaturas')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  color: '#1f2937',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
              >
                <Library size={18} color="#2563eb" />
                <span>Nueva Asignatura al Plan</span>
              </button>

              <button
                onClick={() => navigate('/coordinador/docentes')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  color: '#1f2937',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
              >
                <GraduationCap size={18} color="#7c3aed" />
                <span>Asignar Carga Horaria Docente</span>
              </button>

              <button
                onClick={() => navigate('/coordinador/calendario')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #bbf7d0',
                  background: '#f0fdf4',
                  color: '#166534',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
                onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
              >
                <Calendar size={18} color="#059669" />
                <span>Calendario y Cierre de Periodos</span>
              </button>

              <button
                onClick={() => navigate('/coordinador/circulares')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  color: '#1f2937',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
              >
                <Megaphone size={18} color="#d97706" />
                <span>Publicar Comunicado o Circular</span>
              </button>
            </div>
          </div>

          <div
            onClick={() => navigate('/coordinador/calendario')}
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: '10px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              fontSize: '0.78rem',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dcfce7'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f0fdf4'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarCheck size={16} />
              <span>Año Lectivo 2026 — Periodos evaluativos vigentes</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.74rem', textDecoration: 'underline' }}>Administrar fechas &rarr;</span>
          </div>
        </div>
      </div>
    </div>
  );
}
