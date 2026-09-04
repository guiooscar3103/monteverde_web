import { useState, useEffect, useCallback, useRef } from 'react';
import BlurFade from '../../components/BlurFade';
import Card from '../../components/Card';
import BarraTitulo from '../../components/BarraTitulo';
import SelectSimple from '../../components/SelectSimple';
import PanelIndicadores from '../../components/PanelIndicadores';
import MatrizCalificaciones from '../../components/MatrizCalificaciones';
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  Lock
} from 'lucide-react';
import {
  getMyCoursesAndSubjects,
  getBimestres,
  getIndicadoresBimestre,
  guardarIndicadoresBimestre,
  getMatrizCalificaciones,
  guardarMatrizCalificaciones,
  getConfiguracionEvaluacionActiva
} from '../../services/api';

// ─── Helpers Dinámicos ─────────────────────────────────────────────

const _calcularPromedio = (notasArray) => {
  const vals = (notasArray || []).filter(v => v !== null && v !== undefined && v !== '' && !isNaN(parseFloat(v)));
  if (!vals.length) return null;
  return Math.round((vals.reduce((s, v) => s + parseFloat(v), 0) / vals.length) * 100) / 100;
};

const _calcularDefinitiva = (indicadores) => {
  const proms = (indicadores || []).map(i => i.promedio).filter(p => p !== null && p !== undefined && !isNaN(p));
  if (!proms.length) return null;
  return Math.round((proms.reduce((s, p) => s + p, 0) / proms.length) * 100) / 100;
};

const _actualizarNota = (estudiantes, estId, indId, numNota, valor, notasPorInd = 3) => {
  return estudiantes.map(est => {
    if (est.estudiante_id !== estId) return est;
    const nuevosInd = (est.indicadores || []).map(ind => {
      if (ind.indicador_id !== indId) return ind;
      const key = `nota_${numNota}`;
      const nuevoNotasMap = { ...(ind.notas || {}), [numNota]: valor === '' ? null : valor };
      const updated = { ...ind, [key]: valor === '' ? null : valor, notas: nuevoNotasMap };

      const listaValores = Array.from({ length: notasPorInd }, (_, i) => i + 1).map(n =>
        nuevoNotasMap[n] !== undefined ? nuevoNotasMap[n] : updated[`nota_${n}`]
      );
      updated.promedio = _calcularPromedio(listaValores);
      return updated;
    });
    return { ...est, indicadores: nuevosInd, definitiva: _calcularDefinitiva(nuevosInd) };
  });
};

// ─── Estado de guardado ───────────────────────────────────────────

const SAVE_STATUS = {
  IDLE: 'idle',
  SAVING: 'saving',
  OK: 'ok',
  ERROR: 'error',
};

function BarraGuardado({ status, mensaje, onGuardar, celdasModificadas }) {
  const colorMap = {
    [SAVE_STATUS.IDLE]: '#64748b',
    [SAVE_STATUS.SAVING]: '#0ea5e9',
    [SAVE_STATUS.OK]: '#16a34a',
    [SAVE_STATUS.ERROR]: '#dc2626',
  };
  const iconMap = {
    [SAVE_STATUS.IDLE]: <Save size={16} />,
    [SAVE_STATUS.SAVING]: <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />,
    [SAVE_STATUS.OK]: <CheckCircle2 size={16} />,
    [SAVE_STATUS.ERROR]: <AlertCircle size={16} />,
  };
  const labelMap = {
    [SAVE_STATUS.IDLE]: celdasModificadas > 0 ? `${celdasModificadas} cambio(s) sin guardar` : 'Sin cambios',
    [SAVE_STATUS.SAVING]: 'Guardando...',
    [SAVE_STATUS.OK]: 'Guardado correctamente',
    [SAVE_STATUS.ERROR]: mensaje || 'Error al guardar',
  };

  return (
    <div className="barra-guardado" style={{ borderTopColor: colorMap[status] }}>
      <div className="bg-estado" style={{ color: colorMap[status], display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>{iconMap[status]}</span>
        <span>{labelMap[status]}</span>
      </div>
      <button
        className="btn-guardar-matriz"
        onClick={onGuardar}
        disabled={status === SAVE_STATUS.SAVING || celdasModificadas === 0}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        <Save size={15} />
        <span>{status === SAVE_STATUS.SAVING ? 'Guardando...' : 'Guardar calificaciones'}</span>
      </button>
    </div>
  );
}

// ─── Filtros de selección ─────────────────────────────────────────

function FiltrosCalificaciones({ cursos, asignaturas, bimestres, valores, onChange, loading, tipoPeriodo = 'Periodo' }) {
  return (
    <BlurFade delay={0.08} duration={0.35}>
      <Card title="Selección Académica">
        <div className="filtros-cal-grid">
          <SelectSimple
            etiqueta="Curso / Grupo"
            value={valores.cursoId}
            onChange={v => onChange('cursoId', v)}
            options={cursos.map(c => ({ value: c.id.toString(), label: c.nombre }))}
          />
          <SelectSimple
            etiqueta="Asignatura"
            value={valores.materiaId}
            onChange={v => onChange('materiaId', v)}
            options={asignaturas.map(a => ({ value: a.materia_id.toString(), label: a.materia_nombre }))}
          />
          <SelectSimple
            etiqueta={tipoPeriodo}
            value={valores.bimestreId}
            onChange={v => onChange('bimestreId', v)}
            options={bimestres.map(b => ({ value: b.id.toString(), label: b.nombre }))}
          />
        </div>
        {loading && (
          <div className="filtros-loading">
            <div className="mini-spinner" />
            <span>Cargando...</span>
          </div>
        )}
      </Card>
    </BlurFade>
  );
}

// ─── Estadísticas del periodo ─────────────────────────────────────

function EstadisticasPeriodo({ estudiantes, configuracion }) {
  if (!estudiantes?.length) return null;

  const notaAprobatoria = configuracion?.escala?.aprobacion ?? 3.0;
  const escalaMax = configuracion?.escala?.max ?? 5.0;
  const total = estudiantes.length;
  const conDefinitiva = estudiantes.filter(e => e.definitiva !== null && !isNaN(e.definitiva)).length;
  const aprobados = estudiantes.filter(e => e.definitiva !== null && !isNaN(e.definitiva) && e.definitiva >= notaAprobatoria).length;
  const promedioGeneral = conDefinitiva > 0
    ? (estudiantes.filter(e => e.definitiva !== null && !isNaN(e.definitiva)).reduce((s, e) => s + e.definitiva, 0) / conDefinitiva).toFixed(escalaMax > 10 ? 1 : 2)
    : null;

  const stats = [
    { label: 'Estudiantes', valor: total, color: 'var(--brand)' },
    { label: 'Con definitiva', valor: conDefinitiva, color: '#0ea5e9' },
    { label: 'Aprobados', valor: aprobados, color: '#16a34a' },
    { label: 'Promedio grupo', valor: promedioGeneral ?? '—', color: (promedioGeneral !== null && parseFloat(promedioGeneral) >= notaAprobatoria) ? '#16a34a' : '#dc2626' },
  ];

  return (
    <BlurFade delay={0.14} duration={0.35}>
      <div className="stats-bimestre">
        {stats.map(s => (
          <div key={s.label} className="stat-item">
            <span className="stat-valor" style={{ color: s.color }}>{s.valor}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </BlurFade>
  );
}

// ─── Componente principal ─────────────────────────────────────────

export default function RegistroCalificaciones() {
  // ── Datos maestros ──
  const [asignacionAcademica, setAsignacionAcademica] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [bimestres, setBimestres] = useState([]);
  const [configuracion, setConfiguracion] = useState(null);

  // ── Selección activa ──
  const [filtros, setFiltros] = useState({ cursoId: '', materiaId: '', bimestreId: '' });
  const [asignaturas, setAsignaturas] = useState([]);

  // ── Datos del periodo ──
  const [indicadores, setIndicadores] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);

  // ── Estado UI ──
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingMatriz, setLoadingMatriz] = useState(false);
  const [guardandoIndicadores, setGuardandoIndicadores] = useState(false);
  const [saveStatus, setSaveStatus] = useState(SAVE_STATUS.IDLE);
  const [saveMensaje, setSaveMensaje] = useState('');
  const [celdasModificadas, setCeldasModificadas] = useState(0);

  // Timer para autosave (debounce)
  const saveTimerRef = useRef(null);
  const notasPendientesRef = useRef([]);

  // ── Selección derivada ──
  const cursoActual = cursos.find(c => c.id.toString() === filtros.cursoId);
  const asignaturaActual = asignaturas.find(a => a.materia_id.toString() === filtros.materiaId);
  const bimestreActual = bimestres.find(b => b.id.toString() === filtros.bimestreId);
  const periodoBloqueado = Boolean(bimestreActual && bimestreActual.permite_calificaciones === false);

  const numIndicadoresRequeridos = configuracion?.indicadores_por_periodo || 2;
  const indicadoresListos = (indicadores || []).length === numIndicadoresRequeridos;

  const tieneNotas = estudiantes.some(e =>
    (e.indicadores || []).some(i => {
      if (i.notas) {
        return Object.values(i.notas).some(n => n !== null && n !== undefined && n !== '');
      }
      return Object.keys(i).some(k => k.startsWith('nota_') && i[k] !== null && i[k] !== undefined && i[k] !== '');
    })
  );

  // ── 1. Cargar datos maestros al montar ───────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoadingInicial(true);
      try {
        const [academica, bims, configActiva] = await Promise.all([
          getMyCoursesAndSubjects(),
          getBimestres(),
          getConfiguracionEvaluacionActiva().catch(() => null)
        ]);

        setAsignacionAcademica(academica || []);
        if (configActiva?.estructura) {
          setConfiguracion(configActiva.estructura);
        } else if (configActiva) {
          setConfiguracion(configActiva);
        }

        const cursosUnicos = [];
        const seen = new Set();
        (academica || []).forEach(item => {
          if (!seen.has(item.curso_id)) {
            seen.add(item.curso_id);
            cursosUnicos.push({ id: item.curso_id, nombre: item.curso_nombre });
          }
        });
        setCursos(cursosUnicos);
        setBimestres(bims || []);

        if (cursosUnicos.length > 0) {
          setFiltros(prev => ({ ...prev, cursoId: cursosUnicos[0].id.toString() }));
        }
        if (bims?.length > 0) {
          setFiltros(prev => ({ ...prev, bimestreId: bims[0].id.toString() }));
        }
      } catch (err) {
        console.error('Error inicializando RegistroCalificaciones:', err);
      } finally {
        setLoadingInicial(false);
      }
    };
    init();
  }, []);

  // ── 2. Actualizar asignaturas cuando cambia el curso ─────────────
  useEffect(() => {
    if (!filtros.cursoId || !asignacionAcademica.length) return;
    const cursoData = asignacionAcademica.find(c => c.curso_id.toString() === filtros.cursoId);
    const mats = cursoData?.materias || [];
    setAsignaturas(mats);
    if (mats.length > 0) {
      setFiltros(prev => ({ ...prev, materiaId: mats[0].materia_id.toString() }));
    } else {
      setFiltros(prev => ({ ...prev, materiaId: '' }));
    }
  }, [filtros.cursoId, asignacionAcademica]);

  // ── 3. Cargar indicadores y matriz cuando cambian los filtros ─────
  useEffect(() => {
    const { cursoId, materiaId, bimestreId } = filtros;
    if (!cursoId || !materiaId || !bimestreId) return;

    const cargar = async () => {
      setLoadingMatriz(true);
      setCeldasModificadas(0);
      notasPendientesRef.current = [];
      try {
        const [indsData, matrizData] = await Promise.all([
          getIndicadoresBimestre({ cursoId: parseInt(cursoId), materiaId: parseInt(materiaId), bimestreId: parseInt(bimestreId) }),
          getMatrizCalificaciones({ cursoId: parseInt(cursoId), materiaId: parseInt(materiaId), bimestreId: parseInt(bimestreId) }),
        ]);

        if (matrizData?.configuracion) {
          setConfiguracion(matrizData.configuracion);
        }

        setIndicadores(indsData?.data || indsData || []);
        setEstudiantes(matrizData?.estudiantes || []);
      } catch (err) {
        console.error('Error cargando datos de periodo:', err);
        setIndicadores([]);
        setEstudiantes([]);
      } finally {
        setLoadingMatriz(false);
      }
    };
    cargar();
  }, [filtros.cursoId, filtros.materiaId, filtros.bimestreId]);

  // ── Cambio de filtros ──────────────────────────────────────────────
  const handleFiltroChange = useCallback((campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  }, []);

  // ── Guardar indicadores dinámicos ─────────────────────────────────
  const handleGuardarIndicadores = useCallback(async ({ indicadores: payloadInds, ind1, ind2 }) => {
    setGuardandoIndicadores(true);
    try {
      const indicadoresAEnviar = payloadInds || [
        { numero: 1, descripcion: ind1 },
        { numero: 2, descripcion: ind2 },
      ];

      const result = await guardarIndicadoresBimestre({
        cursoId: parseInt(filtros.cursoId),
        materiaId: parseInt(filtros.materiaId),
        bimestreId: parseInt(filtros.bimestreId),
        indicadores: indicadoresAEnviar,
      });

      setIndicadores(result || []);
      // Recargar matriz
      const matrizData = await getMatrizCalificaciones({
        cursoId: parseInt(filtros.cursoId),
        materiaId: parseInt(filtros.materiaId),
        bimestreId: parseInt(filtros.bimestreId),
      });
      if (matrizData?.configuracion) {
        setConfiguracion(matrizData.configuracion);
      }
      setEstudiantes(matrizData?.estudiantes || []);
      setCeldasModificadas(0);
    } finally {
      setGuardandoIndicadores(false);
    }
  }, [filtros]);

  // ── Cambio de nota dinámico ───────────────────────────────────────
  const handleNotaChange = useCallback((estId, indId, numNota, valor) => {
    if (periodoBloqueado) return;

    const notasPorInd = configuracion?.notas_por_indicador || 3;
    setEstudiantes(prev => _actualizarNota(prev, estId, indId, numNota, valor, notasPorInd));

    const key = `${estId}-${indId}-${numNota}`;
    const idx = notasPendientesRef.current.findIndex(n => n.key === key);
    const entry = { key, estudianteId: estId, indicadorId: indId, numeroNota: numNota, nota: valor };
    if (idx >= 0) {
      notasPendientesRef.current[idx] = entry;
    } else {
      notasPendientesRef.current.push(entry);
    }

    setCeldasModificadas(notasPendientesRef.current.length);

    // Auto-save con debounce de 2 s
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus(SAVE_STATUS.IDLE);
    saveTimerRef.current = setTimeout(() => {
      handleGuardar();
    }, 2000);
  }, [configuracion]); // eslint-disable-line

  // ── Guardar notas en lote ─────────────────────────────────────────
  const handleGuardar = useCallback(async () => {
    const minEscala = configuracion?.escala?.min ?? 1.0;
    const maxEscala = configuracion?.escala?.max ?? 5.0;

    const pendientes = notasPendientesRef.current.filter(
      n => n.nota !== '' && n.nota !== null && !isNaN(parseFloat(n.nota)) &&
           parseFloat(n.nota) >= minEscala && parseFloat(n.nota) <= maxEscala
    );
    if (!pendientes.length) return;

    setSaveStatus(SAVE_STATUS.SAVING);
    setSaveMensaje('');
    try {
      await guardarMatrizCalificaciones(
        pendientes.map(n => ({
          estudianteId: n.estudianteId,
          indicadorId: n.indicadorId,
          numeroNota: n.numeroNota,
          nota: parseFloat(n.nota),
        }))
      );
      notasPendientesRef.current = [];
      setCeldasModificadas(0);
      setSaveStatus(SAVE_STATUS.OK);
      setTimeout(() => setSaveStatus(SAVE_STATUS.IDLE), 3000);
    } catch (err) {
      console.error('Error guardando notas:', err);
      setSaveStatus(SAVE_STATUS.ERROR);
      setSaveMensaje(err.message || 'No se pudieron guardar las notas.');
    }
  }, [configuracion]);

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────

  if (loadingInicial) {
    return (
      <div className="reg-cal-loading">
        <div className="spinner-ring spinner-ring--lg" />
        <p>Cargando módulo de calificaciones...</p>
      </div>
    );
  }

  const tipoPeriodoLabel = configuracion?.tipo_periodo || 'Período';

  return (
    <div className="reg-cal-wrapper">
      {/* Título */}
      <BlurFade delay={0.04} duration={0.3}>
        <BarraTitulo
          titulo="Registro de Calificaciones"
          subtitulo="Evaluación académica por indicadores de logro y periodos configurables"
          derecha={
            cursoActual && asignaturaActual && bimestreActual ? (
              <div className="titulo-derecha">
                <strong>{cursoActual.nombre}</strong>
                <span>{asignaturaActual.materia_nombre}</span>
                <span className="badge-bimestre">{bimestreActual.nombre}</span>
              </div>
            ) : null
          }
        />
      </BlurFade>

      {/* Filtros */}
      <FiltrosCalificaciones
        cursos={cursos}
        asignaturas={asignaturas}
        bimestres={bimestres}
        valores={filtros}
        onChange={handleFiltroChange}
        loading={loadingMatriz}
        tipoPeriodo={tipoPeriodoLabel}
      />

      {/* Panel de indicadores */}
      {filtros.cursoId && filtros.materiaId && filtros.bimestreId && (
        <BlurFade delay={0.12} duration={0.35}>
          <Card>
            <PanelIndicadores
              indicadores={indicadores}
              cantidadIndicadores={numIndicadoresRequeridos}
              onGuardar={handleGuardarIndicadores}
              guardando={guardandoIndicadores}
              tieneNotas={tieneNotas}
            />
          </Card>
        </BlurFade>
      )}

      {/* Estadísticas */}
      {indicadoresListos && !loadingMatriz && (
        <EstadisticasPeriodo estudiantes={estudiantes} configuracion={configuracion} />
      )}

      {/* Aviso si no hay indicadores */}
      {filtros.cursoId && filtros.materiaId && filtros.bimestreId && !indicadoresListos && !loadingMatriz && (
        <BlurFade delay={0.18} duration={0.3}>
          <div className="aviso-indicadores">
            <ClipboardList size={22} className="aviso-icon" />
            <div>
              <strong>Define los indicadores primero</strong>
              <p>Debes configurar los {numIndicadoresRequeridos} indicadores de logro del {tipoPeriodoLabel.toLowerCase()} antes de ingresar notas.</p>
            </div>
          </div>
        </BlurFade>
      )}

      {/* Aviso de Periodo Cerrado para Calificaciones */}
      {periodoBloqueado && (
        <BlurFade delay={0.15} duration={0.3}>
          <div style={{
            backgroundColor: '#fff1f2',
            border: '1px solid #fecdd3',
            color: '#9f1239',
            padding: '1.25rem 1.5rem',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{
              backgroundColor: '#ffe4e6',
              padding: '10px',
              borderRadius: '10px',
              color: '#e11d48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock size={24} />
            </div>
            <div>
              <strong style={{ fontSize: '1rem', display: 'block', color: '#881337' }}>
                Periodo Cerrado para Ingreso de Calificaciones
              </strong>
              <p style={{ margin: '3px 0 0', fontSize: '0.86rem', color: '#be123c', lineHeight: '1.4' }}>
                {bimestreActual?.estado === 'CERRADO'
                  ? 'La Coordinación Académica ha cerrado este periodo de evaluación.'
                  : `El plazo límite para ingreso de notas en este periodo finalizó el ${bimestreActual?.fecha_cierre_calificaciones || 'plazo establecido'}.`}
                {' '}Las notas de este bimestre se encuentran protegidas en modo solo lectura.
              </p>
            </div>
          </div>
        </BlurFade>
      )}

      {/* Matriz de calificaciones */}
      {indicadoresListos && (
        <BlurFade delay={0.2} duration={0.4}>
          <Card title={`Matriz de calificaciones — ${bimestreActual?.nombre || ''}`}>
            <MatrizCalificaciones
              estudiantes={estudiantes}
              configuracion={configuracion}
              onNotaChange={handleNotaChange}
              loading={loadingMatriz}
              disabled={periodoBloqueado}
            />
          </Card>
        </BlurFade>
      )}

      {/* Barra de guardado */}
      {indicadoresListos && estudiantes.length > 0 && (
        <BarraGuardado
          status={saveStatus}
          mensaje={saveMensaje}
          onGuardar={handleGuardar}
          celdasModificadas={celdasModificadas}
        />
      )}
    </div>
  );
}
