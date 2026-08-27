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
  ClipboardList
} from 'lucide-react';
import {
  getMyCoursesAndSubjects,
  getBimestres,
  getIndicadoresBimestre,
  guardarIndicadoresBimestre,
  getMatrizCalificaciones,
  guardarMatrizCalificaciones,
} from '../../services/api';

// ─── Helpers ──────────────────────────────────────────────────────

const _calcularPromedio = (n1, n2, n3) => {
  const vals = [n1, n2, n3].filter(v => v !== null && v !== undefined && v !== '' && !isNaN(parseFloat(v)));
  if (!vals.length) return null;
  return Math.round(vals.reduce((s, v) => s + parseFloat(v), 0) / vals.length * 100) / 100;
};

const _calcularDefinitiva = (indicadores) => {
  const proms = indicadores.map(i => i.promedio).filter(p => p !== null && p !== undefined);
  if (!proms.length) return null;
  return Math.round(proms.reduce((s, p) => s + p, 0) / proms.length * 100) / 100;
};

const _actualizarNota = (estudiantes, estId, indId, numNota, valor) => {
  return estudiantes.map(est => {
    if (est.estudiante_id !== estId) return est;
    const nuevosInd = est.indicadores.map(ind => {
      if (ind.indicador_id !== indId) return ind;
      const key = `nota_${numNota}`;
      const updated = { ...ind, [key]: valor === '' ? null : valor };
      updated.promedio = _calcularPromedio(updated.nota_1, updated.nota_2, updated.nota_3);
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

function FiltrosCalificaciones({ cursos, asignaturas, bimestres, valores, onChange, loading }) {
  return (
    <BlurFade delay={0.08} duration={0.35}>
      <Card title="Selección">
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
            etiqueta="Bimestre"
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

// ─── Estadísticas del bimestre ────────────────────────────────────

function EstadisticasBimestre({ estudiantes }) {
  if (!estudiantes?.length) return null;

  const total = estudiantes.length;
  const conDefinitiva = estudiantes.filter(e => e.definitiva !== null).length;
  const aprobados = estudiantes.filter(e => e.definitiva !== null && e.definitiva >= 3.0).length;
  const promedioGeneral = conDefinitiva > 0
    ? (estudiantes.filter(e => e.definitiva !== null).reduce((s, e) => s + e.definitiva, 0) / conDefinitiva).toFixed(2)
    : null;

  const stats = [
    { label: 'Estudiantes', valor: total, color: 'var(--brand)' },
    { label: 'Con definitiva', valor: conDefinitiva, color: '#0ea5e9' },
    { label: 'Aprobados', valor: aprobados, color: '#16a34a' },
    { label: 'Promedio grupo', valor: promedioGeneral ?? '—', color: promedioGeneral >= 3 ? '#16a34a' : '#dc2626' },
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

  // ── Selección activa ──
  const [filtros, setFiltros] = useState({ cursoId: '', materiaId: '', bimestreId: '' });
  const [asignaturas, setAsignaturas] = useState([]);

  // ── Datos del bimestre ──
  const [indicadores, setIndicadores] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);   // con notas calculadas localmente

  // ── Estado UI ──
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingMatriz, setLoadingMatriz] = useState(false);
  const [guardandoIndicadores, setGuardandoIndicadores] = useState(false);
  const [saveStatus, setSaveStatus] = useState(SAVE_STATUS.IDLE);
  const [saveMensaje, setSaveMensaje] = useState('');
  const [celdasModificadas, setCeldasModificadas] = useState(0);

  // Timer para autosave (debounce)
  const saveTimerRef = useRef(null);
  const notasPendientesRef = useRef([]);   // buffer de cambios para guardar en lote

  // ── Selección derivada ──
  const cursoActual    = cursos.find(c => c.id.toString() === filtros.cursoId);
  const asignaturaActual = asignaturas.find(a => a.materia_id.toString() === filtros.materiaId);
  const bimestreActual = bimestres.find(b => b.id.toString() === filtros.bimestreId);
  const indicadoresListos = indicadores.length === 2;
  const tieneNotas = estudiantes.some(e => e.indicadores?.some(i =>
    [i.nota_1, i.nota_2, i.nota_3].some(n => n !== null)
  ));

  // ── 1. Cargar datos maestros al montar ───────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoadingInicial(true);
      try {
        const [academica, bims] = await Promise.all([
          getMyCoursesAndSubjects(),
          getBimestres(),
        ]);

        setAsignacionAcademica(academica || []);

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

        // Seleccionar primeros valores por defecto
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
        setIndicadores(indsData || []);
        setEstudiantes(matrizData?.estudiantes || []);
      } catch (err) {
        console.error('Error cargando datos de bimestre:', err);
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

  // ── Guardar indicadores ───────────────────────────────────────────
  const handleGuardarIndicadores = useCallback(async ({ ind1, ind2 }) => {
    setGuardandoIndicadores(true);
    try {
      const result = await guardarIndicadoresBimestre({
        cursoId: parseInt(filtros.cursoId),
        materiaId: parseInt(filtros.materiaId),
        bimestreId: parseInt(filtros.bimestreId),
        indicadores: [
          { numero: 1, descripcion: ind1 },
          { numero: 2, descripcion: ind2 },
        ],
      });
      setIndicadores(result || []);
      // Recargar matriz para reflejar posibles cambios
      const matrizData = await getMatrizCalificaciones({
        cursoId: parseInt(filtros.cursoId),
        materiaId: parseInt(filtros.materiaId),
        bimestreId: parseInt(filtros.bimestreId),
      });
      setEstudiantes(matrizData?.estudiantes || []);
      setCeldasModificadas(0);
    } finally {
      setGuardandoIndicadores(false);
    }
  }, [filtros]);

  // ── Cambio de nota ────────────────────────────────────────────────
  const handleNotaChange = useCallback((estId, indId, numNota, valor) => {
    // Actualizar estado local con cálculos de promedio automático
    setEstudiantes(prev => _actualizarNota(prev, estId, indId, numNota, valor));

    // Acumular en buffer de pendientes
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
  }, []); // eslint-disable-line

  // ── Guardar notas en lote ─────────────────────────────────────────
  const handleGuardar = useCallback(async () => {
    const pendientes = notasPendientesRef.current.filter(
      n => n.nota !== '' && n.nota !== null && !isNaN(parseFloat(n.nota)) &&
           parseFloat(n.nota) >= 0 && parseFloat(n.nota) <= 5
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
      // Volver a idle después de 3 s
      setTimeout(() => setSaveStatus(SAVE_STATUS.IDLE), 3000);
    } catch (err) {
      console.error('Error guardando notas:', err);
      setSaveStatus(SAVE_STATUS.ERROR);
      setSaveMensaje(err.message || 'No se pudieron guardar las notas.');
    }
  }, []);

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

  return (
    <div className="reg-cal-wrapper">
      {/* Título */}
      <BlurFade delay={0.04} duration={0.3}>
        <BarraTitulo
          titulo="Registro de Calificaciones"
          subtitulo="Evaluación por indicadores de logro y bimestres"
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
      />

      {/* Panel de indicadores */}
      {filtros.cursoId && filtros.materiaId && filtros.bimestreId && (
        <BlurFade delay={0.12} duration={0.35}>
          <Card>
            <PanelIndicadores
              indicadores={indicadores}
              onGuardar={handleGuardarIndicadores}
              guardando={guardandoIndicadores}
              tieneNotas={tieneNotas}
            />
          </Card>
        </BlurFade>
      )}

      {/* Estadísticas */}
      {indicadoresListos && !loadingMatriz && <EstadisticasBimestre estudiantes={estudiantes} />}

      {/* Aviso si no hay indicadores */}
      {filtros.cursoId && filtros.materiaId && filtros.bimestreId && !indicadoresListos && !loadingMatriz && (
        <BlurFade delay={0.18} duration={0.3}>
          <div className="aviso-indicadores">
            <ClipboardList size={22} className="aviso-icon" />
            <div>
              <strong>Define los indicadores primero</strong>
              <p>Debes configurar los 2 indicadores de logro del bimestre antes de ingresar notas.</p>
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
              onNotaChange={handleNotaChange}
              loading={loadingMatriz}
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
