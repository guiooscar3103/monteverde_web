import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import BarraTitulo from '../../components/BarraTitulo';
import Card from '../../components/Card';
import { getFamiliaDashboard, getCalificacionesHijo, getCalificacionesBimestreFamilia } from '../../services/api';

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

/** Agrupa las calificaciones por asignatura y período en un mapa estructurado */
const _agruparPorAsignatura = (calificaciones) => {
  const mapa = {};
  calificaciones.forEach(cal => {
    const asig = cal.asignatura || 'Sin asignatura';
    if (!mapa[asig]) mapa[asig] = {};
    mapa[asig][cal.periodo] = parseFloat(cal.nota);
  });
  return mapa;
};

const _estadoNota = (nota) => {
  if (nota === null || nota === undefined) return { label: 'Pendiente', clase: 'estado-pendiente', icono: '⏳' };
  if (nota >= 3.5) return { label: 'Aprobado', clase: 'estado-aprobado', icono: '🟢' };
  if (nota >= 3.0) return { label: 'En riesgo', clase: 'estado-riesgo', icono: '🟠' };
  return { label: 'Reprobado', clase: 'estado-reprobado', icono: '🔴' };
};

const _tendencia = (notas) => {
  const vals = notas.filter(n => n !== null && n !== undefined);
  if (vals.length < 2) return null;
  const diff = vals[vals.length - 1] - vals[0];
  if (diff > 0.2) return { icono: '↗', clase: 'tend-sube', label: 'Mejorando' };
  if (diff < -0.2) return { icono: '↘', clase: 'tend-baja', label: 'Bajando' };
  return { icono: '→', clase: 'tend-igual', label: 'Estable' };
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
  // Nuevo sistema de bimestres
  const [bimestreData, setBimestreData] = useState([]);
  const [loadingBimestre, setLoadingBimestre] = useState(false);

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

          // Cargar desglose por indicadores y bimestres
          setLoadingBimestre(true);
          try {
            const bimData = await getCalificacionesBimestreFamilia(primerHijo.id).catch(() => []);
            setBimestreData(bimData || []);
          } finally {
            setLoadingBimestre(false);
          }
          
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
  const promedioGeneral = parseFloat(_calcularPromedio(calificacionesFiltradas));
  const colorPromedioGeneral = _obtenerColorPromedio(promedioGeneral);

  // Datos agrupados para el nuevo diseño de tarjetas
  const asignaturasAgrupadas = _agruparPorAsignatura(calificaciones);
  const periodosOrdenadosTodos = _extraerPeriodosUnicos(calificaciones);
  const asignaturasOrdenadas = Object.keys(asignaturasAgrupadas).sort();

  // Estadísticas globales
  const promediosPorAsig = asignaturasOrdenadas.map(asig => {
    const notas = Object.values(asignaturasAgrupadas[asig]).filter(n => !isNaN(n));
    return notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
  }).filter(p => p !== null);
  const promedioGlobalAsig = promediosPorAsig.length
    ? (promediosPorAsig.reduce((a, b) => a + b, 0) / promediosPorAsig.length).toFixed(2)
    : null;
  const asigAprobadas = asignaturasOrdenadas.filter(asig => {
    const vals = Object.values(asignaturasAgrupadas[asig]).filter(n => !isNaN(n));
    const prom = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return prom >= 3.5;
  }).length;
  const asigRiesgo = asignaturasOrdenadas.filter(asig => {
    const vals = Object.values(asignaturasAgrupadas[asig]).filter(n => !isNaN(n));
    const prom = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return prom >= 3.0 && prom < 3.5;
  }).length;
  const bimestreActual = periodosOrdenadosTodos[periodosOrdenadosTodos.length - 1] || '—';

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
          {/* ─── BOLETIN ACADÉMICO DIGITAL ─── */}

          {/* Panel resumen global */}
          <div className="boletin-resumen">
            <div className="boletin-stat">
              <span className="boletin-stat-val" style={{ color: _obtenerColorPromedio(parseFloat(promedioGlobalAsig)) }}>
                {promedioGlobalAsig ?? '—'}
              </span>
              <span className="boletin-stat-lbl">Promedio general</span>
            </div>
            <div className="boletin-stat-div" />
            <div className="boletin-stat">
              <span className="boletin-stat-val" style={{ color: 'var(--color-success)' }}>{asigAprobadas}</span>
              <span className="boletin-stat-lbl">Aprobadas</span>
            </div>
            <div className="boletin-stat-div" />
            <div className="boletin-stat">
              <span className="boletin-stat-val" style={{ color: 'var(--color-warning)' }}>{asigRiesgo}</span>
              <span className="boletin-stat-lbl">En riesgo</span>
            </div>
            <div className="boletin-stat-div" />
            <div className="boletin-stat">
              <span className="boletin-stat-val" style={{ color: 'var(--brand)' }}>
                {bimestreActual.replace('2025-', '').replace('P', 'P')}
              </span>
              <span className="boletin-stat-lbl">Bimestre actual</span>
            </div>
          </div>

          {/* Selector de bimestre — tipo pill */}
          <div className="boletin-filtro">
            <button
              className={`boletin-pill ${periodoSeleccionado === 'todos' ? 'boletin-pill--active' : ''}`}
              onClick={() => setPeriodoSeleccionado('todos')}
            >
              Todos
            </button>
            {periodosDisponibles.map(p => (
              <button
                key={p}
                className={`boletin-pill ${periodoSeleccionado === p ? 'boletin-pill--active' : ''}`}
                onClick={() => setPeriodoSeleccionado(p)}
              >
                {p.replace('2025-', '').replace('P', 'Bimestre ')}
              </button>
            ))}
          </div>

          {/* Tarjetas por asignatura */}
          <div className="boletin-cards">
            {asignaturasOrdenadas.map(asignatura => {
              const notasPorPeriodo = asignaturasAgrupadas[asignatura];
              // Determinar períodos a mostrar (filtro activo o todos)
              const periodosAMostrar = periodoSeleccionado === 'todos'
                ? periodosOrdenadosTodos
                : [periodoSeleccionado];

              const notasOrdenadas = periodosOrdenadosTodos
                .map(p => notasPorPeriodo[p] ?? null);

              const notasValidas = notasOrdenadas.filter(n => n !== null);
              const promedioAsig = notasValidas.length
                ? notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length
                : null;
              const tendencia = _tendencia(notasOrdenadas);
              const estadoGlobal = _estadoNota(promedioAsig);

              return (
                <div key={asignatura} className={`boletin-card boletin-card--${estadoGlobal.clase}`}>
                  {/* Cabecera de tarjeta */}
                  <div className="bc-header">
                    <div className="bc-asig">
                      <span className="bc-asig-icon">📚</span>
                      <span className="bc-asig-nombre">{asignatura}</span>
                    </div>
                    <div className="bc-header-right">
                      {tendencia && (
                        <span className={`bc-tend ${tendencia.clase}`} title={tendencia.label}>
                          {tendencia.icono}
                        </span>
                      )}
                      <span className={`bc-estado-badge ${estadoGlobal.clase}`}>
                        {estadoGlobal.icono} {estadoGlobal.label}
                      </span>
                    </div>
                  </div>

                  {/* Evolución visual (sparkline de texto) */}
                  {notasValidas.length > 1 && (
                    <div className="bc-sparkline">
                      {periodosOrdenadosTodos.map((p, i) => {
                        const n = notasPorPeriodo[p];
                        const est = _estadoNota(n ?? null);
                        return (
                          <span key={p} className="bc-spark-item">
                            <span className={`bc-spark-dot ${est.clase}`} />
                            <span className="bc-spark-val">{n !== undefined && n !== null ? n.toFixed(1) : '–'}</span>
                            {i < periodosOrdenadosTodos.length - 1 && <span className="bc-spark-arrow">›</span>}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Filas por período filtrado */}
                  <div className="bc-periodos">
                    {periodosAMostrar.map(periodo => {
                      const nota = notasPorPeriodo[periodo];
                      const estado = _estadoNota(nota ?? null);
                      const nombreLegible = periodo.replace('2025-', '').replace('P', 'Bimestre ');
                      return (
                        <div key={periodo} className="bc-periodo-fila">
                          <span className="bc-periodo-nombre">{nombreLegible}</span>
                          <div className="bc-periodo-derecha">
                            <span className={`bc-nota ${estado.clase}`}>
                              {nota !== undefined && nota !== null ? nota.toFixed(1) : 'Pendiente'}
                            </span>
                            <span className={`bc-estado-chip ${estado.clase}`}>
                              {estado.icono} {estado.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pie de tarjeta */}
                  <div className="bc-footer">
                    <span className="bc-promedio-lbl">Promedio</span>
                    <span className={`bc-promedio-val ${_estadoNota(promedioAsig).clase}`}>
                      {promedioAsig !== null ? promedioAsig.toFixed(2) : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}


      {/* ─── Sección de calificaciones por indicadores de logro ─── */}
      {bimestreData.length > 0 && (
        <Card title="Calificaciones por Indicadores de Logro">
          <div className="bim-familia-wrapper">
            {bimestreData.map((bim, idx) => (
              <div key={idx} className="bim-bloque">
                <div className="bim-bloque-header">
                  <span className="bim-badge">{bim.bimestre}</span>
                  <span className="bim-anio">{bim.anio}</span>
                  {bim.definitiva !== null && (
                    <span className={`bim-definitiva ${bim.definitiva >= 3 ? 'bim-def-aprobada' : 'bim-def-reprobada'}`}>
                      Definitiva: <strong>{bim.definitiva.toFixed(2)}</strong>
                    </span>
                  )}
                </div>

                <div className="bim-indicadores-grid">
                  {(bim.indicadores || []).map((ind, i) => (
                    <div key={i} className={`bim-ind-card bim-ind-card--${ind.numero}`}>
                      <div className="bim-ind-header">
                        <span className={`bim-ind-num bim-ind-num--${ind.numero}`}>{ind.numero}</span>
                        <span className="bim-ind-desc" title={ind.descripcion}>{ind.descripcion}</span>
                      </div>
                      <div className="bim-ind-notas">
                        {[1, 2, 3].map(n => (
                          <div key={n} className="bim-nota-item">
                            <span className="bim-nota-label">Nota {n}</span>
                            <span className={`bim-nota-val ${ind[`nota_${n}`] !== null ? (ind[`nota_${n}`] >= 3 ? 'nota-ap' : 'nota-rp') : ''}`}>
                              {ind[`nota_${n}`] !== null ? parseFloat(ind[`nota_${n}`]).toFixed(2) : '—'}
                            </span>
                          </div>
                        ))}
                        <div className="bim-nota-item bim-nota-prom">
                          <span className="bim-nota-label">Promedio</span>
                          <span className={`bim-nota-val bim-nota-val--prom ${ind.promedio !== null ? (ind.promedio >= 3 ? 'nota-ap' : 'nota-rp') : ''}`}>
                            {ind.promedio !== null ? ind.promedio.toFixed(2) : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loadingBimestre && (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <div className="spinner-ring" style={{ margin: '0 auto 1rem' }} />
            <p>Cargando calificaciones por bimestre...</p>
          </div>
        </Card>
      )}
    </div>
  );
}
