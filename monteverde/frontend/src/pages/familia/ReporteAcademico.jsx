import { useEffect, useState, useMemo } from 'react';
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
  Layers,
  Award
} from 'lucide-react';
import { 
  getFamiliaDashboard, 
  getCalificacionesBimestreFamilia, 
  getBimestres 
} from '../../services/api';


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

const _obtenerColorPromedio = (promedio) => {
  if (promedio === null || promedio === undefined || isNaN(promedio)) return 'var(--text-muted)';
  if (promedio >= 3.5) return 'var(--color-success)';
  if (promedio >= 3.0) return 'var(--color-warning)';
  return 'var(--color-error)';
};

export default function ReporteAcademico() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedHijoIndex, setSelectedHijoIndex] = useState(0);
  const [bimestreSeleccionado, setBimestreSeleccionado] = useState('todos');
  
  // Datos bimestrales completos (fuente principal)
  const [bimestreData, setBimestreData] = useState([]);
  const [bimestresCatalogo, setBimestresCatalogo] = useState([]);

  // Cargar calificaciones del estudiante seleccionado
  useEffect(() => {
    let montado = true;

    const cargarDatos = async () => {
      if (!usuario?.id) {
        if (montado) {
          setError('Usuario no disponible');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('📊 Cargando reporte académico para usuario familia:', usuario.id);
        
        // 1. Obtener datos del dashboard familiar (lista de hijos) y catálogo de bimestres en paralelo
        const [dashboard, listaBimestres] = await Promise.all([
          getFamiliaDashboard(usuario.id).catch(() => null),
          getBimestres().catch(() => [])
        ]);
        
        if (!montado) return;

        if (dashboard?.hijos && dashboard.hijos.length > 0) {
          setDashboardData(dashboard);
          setBimestresCatalogo(listaBimestres || []);

          const hijoActivo = dashboard.hijos[selectedHijoIndex] || dashboard.hijos[0];
          console.log('📊 Consultando calificaciones para hijo:', hijoActivo.nombre, '(ID:', hijoActivo.id, ')');

          // 2. Obtener calificaciones por bimestres e indicadores (fuente enriquecida)
          const dataBimestres = await getCalificacionesBimestreFamilia(hijoActivo.id).catch((err) => {
            console.warn('⚠️ No se pudieron obtener calificaciones de bimestre:', err);
            return [];
          });

          if (!montado) return;
          const datosValidos = Array.isArray(dataBimestres) ? dataBimestres : (dataBimestres?.data || []);
          setBimestreData(datosValidos);
        } else {
          setDashboardData(null);
          setBimestreData([]);
          setError('No se encontraron estudiantes asociados a esta cuenta familiar');
        }
      } catch (err) {
        console.error('❌ Error al cargar reporte académico:', err);
        if (montado) {
          setError('Error al cargar las calificaciones: ' + (err.message || 'Error de conexión'));
          setBimestreData([]);
        }
      } finally {
        if (montado) {
          setLoading(false);
        }
      }
    };

    cargarDatos();

    return () => {
      montado = false;
    };
  }, [usuario, selectedHijoIndex]);

  const hijoActivo = dashboardData?.hijos?.[selectedHijoIndex] || null;

  // Extraer bimestres disponibles en los datos
  const bimestresDisponibles = useMemo(() => {
    const nombres = new Set();
    bimestreData.forEach(item => {
      if (item.bimestre) nombres.add(item.bimestre);
    });

    if (nombres.size === 0 && bimestresCatalogo.length > 0) {
      bimestresCatalogo.forEach(b => nombres.add(b.nombre));
    }

    return Array.from(nombres).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [bimestreData, bimestresCatalogo]);

  // Filtrar asignaturas por bimestre seleccionado
  const asignaturasFiltradas = useMemo(() => {
    if (bimestreSeleccionado === 'todos') {
      return bimestreData;
    }
    return bimestreData.filter(item => {
      const bNombre = (item.bimestre || '').toLowerCase();
      const selNombre = bimestreSeleccionado.toLowerCase();
      return bNombre === selNombre || bNombre.includes(selNombre) || selNombre.includes(bNombre);
    });
  }, [bimestreData, bimestreSeleccionado]);

  // Estadísticas y métricas en tiempo real calculadas sobre los datos reales
  const metricas = useMemo(() => {
    const items = asignaturasFiltradas;
    if (!items || items.length === 0) {
      return {
        promedioGeneral: null,
        totalEvaluaciones: 0,
        asignaturasAprobadas: 0,
        asignaturasRiesgo: 0,
        totalAsignaturas: 0
      };
    }

    let sumaDefinitivas = 0;
    let conteoDefinitivas = 0;
    let aprobadas = 0;
    let enRiesgo = 0;
    let totalNotasIndividuales = 0;

    items.forEach(item => {
      const def = item.definitiva !== null && item.definitiva !== undefined ? parseFloat(item.definitiva) : null;
      if (def !== null && !isNaN(def)) {
        sumaDefinitivas += def;
        conteoDefinitivas += 1;
        if (def >= 3.5) {
          aprobadas += 1;
        } else if (def >= 3.0) {
          aprobadas += 1;
        } else {
          enRiesgo += 1;
        }
      }

      // Conteo de notas parciales
      (item.indicadores || []).forEach(ind => {
        if (ind.notas && typeof ind.notas === 'object') {
          Object.values(ind.notas).forEach(v => {
            if (v !== null && v !== undefined && v !== '' && !isNaN(parseFloat(v))) {
              totalNotasIndividuales += 1;
            }
          });
        } else {
          [ind.nota_1, ind.nota_2, ind.nota_3, ind.nota_4, ind.nota_5].forEach(v => {
            if (v !== null && v !== undefined && v !== '' && !isNaN(parseFloat(v))) {
              totalNotasIndividuales += 1;
            }
          });
        }
      });
    });

    const promedio = conteoDefinitivas > 0 ? (sumaDefinitivas / conteoDefinitivas).toFixed(2) : null;

    return {
      promedioGeneral: promedio,
      totalEvaluaciones: totalNotasIndividuales,
      asignaturasAprobadas: aprobadas,
      asignaturasRiesgo: enRiesgo,
      totalAsignaturas: items.length
    };
  }, [asignaturasFiltradas]);

  if (loading) {
    return (
      <div className="grid">
        <BarraTitulo titulo="Reporte Académico" subtitulo="Cargando información..." />
        <Card>
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
            <div style={{
              border: '4px solid var(--border)',
              borderTop: '4px solid var(--color-primary)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 0.9s linear infinite',
              margin: '0 auto 1.25rem'
            }}></div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>
              Cargando reporte académico...
            </p>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Consultando calificaciones por asignatura e indicadores de logro
            </span>
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

  if (error && (!dashboardData || !dashboardData.hijos || dashboardData.hijos.length === 0)) {
    return (
      <div className="grid">
        <BarraTitulo titulo="Reporte Académico" subtitulo="Error" />
        <Card>
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <AlertTriangle size={48} style={{ color: 'var(--color-error)', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--color-error)', fontSize: '1.1rem', fontWeight: 700 }}>{error}</p>
            <button 
              onClick={() => globalThis.location.reload()} 
              className="btn btn--primary"
              style={{ marginTop: '1.25rem' }}
            >
              Recargar página
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const tieneCalificaciones = bimestreData.length > 0;
  const promedioNum = metricas.promedioGeneral ? parseFloat(metricas.promedioGeneral) : null;

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      {/* Cabecera Principal */}
      <BarraTitulo 
        titulo="Reporte Académico" 
        subtitulo={hijoActivo ? `Calificaciones de ${hijoActivo.nombre}` : 'Información académica'}
        derecha={
          <div style={{ fontSize: '0.85rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
            {hijoActivo && (
              <>
                <div><strong>{hijoActivo.curso}</strong> - {hijoActivo.grado}</div>
                <div>
                  Promedio:{' '}
                  <strong style={{ color: _obtenerColorPromedio(promedioNum) }}>
                    {metricas.promedioGeneral ?? 'Pendiente'}
                  </strong>
                </div>
                <div>Total evaluaciones: <strong>{metricas.totalEvaluaciones}</strong></div>
              </>
            )}
          </div>
        }
      />

      {/* Selector de hijo cuando la familia tiene múltiples estudiantes vinculados */}
      {dashboardData?.hijos?.length > 1 && (
        <Card title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={20} style={{ color: 'var(--color-primary)' }} />
            <span>Seleccionar Estudiante</span>
          </span>
        }>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label htmlFor="student-select" style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '0.9rem' }}>
              Estudiante:
            </label>
            <select
              id="student-select"
              value={selectedHijoIndex}
              onChange={(e) => {
                setSelectedHijoIndex(Number.parseInt(e.target.value, 10));
              }}
              style={{
                minWidth: '240px',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1.5px solid var(--border)',
                fontWeight: 700,
                color: 'var(--text)'
              }}
            >
              {dashboardData.hijos.map((hijo, idx) => (
                <option key={hijo.id} value={idx}>
                  {hijo.nombre} ({hijo.curso} - {hijo.grado})
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {/* Panel Resumen Global / Boletín Digital */}
      {tieneCalificaciones && (
        <div className="boletin-resumen">
          <div className="boletin-stat">
            <span className="boletin-stat-val" style={{ color: _obtenerColorPromedio(promedioNum) }}>
              {metricas.promedioGeneral ?? '—'}
            </span>
            <span className="boletin-stat-lbl">Promedio General</span>
          </div>
          <div className="boletin-stat-div" />
          <div className="boletin-stat">
            <span className="boletin-stat-val" style={{ color: 'var(--color-success)' }}>
              {metricas.asignaturasAprobadas}
            </span>
            <span className="boletin-stat-lbl">Aprobadas</span>
          </div>
          <div className="boletin-stat-div" />
          <div className="boletin-stat">
            <span className="boletin-stat-val" style={{ color: metricas.asignaturasRiesgo > 0 ? 'var(--color-error)' : 'var(--text-muted)' }}>
              {metricas.asignaturasRiesgo}
            </span>
            <span className="boletin-stat-lbl">En Riesgo</span>
          </div>
          <div className="boletin-stat-div" />
          <div className="boletin-stat">
            <span className="boletin-stat-val" style={{ color: 'var(--brand)' }}>
              {metricas.totalEvaluaciones}
            </span>
            <span className="boletin-stat-lbl">Notas Registradas</span>
          </div>
        </div>
      )}

      {/* Selector de Bimestre — Tipo Pills */}
      {tieneCalificaciones && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="boletin-filtro">
            <button
              className={`boletin-pill ${bimestreSeleccionado === 'todos' ? 'boletin-pill--active' : ''}`}
              onClick={() => setBimestreSeleccionado('todos')}
            >
              Todos los Bimestres
            </button>
            {bimestresDisponibles.map(b => (
              <button
                key={b}
                className={`boletin-pill ${bimestreSeleccionado === b ? 'boletin-pill--active' : ''}`}
                onClick={() => setBimestreSeleccionado(b)}
              >
                {b}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Mostrando {asignaturasFiltradas.length} asignatura(s)
          </span>
        </div>
      )}

      {/* Tarjetas de Calificaciones por Asignatura e Indicadores de Logro */}
      {tieneCalificaciones ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {asignaturasFiltradas.map((bim, idx) => {
            const nombreAsignatura = bim.asignatura || bim.materia_nombre || bim.materia || 'Asignatura';
            const configAsig = _obtenerConfigAsignatura(nombreAsignatura);
            const IconoAsignatura = configAsig.icon;
            const defVal = bim.definitiva !== null && bim.definitiva !== undefined ? parseFloat(bim.definitiva) : null;
            const notaAprobatoria = bim.configuracion?.escala?.aprobacion ?? 3.0;

            return (
              <div 
                key={`${bim.materia_id || nombreAsignatura}-${bim.bimestre_id || bim.bimestre}-${idx}`} 
                className="asig-card"
                style={{
                  borderRadius: '16px',
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  overflow: 'hidden'
                }}
              >
                {/* Encabezado: Asignatura + Bimestre + Definitiva */}
                <div 
                  className="asig-card-header"
                  style={{
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border)',
                    background: 'linear-gradient(180deg, #ffffff, #fafafa)',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div className="asig-title-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span 
                      className="asig-icon-badge" 
                      style={{ 
                        color: configAsig.color, 
                        backgroundColor: configAsig.bg, 
                        borderColor: configAsig.border,
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px solid'
                      }}
                    >
                      <IconoAsignatura size={22} strokeWidth={2.2} />
                    </span>
                    <div className="asig-header-text">
                      <h3 className="asig-nombre" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                        {nombreAsignatura}
                      </h3>
                      <div className="asig-meta" style={{ marginTop: '3px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span 
                          className="asig-bimestre-badge" 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            color: 'var(--text-muted)',
                            background: 'var(--bg-light)',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          <Calendar size={12} />
                          <span>{bim.bimestre || 'Bimestre 1'}{bim.anio ? ` · ${bim.anio}` : ''}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="asig-definitiva-container">
                    {defVal !== null ? (
                      <div 
                        className={`asig-definitiva-pill ${defVal >= notaAprobatoria ? 'def-aprobada' : 'def-reprobada'}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '0.45rem 1rem',
                          borderRadius: '24px',
                          border: '1.5px solid',
                          fontSize: '0.9rem',
                          fontWeight: 800
                        }}
                      >
                        <Award size={16} />
                        <span className="def-label" style={{ fontWeight: 600 }}>Definitiva:</span>
                        <span className="def-valor" style={{ fontSize: '1.1rem' }}>{defVal.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div 
                        className="asig-definitiva-pill def-pendiente"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '0.45rem 1rem',
                          borderRadius: '24px',
                          border: '1.5px solid var(--border)',
                          background: 'var(--bg-light)',
                          color: 'var(--text-muted)',
                          fontSize: '0.85rem',
                          fontWeight: 700
                        }}
                      >
                        <Clock size={15} />
                        <span>Definitiva Pendiente</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lista de Indicadores de Logro con Notas y Promedio */}
                <div className="asig-indicadores-list">
                  {(bim.indicadores || []).map((ind, i) => {
                    const numInd = ind.numero || (i + 1);
                    const promInd = ind.promedio !== null && ind.promedio !== undefined ? parseFloat(ind.promedio) : null;
                    const notasCount = bim.configuracion?.notas_por_indicador || (ind.notas ? Object.keys(ind.notas).length : 3) || 3;
                    const listaNotas = Array.from({ length: notasCount }, (_, idx) => idx + 1);

                    return (
                      <div key={ind.indicador_id || i} className={`asig-indicador-item ind-num--${numInd}`}>
                        <div className="asig-indicador-info">
                          <div className="asig-ind-tag">
                            <span className="asig-ind-badge">Indicador {numInd}</span>
                          </div>
                          <p className="asig-ind-descripcion">{ind.descripcion || 'Sin descripción registrada'}</p>
                        </div>

                        <div className="asig-notas-grid">
                          {listaNotas.map(numNota => {
                            const notaVal = ind.notas ? ind.notas[numNota] : ind[`nota_${numNota}`];
                            const tieneNota = notaVal !== null && notaVal !== undefined && notaVal !== '';
                            const notaNum = tieneNota ? parseFloat(notaVal) : null;

                            return (
                              <div key={numNota} className="asig-nota-cell">
                                <span className="asig-nota-label">Nota {numNota}</span>
                                <span className={`asig-nota-valor ${notaNum !== null ? (notaNum >= notaAprobatoria ? 'nota-aprobada' : 'nota-reprobada') : 'nota-vacia'}`}>
                                  {notaNum !== null ? notaNum.toFixed(2) : '—'}
                                </span>
                              </div>
                            );
                          })}

                          <div className="asig-nota-cell asig-nota-cell--promedio">
                            <span className="asig-nota-label">Promedio</span>
                            <span className={`asig-nota-valor asig-nota-valor--promedio ${promInd !== null ? (promInd >= notaAprobatoria ? 'nota-aprobada' : 'nota-reprobada') : 'nota-vacia'}`}>
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
      ) : (
        /* Estado vacío cuando realmente no hay calificaciones registradas */
        <Card>
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--bg-light)',
              color: 'var(--text-muted)',
              marginBottom: '1.25rem'
            }}>
              <BarChart3 size={36} strokeWidth={1.5} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>
              No hay calificaciones registradas
            </h3>
            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Aún no se han registrado calificaciones para {hijoActivo?.nombre || 'este estudiante'}.
            </p>
            <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Las calificaciones aparecerán aquí automáticamente una vez que los docentes las ingresen en el sistema.
            </small>
          </div>
        </Card>
      )}
    </div>
  );
}
