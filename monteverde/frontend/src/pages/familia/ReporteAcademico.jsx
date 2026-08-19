import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import BarraTitulo from '../../components/BarraTitulo';
import Card from '../../components/Card';
import { getFamiliaDashboard, getCalificacionesHijo } from '../../services/api';

// Funciones helper
const _extraerPeriodosUnicos = (calificaciones) => {
  const periodosUnicos = [...new Set(calificaciones.map(cal => cal.periodo))].filter(Boolean);
  return periodosUnicos.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};

const _calcularPromedio = (calificaciones) => {
  if (calificaciones.length === 0) return '0.0';
  const suma = calificaciones.reduce((acc, cal) => acc + (parseFloat(cal.nota) || 0), 0);
  return (suma / calificaciones.length).toFixed(1);
};

const _obtenerEstadisticasPorAsignatura = (calificaciones) => {
  const asignaturas = {};
  
  calificaciones.forEach(cal => {
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
  
  Object.keys(asignaturas).forEach(asignatura => {
    const notas = asignaturas[asignatura].notas;
    asignaturas[asignatura].promedio = (notas.reduce((sum, nota) => sum + nota, 0) / notas.length).toFixed(1);
  });
  
  return asignaturas;
};

const _obtenerColorPromedio = (promedio) => {
  if (promedio >= 3.5) return 'var(--color-success)';
  if (promedio >= 3) return 'var(--color-warning)';
  return 'var(--color-error)';
};

const _filtrarCalificacionesPorPeriodo = (calificaciones, periodoSeleccionado) => {
  return periodoSeleccionado === 'todos' 
    ? calificaciones 
    : calificaciones.filter(cal => cal.periodo === periodoSeleccionado);
};

export default function ReporteAcademico() {
  const { usuario } = useAuth();
  const [calificaciones, setCalificaciones] = useState([]);
  const [calificacionesFiltradas, setCalificacionesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('todos');
  const [periodosDisponibles, setPeriodosDisponibles] = useState([]);
  const [selectedHijoIndex, setSelectedHijoIndex] = useState(0);

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
        
        const dashboard = await getFamiliaDashboard(usuario.id).catch(() => null);
        
        if (dashboard?.hijos?.[selectedHijoIndex]) {
          const primerHijo = dashboard.hijos[selectedHijoIndex];
          setDashboardData(dashboard);
          
          console.log('📊 Cargando calificaciones para estudiante:', primerHijo.id);
          
          const calificacionesData = await getCalificacionesHijo(primerHijo.id);
          setCalificaciones(calificacionesData || []);
          setCalificacionesFiltradas(calificacionesData || []);
          
          const periodosOrdenados = _extraerPeriodosUnicos(calificacionesData || []);
          setPeriodosDisponibles(periodosOrdenados);
          
          console.log('📊 Calificaciones cargadas:', calificacionesData);
          console.log('📊 Períodos disponibles:', periodosOrdenados);
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
  }, [usuario, selectedHijoIndex]);

  // Filtrar calificaciones cuando cambie el período
  useEffect(() => {
    setCalificacionesFiltradas(_filtrarCalificacionesPorPeriodo(calificaciones, periodoSeleccionado));
  }, [periodoSeleccionado, calificaciones]);

  if (loading) {
    return (
      <div className="grid">
        <BarraTitulo titulo="Reporte Académico" subtitulo="Cargando..." />
        <Card>
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <div style={{
              border: '4px solid var(--border)',
              borderTop: '4px solid var(--color-primary)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ fontWeight: 600 }}>Cargando reporte académico...</p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
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
            <p style={{ color: 'var(--color-error)', fontSize: '1.1rem', fontWeight: 600 }}>{error}</p>
            <button 
              onClick={() => globalThis.location.reload()} 
              className="btn btn--primary"
              style={{ marginTop: '1rem' }}
            >
              Recargar página
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const primerHijo = dashboardData?.hijos?.[selectedHijoIndex];
  const estadisticasAsignaturas = _obtenerEstadisticasPorAsignatura(calificacionesFiltradas);
  const promedioGeneral = parseFloat(_calcularPromedio(calificacionesFiltradas));
  const colorPromedioGeneral = _obtenerColorPromedio(promedioGeneral);

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <BarraTitulo 
        titulo="Reporte Académico" 
        subtitulo={primerHijo ? `Calificaciones de ${primerHijo.nombre}` : 'Información académica'}
        derecha={
          <div style={{ fontSize: '0.85rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
            {primerHijo && (
              <>
                <div><strong>{primerHijo.curso}</strong> - {primerHijo.grado}</div>
                <div>Promedio: <strong>{_calcularPromedio(calificacionesFiltradas)}</strong></div>
                <div>Total evaluaciones: <strong>{calificacionesFiltradas.length}</strong></div>
              </>
            )}
          </div>
        }
      />

      {/* Selector premium de hijo (hermanos vinculados) */}
      {dashboardData?.hijos?.length > 1 && (
        <Card title="🧑‍🎓 Seleccionar Estudiante">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label htmlFor="student-select" style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
              Estudiante:
            </label>
            <select
              id="student-select"
              value={selectedHijoIndex}
              onChange={(e) => {
                setLoading(true);
                setSelectedHijoIndex(Number.parseInt(e.target.value, 10));
              }}
              style={{
                minWidth: '220px',
                borderRadius: '8px'
              }}
            >
              {dashboardData.hijos.map((hijo, idx) => (
                <option key={hijo.id} value={idx}>
                  {hijo.nombre} ({hijo.curso})
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {calificaciones.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ fontFamily: 'Merriweather, serif' }}>No hay calificaciones registradas</h3>
            <p style={{ margin: '0.5rem 0' }}>Aún no se han registrado calificaciones para este estudiante.</p>
            <small>Las calificaciones aparecerán aquí una vez que los docentes las registren.</small>
          </div>
        </Card>
      ) : (
        <>
          {/* Filtro por período */}
          <Card title="🔍 Filtrar por Período">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label htmlFor="period-select" style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                Período:
              </label>
              <select
                id="period-select"
                value={periodoSeleccionado}
                onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                style={{
                  minWidth: '180px',
                  borderRadius: '8px'
                }}
              >
                <option value="todos">📅 Todos los períodos</option>
                {periodosDisponibles.map(periodo => (
                  <option key={periodo} value={periodo}>
                    📆 {periodo}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 550 }}>
                Mostrando <strong>{calificacionesFiltradas.length}</strong> de <strong>{calificaciones.length}</strong> evaluaciones
              </div>
            </div>
          </Card>

          {/* Resumen por asignaturas */}
          <Card title={periodoSeleccionado === 'todos' ? '📚 Resumen por Asignaturas' : `📚 Resumen por Asignaturas - ${periodoSeleccionado}`}>
            <div className="grid grid-3" style={{ gap: '1.25rem' }}>
              {Object.entries(estadisticasAsignaturas).map(([asignatura, stats]) => {
                const promedio = Number.parseFloat(stats.promedio);
                
                let colorPromedio = 'var(--color-error)';
                if (promedio >= 3.5) {
                  colorPromedio = 'var(--color-success)';
                } else if (promedio >= 3) {
                  colorPromedio = 'var(--color-warning)';
                }

                let estadoAsignatura = 'REPROBADO';
                if (promedio >= 3.5) {
                  estadoAsignatura = 'APROBADO';
                } else if (promedio >= 3) {
                  estadoAsignatura = 'EN RIESGO';
                }
                
                return (
                  <div 
                    key={asignatura}
                    style={{
                      padding: '1.25rem',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-gray-light)',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 700, 
                      color: 'var(--text)'
                    }}>
                      📖 {asignatura}
                    </div>
                    <div style={{ 
                      fontSize: '1.6rem', 
                      fontWeight: 800, 
                      color: colorPromedio
                    }}>
                      {stats.promedio}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                      {stats.total} evaluaciones
                    </div>
                    <div style={{
                      padding: '0.3rem 0.75rem',
                      backgroundColor: colorPromedio,
                      color: 'white',
                      borderRadius: '999px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase'
                    }}>
                      {estadoAsignatura}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Tabla detallada de calificaciones */}
          <Card title={periodoSeleccionado === 'todos' ? '📊 Detalle de Calificaciones' : `📊 Detalle de Calificaciones - ${periodoSeleccionado}`}>
            <div className="table-container" style={{ margin: 0, border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Asignatura</th>
                    <th style={{ textAlign: 'center' }}>Período</th>
                    <th style={{ textAlign: 'right' }}>Nota</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {calificacionesFiltradas.map((cal) => {
                    const nota = Number.parseFloat(cal.nota) || 0;
                    
                    let estado = 'Reprobado';
                    let colorEstado = 'var(--color-error)';
                    if (nota >= 3.5) {
                      estado = 'Aprobado';
                      colorEstado = 'var(--color-success)';
                    } else if (nota >= 3) {
                      estado = 'En riesgo';
                      colorEstado = 'var(--color-warning)';
                    }
                    
                    return (
                      <tr key={cal.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ fontWeight: 600 }}>
                          📚 {cal.asignatura}
                        </td>
                        <td style={{ 
                          textAlign: 'center',
                          fontWeight: 700,
                          color: 'var(--color-primary)'
                        }}>
                          {cal.periodo || 'N/A'}
                        </td>
                        <td style={{ 
                          textAlign: 'right', 
                          fontWeight: 800,
                          fontSize: '1.15rem',
                          color: colorEstado
                        }}>
                          {nota.toFixed(1)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <span style={{
                              backgroundColor: colorEstado,
                              color: 'white',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.2px'
                            }}>
                              {estado}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Resumen estadístico */}
            <div style={{ 
              marginTop: '1.75rem', 
              padding: '1.5rem', 
              backgroundColor: 'var(--bg-light)', 
              borderRadius: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1.25rem',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {calificacionesFiltradas.length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evaluaciones</div>
              </div>
              <div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 800, 
                  color: colorPromedioGeneral
                }}>
                  {_calcularPromedio(calificacionesFiltradas)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Promedio {periodoSeleccionado === 'todos' ? 'General' : periodoSeleccionado}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>
                  {calificacionesFiltradas.filter(c => Number.parseFloat(c.nota) >= 3.5).length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evaluaciones Aprobadas</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-error)' }}>
                  {calificacionesFiltradas.filter(c => Number.parseFloat(c.nota) < 3).length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evaluaciones Perdidas</div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
