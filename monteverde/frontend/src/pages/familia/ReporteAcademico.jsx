import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import BarraTitulo from '../../components/BarraTitulo';
import Card from '../../components/Card';
import { getFamiliaDashboard, getCalificacionesHijo } from '../../services/api';

export default function ReporteAcademico() {
  const { usuario } = useAuth();
  const [calificaciones, setCalificaciones] = useState([]);
  const [calificacionesFiltradas, setCalificacionesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('todos');
  const [periodosDisponibles, setPeriodosDisponibles] = useState([]);

  // Cargar calificaciones del hijo
  useEffect(() => {
    const cargarDatos = async () => {
      if (!usuario?.id) {
        setError('Usuario no disponible');
        setLoading(false);
        return;
      }

      try {
        console.log('📊 Cargando reporte académico para usuario:', usuario.id);
        
        // Primero obtener info de la familia para saber qué hijo mostrar
        const dashboard = await getFamiliaDashboard(usuario.id).catch(() => null);
        
        if (dashboard?.hijos?.[0]) {
          const primerHijo = dashboard.hijos[0];
          setDashboardData(dashboard);
          
          console.log('📊 Cargando calificaciones para estudiante:', primerHijo.id);
          
          // Cargar calificaciones del primer hijo
          const calificacionesData = await getCalificacionesHijo(primerHijo.id);
          setCalificaciones(calificacionesData || []);
          setCalificacionesFiltradas(calificacionesData || []);
          
          // Extraer períodos únicos
          const periodosUnicos = [...new Set((calificacionesData || []).map(cal => cal.periodo))].filter(Boolean);
          setPeriodosDisponibles(periodosUnicos.sort());
          
          console.log('📊 Calificaciones cargadas:', calificacionesData);
          console.log('📊 Períodos disponibles:', periodosUnicos);
        } else {
          setError('No se encontraron estudiantes asociados');
        }
        
      } catch (err) {
        console.error('❌ Error al cargar reporte:', err);
        setError('Error al cargar las calificaciones: ' + err.message);
        setCalificaciones([]);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [usuario]);

  // Filtrar calificaciones cuando cambie el período
  useEffect(() => {
    if (periodoSeleccionado === 'todos') {
      setCalificacionesFiltradas(calificaciones);
    } else {
      setCalificacionesFiltradas(calificaciones.filter(cal => cal.periodo === periodoSeleccionado));
    }
  }, [periodoSeleccionado, calificaciones]);

  const calcularPromedio = (calificacionesParaCalcular = calificacionesFiltradas) => {
    if (calificacionesParaCalcular.length === 0) return 0;
    const suma = calificacionesParaCalcular.reduce((acc, cal) => acc + (parseFloat(cal.nota) || 0), 0);
    return (suma / calificacionesParaCalcular.length).toFixed(1);
  };

  const obtenerEstadisticasPorAsignatura = (calificacionesParaCalcular = calificacionesFiltradas) => {
    const asignaturas = {};
    
    calificacionesParaCalcular.forEach(cal => {
      if (!asignaturas[cal.asignatura]) {
        asignaturas[cal.asignatura] = {
          notas: [],
          promedio: 0,
          total: 0
        };
      }
      asignaturas[cal.asignatura].notas.push(parseFloat(cal.nota) || 0);
      asignaturas[cal.asignatura].total++;
    });
    
    // Calcular promedios
    Object.keys(asignaturas).forEach(asignatura => {
      const notas = asignaturas[asignatura].notas;
      asignaturas[asignatura].promedio = (notas.reduce((sum, nota) => sum + nota, 0) / notas.length).toFixed(1);
    });
    
    return asignaturas;
  };

  if (loading) {
    return (
      <div className="grid">
        <BarraTitulo titulo="Reporte Académico" subtitulo="Cargando..." />
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
            <p>Cargando reporte académico...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid">
        <BarraTitulo titulo="Reporte Académico" subtitulo="Error" />
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <p style={{ color: '#e74c3c', fontSize: '1.1rem' }}>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0e4d2b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Recargar página
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const primerHijo = dashboardData?.hijos?.[0];
  const estadisticasAsignaturas = obtenerEstadisticasPorAsignatura();

  return (
    <div className="grid">
      <BarraTitulo 
        titulo="Reporte Académico" 
        subtitulo={primerHijo ? `Calificaciones de ${primerHijo.nombre}` : 'Información académica'}
        derecha={
          <div style={{ fontSize: '0.9rem', textAlign: 'right', color: '#666' }}>
            {primerHijo && (
              <>
                <div><strong>{primerHijo.curso}</strong> - {primerHijo.grado}</div>
                <div>Promedio: <strong>{calcularPromedio()}</strong></div>
                <div>Total evaluaciones: <strong>{calificacionesFiltradas.length}</strong></div>
              </>
            )}
          </div>
        }
      />

      {calificaciones.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
            <h3>No hay calificaciones registradas</h3>
            <p>Aún no se han registrado calificaciones para este estudiante.</p>
            <small>Las calificaciones aparecerán aquí una vez que los docentes las registren.</small>
          </div>
        </Card>
      ) : (
        <>
          {/* Filtro por período */}
          <Card title="🔍 Filtrar por Período">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontWeight: 'bold', color: '#0e4d2b' }}>
                Período:
              </label>
              <select
                value={periodoSeleccionado}
                onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  minWidth: '150px'
                }}
              >
                <option value="todos">📅 Todos los períodos</option>
                {periodosDisponibles.map(periodo => (
                  <option key={periodo} value={periodo}>
                    📆 {periodo}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Mostrando <strong>{calificacionesFiltradas.length}</strong> de <strong>{calificaciones.length}</strong> evaluaciones
              </div>
            </div>
          </Card>

          {/* Resumen por asignaturas */}
          <Card title={`📚 Resumen por Asignaturas ${periodoSeleccionado !== 'todos' ? `- ${periodoSeleccionado}` : ''}`}>
            <div className="grid grid-3" style={{ gap: '1rem' }}>
              {Object.entries(estadisticasAsignaturas).map(([asignatura, stats]) => {
                const promedio = parseFloat(stats.promedio);
                const colorPromedio = promedio >= 3.5 ? '#27ae60' : promedio >= 3.0 ? '#f39c12' : '#e74c3c';
                
                return (
                  <div 
                    key={asignatura}
                    style={{
                      padding: '1rem',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: '#f9f9f9',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ 
                      fontSize: '1rem', 
                      fontWeight: 'bold', 
                      marginBottom: '0.5rem',
                      color: '#333'
                    }}>
                      📖 {asignatura}
                    </div>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      color: colorPromedio,
                      marginBottom: '0.25rem'
                    }}>
                      {stats.promedio}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                      {stats.total} evaluaciones
                    </div>
                    <div style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: colorPromedio,
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}>
                      {promedio >= 3.5 ? 'APROBADO' : promedio >= 3.0 ? 'EN RIESGO' : 'REPROBADO'}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Tabla detallada de calificaciones */}
          <Card title={`📊 Detalle de Calificaciones ${periodoSeleccionado !== 'todos' ? `- ${periodoSeleccionado}` : ''}` }>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      borderBottom: '2px solid #ddd',
                      fontWeight: 'bold'
                    }}>
                      Asignatura
                    </th>
                    <th style={{ 
                      textAlign: 'center', 
                      padding: '1rem', 
                      borderBottom: '2px solid #ddd',
                      fontWeight: 'bold'
                    }}>
                      Período
                    </th>
                    <th style={{ 
                      textAlign: 'right', 
                      padding: '1rem', 
                      borderBottom: '2px solid #ddd',
                      fontWeight: 'bold'
                    }}>
                      Nota
                    </th>
                    <th style={{ 
                      textAlign: 'center', 
                      padding: '1rem', 
                      borderBottom: '2px solid #ddd',
                      fontWeight: 'bold'
                    }}>
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {calificacionesFiltradas.map((cal) => {
                    const nota = parseFloat(cal.nota) || 0;
                    const estado = nota >= 3.5 ? 'Aprobado' : nota >= 3.0 ? 'En riesgo' : 'Reprobado';
                    const colorEstado = nota >= 3.5 ? '#27ae60' : nota >= 3.0 ? '#f39c12' : '#e74c3c';
                    
                    return (
                      <tr key={cal.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ 
                          padding: '1rem', 
                          fontWeight: '500'
                        }}>
                          📚 {cal.asignatura}
                        </td>
                        <td style={{ 
                          padding: '1rem', 
                          textAlign: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          color: '#0e4d2b'
                        }}>
                          {cal.periodo || 'N/A'}
                        </td>
                        <td style={{ 
                          textAlign: 'right', 
                          padding: '1rem', 
                          fontWeight: 'bold',
                          fontSize: '1.2rem',
                          color: colorEstado
                        }}>
                          {nota.toFixed(1)}
                        </td>
                        <td style={{ 
                          textAlign: 'center', 
                          padding: '1rem'
                        }}>
                          <span style={{
                            backgroundColor: colorEstado,
                            color: 'white',
                            padding: '0.3rem 0.8rem',
                            borderRadius: '15px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            {estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Resumen estadístico */}
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1.5rem', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0e4d2b' }}>
                  {calificacionesFiltradas.length}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Evaluaciones Mostradas</div>
              </div>
              <div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: parseFloat(calcularPromedio()) >= 3.5 ? '#27ae60' : parseFloat(calcularPromedio()) >= 3.0 ? '#f39c12' : '#e74c3c'
                }}>
                  {calcularPromedio()}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Promedio {periodoSeleccionado !== 'todos' ? periodoSeleccionado : 'General'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#27ae60' }}>
                  {calificacionesFiltradas.filter(c => parseFloat(c.nota) >= 3.5).length}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Evaluaciones Aprobadas</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>
                  {calificacionesFiltradas.filter(c => parseFloat(c.nota) < 3.0).length}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Evaluaciones Perdidas</div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
