import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import BarraTitulo from '../../components/BarraTitulo';
import Card from '../../components/Card';
import {
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  BookOpen,
  BarChart3,
  Calculator,
  FlaskConical,
  Globe,
  Languages,
  Palette,
  Activity,
  Music,
  Laptop,
  Compass,
  Calendar,
  Layers
} from 'lucide-react';
import { getFamiliaDashboard, getCalificacionesHijo, getCalificacionesBimestreFamilia } from '../../services/api';

// Configuración visual por asignatura (Icono profesional Lucide + paleta institucional sutil)
const _obtenerConfigAsignatura = (nombre = '') => {
  const n = (nombre || '').toLowerCase().trim();
  if (n.includes('matemát') || n.includes('calcul') || n.includes('geometr') || n.includes('álgebr') || n.includes('math')) {
    return { icon: Calculator, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', label: 'Matemáticas' };
  }
  if (n.includes('lengua') || n.includes('español') || n.includes('literat') || n.includes('castell') || n.includes('lenguaje')) {
    return { icon: BookOpen, color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', label: 'Lengua Castellana' };
  }
  if (n.includes('natural') || n.includes('biolog') || n.includes('químic') || n.includes('físic') || n.includes('cienc')) {
    return { icon: FlaskConical, color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', label: 'Ciencias Naturales' };
  }
  if (n.includes('social') || n.includes('histori') || n.includes('geograf') || n.includes('ciudadan')) {
    return { icon: Globe, color: '#b45309', bg: '#fffbeb', border: '#fde68a', label: 'Ciencias Sociales' };
  }
  if (n.includes('ingl') || n.includes('idiom') || n.includes('english') || n.includes('extranj')) {
    return { icon: Languages, color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', label: 'Inglés' };
  }
  if (n.includes('arte') || n.includes('artístic') || n.includes('plástic') || n.includes('dibuj')) {
    return { icon: Palette, color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8', label: 'Educación Artística' };
  }
  if (n.includes('deport') || n.includes('recreac') || n.includes('educación física') || n.includes('ed. física')) {
    return { icon: Activity, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: 'Educación Física' };
  }
  if (n.includes('músic')) {
    return { icon: Music, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', label: 'Música' };
  }
  if (n.includes('tecnol') || n.includes('informát') || n.includes('sistem') || n.includes('comput')) {
    return { icon: Laptop, color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', label: 'Tecnología' };
  }
  if (n.includes('étic') || n.includes('valor') || n.includes('relig') || n.includes('filosof') || n.includes('conviv')) {
    return { icon: Compass, color: '#c2410c', bg: '#fff7ed', border: '#ffedd5', label: 'Ética y Valores' };
  }
  return { icon: GraduationCap, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', label: nombre || 'Asignatura' };
};

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
  if (nota === null || nota === undefined) return { label: 'Pendiente', clase: 'estado-pendiente', IconComponent: Clock };
  if (nota >= 3.5) return { label: 'Aprobado', clase: 'estado-aprobado', IconComponent: CheckCircle2 };
  if (nota >= 3.0) return { label: 'En riesgo', clase: 'estado-riesgo', IconComponent: AlertTriangle };
  return { label: 'Reprobado', clase: 'estado-reprobado', IconComponent: XCircle };
};

const _tendencia = (notas) => {
  const vals = notas.filter(n => n !== null && n !== undefined);
  if (vals.length < 2) return null;
  const diff = vals[vals.length - 1] - vals[0];
  if (diff > 0.2) return { IconComponent: TrendingUp, clase: 'tend-sube', label: 'Mejorando' };
  if (diff < -0.2) return { IconComponent: TrendingDown, clase: 'tend-baja', label: 'Bajando' };
  return { IconComponent: Minus, clase: 'tend-igual', label: 'Estable' };
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
            <AlertTriangle size={48} style={{ color: 'var(--color-error)', margin: '0 auto 1rem' }} />
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
        <Card title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={20} />
            <span>Seleccionar Estudiante</span>
          </span>
        }>
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
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <BarChart3 size={48} strokeWidth={1.5} />
            </div>
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
              const EstadoIcon = estadoGlobal.IconComponent;
              const TendenciaIcon = tendencia?.IconComponent;

              return (
                <div key={asignatura} className={`boletin-card boletin-card--${estadoGlobal.clase}`}>
                  {/* Cabecera de tarjeta */}
                  <div className="bc-header">
                    <div className="bc-asig">
                      <span className="bc-asig-icon">
                        <BookOpen size={16} />
                      </span>
                      <span className="bc-asig-nombre">{asignatura}</span>
                    </div>
                    <div className="bc-header-right">
                      {tendencia && (
                        <span className={`bc-tend ${tendencia.clase}`} title={tendencia.label} style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <TendenciaIcon size={14} />
                        </span>
                      )}
                      <span className={`bc-estado-badge ${estadoGlobal.clase}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <EstadoIcon size={12} />
                        <span>{estadoGlobal.label}</span>
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
                      const FilaEstadoIcon = estado.IconComponent;
                      return (
                        <div key={periodo} className="bc-periodo-fila">
                          <span className="bc-periodo-nombre">{nombreLegible}</span>
                          <div className="bc-periodo-derecha">
                            <span className={`bc-nota ${estado.clase}`}>
                              {nota !== undefined && nota !== null ? nota.toFixed(1) : 'Pendiente'}
                            </span>
                            <span className={`bc-estado-chip ${estado.clase}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <FilaEstadoIcon size={12} />
                              <span>{estado.label}</span>
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


      {/* ─── Sección de calificaciones por asignatura e indicadores de logro ─── */}
      {bimestreData.length > 0 && (
        <Card title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} style={{ color: 'var(--color-primary)' }} />
            <span>Calificaciones por Asignatura e Indicadores de Logro</span>
          </span>
        }>
          <div className="bim-familia-wrapper">
            {bimestreData
              .filter(bim => {
                if (periodoSeleccionado === 'todos') return true;
                const pNum = periodoSeleccionado.replace(/[^0-9]/g, '');
                const bNum = (bim.bimestre || '').replace(/[^0-9]/g, '');
                if (pNum && bNum && pNum === bNum) return true;
                return (bim.bimestre || '').toLowerCase().includes(periodoSeleccionado.toLowerCase());
              })
              .map((bim, idx) => {
                const nombreAsignatura = bim.asignatura || bim.materia_nombre || bim.materia || 'Asignatura';
                const configAsig = _obtenerConfigAsignatura(nombreAsignatura);
                const IconoAsignatura = configAsig.icon;
                const defVal = bim.definitiva !== null && bim.definitiva !== undefined ? parseFloat(bim.definitiva) : null;

                return (
                  <div key={`${bim.materia_id || nombreAsignatura}-${bim.bimestre_id || bim.bimestre}-${idx}`} className="asig-card">
                    {/* Encabezado: Nivel 1 (Asignatura) + Nivel 2 (Bimestre) + Nivel 3 (Definitiva) */}
                    <div className="asig-card-header">
                      <div className="asig-title-group">
                        <span 
                          className="asig-icon-badge" 
                          style={{ 
                            color: configAsig.color, 
                            backgroundColor: configAsig.bg, 
                            borderColor: configAsig.border 
                          }}
                        >
                          <IconoAsignatura size={22} strokeWidth={2.2} />
                        </span>
                        <div className="asig-header-text">
                          <h3 className="asig-nombre">{nombreAsignatura}</h3>
                          <div className="asig-meta">
                            <span className="asig-bimestre-badge">
                              <Calendar size={13} />
                              <span>{bim.bimestre || 'Bimestre 1'}{bim.anio ? ` · ${bim.anio}` : ''}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="asig-definitiva-container">
                        {defVal !== null ? (
                          <div className={`asig-definitiva-pill ${defVal >= 3.5 ? 'def-aprobada' : defVal >= 3.0 ? 'def-riesgo' : 'def-reprobada'}`}>
                            <span className="def-label">Definitiva:</span>
                            <span className="def-valor">{defVal.toFixed(2)}</span>
                          </div>
                        ) : (
                          <div className="asig-definitiva-pill def-pendiente">
                            <span className="def-label">Definitiva:</span>
                            <span className="def-valor">Pendiente</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nivel 4: Indicadores de logro con Notas 1, 2, 3 y Promedio */}
                    <div className="asig-indicadores-list">
                      {(bim.indicadores || []).map((ind, i) => {
                        const numInd = ind.numero || (i + 1);
                        const promInd = ind.promedio !== null && ind.promedio !== undefined ? parseFloat(ind.promedio) : null;

                        return (
                          <div key={ind.indicador_id || i} className={`asig-indicador-item ind-num--${numInd}`}>
                            <div className="asig-indicador-info">
                              <div className="asig-ind-tag">
                                <span className="asig-ind-badge">Indicador {numInd}</span>
                              </div>
                              <p className="asig-ind-descripcion">{ind.descripcion || 'Sin descripción registrada'}</p>
                            </div>

                            <div className="asig-notas-grid">
                              {[1, 2, 3].map(numNota => {
                                const notaVal = ind[`nota_${numNota}`];
                                const tieneNota = notaVal !== null && notaVal !== undefined && notaVal !== '';
                                const notaNum = tieneNota ? parseFloat(notaVal) : null;

                                return (
                                  <div key={numNota} className="asig-nota-cell">
                                    <span className="asig-nota-label">Nota {numNota}</span>
                                    <span className={`asig-nota-valor ${notaNum !== null ? (notaNum >= 3.0 ? 'nota-aprobada' : 'nota-reprobada') : 'nota-vacia'}`}>
                                      {notaNum !== null ? notaNum.toFixed(2) : '—'}
                                    </span>
                                  </div>
                                );
                              })}

                              <div className="asig-nota-cell asig-nota-cell--promedio">
                                <span className="asig-nota-label">Promedio</span>
                                <span className={`asig-nota-valor asig-nota-valor--promedio ${promInd !== null ? (promInd >= 3.0 ? 'nota-aprobada' : 'nota-reprobada') : 'nota-vacia'}`}>
                                  {promInd !== null ? promInd.toFixed(2) : '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
