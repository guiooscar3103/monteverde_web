import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Calendar,
  Phone,
  Save,
  Database,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  GraduationCap,
  Sliders,
  Sparkles,
  Layers,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import {
  getConfiguracion,
  guardarConfiguracion,
  getConfiguracionesEvaluacion,
  getConfiguracionEvaluacionPorAnio,
  guardarConfiguracionEvaluacion,
  verificarCompatibilidadEvaluacion
} from '../../services/api';

const _extraerConfiguracionDelResponse = (res) => {
  if (res?.data) return res.data;
  if (res) return res;
  return {};
};

export default function Configuracion() {
  const [tabActiva, setTabActiva] = useState('evaluacion'); // 'evaluacion' | 'institucional'

  // ── Configuración Institucional ──
  const [configInst, setConfigInst] = useState({
    nombre_institucion: '',
    director: '',
    anio_escolar: '2026',
    periodo_actual: 'Primer Trimestre',
    direccion: '',
    telefono: '',
    email_contacto: '',
    updated_at: null,
    institucion_id: 'MONTEVERDE_DEFAULT'
  });

  // ── Configuración de Evaluación ──
  const [listaConfigsEval, setListaConfigsEval] = useState([]);
  const [anioEvalSeleccionado, setAnioEvalSeleccionado] = useState(2026);
  const [anioInput, setAnioInput] = useState('2026');
  const [configEval, setConfigEval] = useState({
    anio_academico: 2026,
    nombre: 'Configuración Académica 2026',
    tipo_periodo: 'Bimestre',
    numero_periodos: 4,
    indicadores_por_periodo: 2,
    notas_por_indicador: 3,
    tipo_escala: 'NUMERICA_CINCO',
    escala_minima: 1.0,
    escala_maxima: 5.0,
    nota_aprobatoria: 3.0,
    activa: true
  });

  // ── Estados UI ──
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [compatibilidadInfo, setCompatibilidadInfo] = useState(null);

  useEffect(() => {
    cargarTodosLosDatos();
  }, []);

  const cargarTodosLosDatos = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const [resInst, resEvalList] = await Promise.all([
        getConfiguracion().catch(() => null),
        getConfiguracionesEvaluacion().catch(() => [])
      ]);

      const datosInst = _extraerConfiguracionDelResponse(resInst);
      if (datosInst && Object.keys(datosInst).length > 0) {
        setConfigInst(prev => ({ ...prev, ...datosInst }));
      }

      const anioActivo = datosInst?.anio_escolar && !isNaN(parseInt(datosInst.anio_escolar))
        ? parseInt(datosInst.anio_escolar)
        : 2026;

      setAnioEvalSeleccionado(anioActivo);
      setAnioInput(String(anioActivo));

      const lista = Array.isArray(resEvalList) ? resEvalList : (resEvalList?.data || []);
      setListaConfigsEval(lista);

      const configActual = lista.find(c => c.anio_academico === anioActivo) || lista[0];
      if (configActual) {
        setConfigEval(configActual);
        setAnioEvalSeleccionado(configActual.anio_academico);
        setAnioInput(String(configActual.anio_academico));
      } else {
        // Cargar por año o inicializar
        const configAnio = await getConfiguracionEvaluacionPorAnio(anioActivo).catch(() => null);
        if (configAnio) {
          const configData = configAnio.data || configAnio;
          if (configData && configData.anio_academico) {
            setConfigEval(configData);
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      setErrorMsg(error.message || 'Error al cargar configuraciones del sistema.');
    } finally {
      setCargando(false);
    }
  };

  const cambiarAnioEvaluacion = async (nuevoAnio) => {
    const anioNum = parseInt(nuevoAnio);
    if (isNaN(anioNum) || anioNum < 1900 || anioNum > 2100) {
      return;
    }
    setAnioEvalSeleccionado(anioNum);
    setAnioInput(String(anioNum));
    setErrorMsg('');
    setSuccessMsg('');
    setCompatibilidadInfo(null);

    const encontrada = listaConfigsEval.find(c => c.anio_academico === anioNum);
    if (encontrada) {
      setConfigEval(encontrada);
    } else {
      try {
        const res = await getConfiguracionEvaluacionPorAnio(anioNum);
        const configData = res?.data || res;
        if (configData && configData.anio_academico) {
          setConfigEval(configData);
        } else {
          throw new Error('No existe en BD');
        }
      } catch {
        // Inicializar borrador nuevo para ese año (sin persistir en base de datos)
        setConfigEval({
          anio_academico: anioNum,
          nombre: `Configuración Académica ${anioNum}`,
          tipo_periodo: 'Bimestre',
          numero_periodos: 4,
          indicadores_por_periodo: 2,
          notas_por_indicador: 3,
          tipo_escala: 'NUMERICA_CINCO',
          escala_minima: 1.0,
          escala_maxima: 5.0,
          nota_aprobatoria: 3.0,
          activa: true
        });
      }
    }
  };

  const handleAnioInputChange = (e) => {
    const valor = e.target.value;
    setAnioInput(valor);
    const parsed = parseInt(valor);
    if (valor.length === 4 && !isNaN(parsed) && parsed >= 1900 && parsed <= 2100) {
      cambiarAnioEvaluacion(parsed);
    }
  };

  // Manejo de cambio en Tipo de Escala
  const handleTipoEscalaChange = (e) => {
    const tipo = e.target.value;
    if (tipo === 'NUMERICA_CINCO') {
      setConfigEval(prev => ({
        ...prev,
        tipo_escala: tipo,
        escala_minima: 1.0,
        escala_maxima: 5.0,
        nota_aprobatoria: 3.0
      }));
    } else if (tipo === 'NUMERICA_CIEN') {
      setConfigEval(prev => ({
        ...prev,
        tipo_escala: tipo,
        escala_minima: 0.0,
        escala_maxima: 100.0,
        nota_aprobatoria: 60.0
      }));
    } else if (tipo === 'PORCENTAJE') {
      setConfigEval(prev => ({
        ...prev,
        tipo_escala: tipo,
        escala_minima: 0.0,
        escala_maxima: 100.0,
        nota_aprobatoria: 70.0
      }));
    } else {
      setConfigEval(prev => ({
        ...prev,
        tipo_escala: tipo
      }));
    }
  };

  // Guardar Configuración Institucional
  const handleSubmitInstitucional = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await guardarConfiguracion(configInst);
      const datosActualizados = _extraerConfiguracionDelResponse(res);
      if (datosActualizados && Object.keys(datosActualizados).length > 0) {
        setConfigInst(prev => ({ ...prev, ...datosActualizados }));
      }
      setSuccessMsg('Configuración institucional guardada exitosamente.');
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (error) {
      setErrorMsg(error.message || 'Error al guardar la configuración institucional.');
    } finally {
      setGuardando(false);
    }
  };

  // Guardar Configuración de Evaluación Académica
  const handleSubmitEvaluacion = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setSuccessMsg('');
    setErrorMsg('');
    setCompatibilidadInfo(null);

    try {
      // 1. Verificar compatibilidad antes de persistir
      const compRes = await verificarCompatibilidadEvaluacion(configEval).catch(() => null);
      if (compRes && !compRes.compatible && compRes.conflictos?.length > 0) {
        setCompatibilidadInfo(compRes.conflictos);
        // Si hay conflictos y el usuario no ha forzado
        if (!configEval.forzar) {
          setErrorMsg('Existen conflictos con calificaciones registradas. Revisa las advertencias.');
          setGuardando(false);
          return;
        }
      }

      // 2. Guardar
      const res = await guardarConfiguracionEvaluacion(configEval);
      setSuccessMsg(`Configuración académica del año ${configEval.anio_academico} guardada y activada exitosamente.`);
      setTimeout(() => setSuccessMsg(''), 4500);

      // Recargar lista de configuraciones
      const resLista = await getConfiguracionesEvaluacion().catch(() => []);
      const lista = Array.isArray(resLista) ? resLista : (resLista?.data || []);
      setListaConfigsEval(lista);
      const savedData = res?.data || res;
      if (savedData && savedData.anio_academico) {
        setConfigEval(savedData);
        setAnioEvalSeleccionado(savedData.anio_academico);
        setAnioInput(String(savedData.anio_academico));
      }
    } catch (error) {
      setErrorMsg(error.message || 'Ocurrió un error al guardar la configuración de evaluación.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'var(--text-muted, #64748b)' }}>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid var(--color-primary, #0A3A20)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <span>Cargando configuraciones académicas e institucionales...</span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Banner Principal */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, var(--color-primary, #0A3A20) 0%, var(--color-primary-light, #166534) 100%)',
        padding: '1.75rem 2rem',
        borderRadius: '16px',
        color: '#ffffff',
        boxShadow: '0 10px 20px -5px rgba(10, 58, 32, 0.2)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#ffffff', fontWeight: 700 }}>
            Configuración del Sistema MonteVerde
          </h1>
          <p style={{ margin: '6px 0 0', color: '#ECFDF5', fontSize: '0.92rem', opacity: 0.95 }}>
            Gestione las reglas del sistema de evaluación académica y los datos institucionales.
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '58px',
          height: '58px',
          background: 'rgba(255, 255, 255, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '14px',
          backdropFilter: 'blur(4px)',
          flexShrink: 0,
          color: '#ffffff'
        }}>
          <Settings size={30} strokeWidth={2} />
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setTabActiva('evaluacion')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.75rem 1.4rem',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.2s',
            background: tabActiva === 'evaluacion' ? 'var(--color-primary, #0A3A20)' : '#ffffff',
            color: tabActiva === 'evaluacion' ? '#ffffff' : 'var(--text-secondary, #475569)',
            boxShadow: tabActiva === 'evaluacion' ? '0 4px 12px rgba(10, 58, 32, 0.2)' : '0 2px 4px rgba(0,0,0,0.04)'
          }}
        >
          <Sliders size={18} />
          <span>Sistema de Evaluación Académica</span>
        </button>

        <button
          onClick={() => setTabActiva('institucional')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.75rem 1.4rem',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.2s',
            background: tabActiva === 'institucional' ? 'var(--color-primary, #0A3A20)' : '#ffffff',
            color: tabActiva === 'institucional' ? '#ffffff' : 'var(--text-secondary, #475569)',
            boxShadow: tabActiva === 'institucional' ? '0 4px 12px rgba(10, 58, 32, 0.2)' : '0 2px 4px rgba(0,0,0,0.04)'
          }}
        >
          <Building2 size={18} />
          <span>Datos Institucionales</span>
        </button>
      </div>

      {/* Alertas y Mensajes */}
      {successMsg && (
        <div style={{
          background: '#d1fae5',
          border: '1px solid #10b981',
          color: '#065f46',
          padding: '0.9rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#991b1b',
          padding: '0.9rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {compatibilidadInfo && compatibilidadInfo.length > 0 && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #f59e0b',
          color: '#92400e',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} style={{ color: '#d97706' }} />
            <span>Advertencia de Compatibilidad de Datos</span>
          </div>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>
            El cambio solicitado para el año {configEval.anio_academico} afecta la estructura de notas ya existentes:
          </p>
          <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.25rem', fontSize: '0.88rem' }}>
            {compatibilidadInfo.map((conf, idx) => (
              <li key={idx}>{conf}</li>
            ))}
          </ul>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={configEval.forzar || false}
              onChange={(e) => setConfigEval(prev => ({ ...prev, forzar: e.target.checked }))}
            />
            <span>Comprendo los riesgos y deseo forzar la actualización para este año escolar.</span>
          </label>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 1: SISTEMA DE EVALUACIÓN ACADÉMICA                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabActiva === 'evaluacion' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid var(--border, #e2e8f0)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.04)',
          padding: '2rem'
        }}>
          {/* Selector Dinámico de Año Académico */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            paddingBottom: '1.5rem',
            marginBottom: '1.75rem',
            borderBottom: '1px solid var(--border, #e2e8f0)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text, #1e293b)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GraduationCap size={22} style={{ color: 'var(--color-primary, #0A3A20)' }} />
                  <span>Configuración por Año Escolar</span>
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '0.88rem' }}>
                  Cada año académico puede tener su propia estructura y escala de evaluación independiente.
                </p>
              </div>

              {/* Input Numérico Dinámico de Año */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <label htmlFor="inputAnioAcademico" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text, #1e293b)' }}>
                  Año Académico:
                </label>
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <input
                    id="inputAnioAcademico"
                    type="number"
                    min="1900"
                    max="2100"
                    value={anioInput}
                    onChange={handleAnioInputChange}
                    onBlur={() => {
                      const num = parseInt(anioInput);
                      if (!isNaN(num) && num >= 1900 && num <= 2100) {
                        cambiarAnioEvaluacion(num);
                      } else {
                        setAnioInput(String(anioEvalSeleccionado));
                      }
                    }}
                    placeholder="Ej. 2026"
                    style={{
                      width: '120px',
                      padding: '0.6rem 0.9rem',
                      borderRadius: '10px',
                      border: '2px solid var(--color-primary, #0A3A20)',
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      color: 'var(--color-primary, #0A3A20)',
                      background: '#f0fdf4',
                      outline: 'none',
                      textAlign: 'center'
                    }}
                  />
                </div>

                {/* Badge indicador de estado del año */}
                {listaConfigsEval.some(c => c.anio_academico === parseInt(anioEvalSeleccionado)) ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: '#dcfce7',
                    color: '#15803d',
                    border: '1px solid #86efac'
                  }}>
                    <CheckCircle2 size={14} /> Guardado en BD
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe'
                  }}>
                    <Sparkles size={14} /> Nuevo Año (Sin guardar)
                  </span>
                )}
              </div>
            </div>

            {/* Chips de Años Existentes en la Base de Datos */}
            {listaConfigsEval.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                background: '#f8fafc',
                padding: '0.6rem 0.9rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
                  Años registrados en BD:
                </span>
                {listaConfigsEval.map((c) => {
                  const esSeleccionado = c.anio_academico === parseInt(anioEvalSeleccionado);
                  return (
                    <button
                      key={c.anio_academico}
                      type="button"
                      onClick={() => cambiarAnioEvaluacion(c.anio_academico)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: esSeleccionado ? '1.5px solid var(--color-primary, #0A3A20)' : '1px solid #cbd5e1',
                        background: esSeleccionado ? 'var(--color-primary, #0A3A20)' : '#ffffff',
                        color: esSeleccionado ? '#ffffff' : '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span>{c.anio_academico}</span>
                      {c.activa && <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>• Activa</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmitEvaluacion}>
            {/* Grid de Configuración de Periodos e Indicadores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Nombre de la configuración */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>
                  Nombre Descriptivo del Esquema *
                </label>
                <input
                  type="text"
                  value={configEval.nombre || ''}
                  onChange={(e) => setConfigEval({ ...configEval, nombre: e.target.value })}
                  required
                  placeholder="ej. Modelo Cuatrimestral MonteVerde"
                  style={{
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Tipo de Periodo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>
                  Tipo de Periodo Académico *
                </label>
                <select
                  value={configEval.tipo_periodo || 'Bimestre'}
                  onChange={(e) => setConfigEval({ ...configEval, tipo_periodo: e.target.value })}
                  style={{
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Bimestre">Bimestres (ej. Bimestre 1..4)</option>
                  <option value="Trimestre">Trimestres (ej. Trimestre 1..3)</option>
                  <option value="Periodo">Periodos (ej. Periodo 1..N)</option>
                  <option value="Semestre">Semestres (ej. Semestre 1..2)</option>
                </select>
              </div>

              {/* Cantidad de Periodos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>
                  Cantidad de Periodos en el Año *
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={configEval.numero_periodos || 4}
                  onChange={(e) => setConfigEval({ ...configEval, numero_periodos: parseInt(e.target.value) || 1 })}
                  required
                  style={{
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Indicadores por Periodo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>
                  Indicadores de Logro por Periodo *
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={configEval.indicadores_por_periodo || 2}
                  onChange={(e) => setConfigEval({ ...configEval, indicadores_por_periodo: parseInt(e.target.value) || 1 })}
                  required
                  style={{
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Notas parciales por Indicador */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>
                  Notas Parciales por Indicador *
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={configEval.notas_por_indicador || 3}
                  onChange={(e) => setConfigEval({ ...configEval, notas_por_indicador: parseInt(e.target.value) || 1 })}
                  required
                  style={{
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Tipo de Escala */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>
                  Sistema de Calificación / Escala *
                </label>
                <select
                  value={configEval.tipo_escala || 'NUMERICA_CINCO'}
                  onChange={handleTipoEscalaChange}
                  style={{
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="NUMERICA_CINCO">Escala Numérica Tradicional (1.0 a 5.0)</option>
                  <option value="NUMERICA_CIEN">Escala Puntos (0 a 100)</option>
                  <option value="PORCENTAJE">Porcentaje (0% a 100%)</option>
                  <option value="PERSONALIZADA">Escala Personalizada</option>
                </select>
              </div>

              {/* Escala Mínima */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>
                  Calificación Mínima *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={configEval.escala_minima ?? 1.0}
                  onChange={(e) => setConfigEval({ ...configEval, escala_minima: parseFloat(e.target.value) || 0 })}
                  required
                  style={{
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Escala Máxima */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>
                  Calificación Máxima *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={configEval.escala_maxima ?? 5.0}
                  onChange={(e) => setConfigEval({ ...configEval, escala_maxima: parseFloat(e.target.value) || 0 })}
                  required
                  style={{
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Nota Aprobatoria */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>
                  Nota Mínima Aprobatoria *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={configEval.nota_aprobatoria ?? 3.0}
                  onChange={(e) => setConfigEval({ ...configEval, nota_aprobatoria: parseFloat(e.target.value) || 0 })}
                  required
                  style={{
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #cbd5e1)',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Simulación visual de la matriz resultante en tiempo real */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.25rem',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                <Sparkles size={16} style={{ color: 'var(--brand, #166534)' }} />
                <span>Vista Previa de la Matriz Docente Generada</span>
              </div>
              <p style={{ margin: '0 0 1rem', fontSize: '0.86rem', color: '#64748b' }}>
                Estructura que verán los docentes para el año {configEval.anio_academico}: <strong>{configEval.numero_periodos} {configEval.tipo_periodo.toLowerCase()}s</strong>, cada uno con <strong>{configEval.indicadores_por_periodo} indicadores</strong> y <strong>{configEval.notas_por_indicador} notas parciales</strong> en escala de <strong>{configEval.escala_minima} a {configEval.escala_maxima}</strong> (aprobación ≥ {configEval.nota_aprobatoria}).
              </p>

              {/* Mini tabla mock */}
              <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '8px', textAlign: 'left', minWidth: '140px' }}>Estudiante</th>
                      {Array.from({ length: Math.min(configEval.indicadores_por_periodo || 2, 4) }, (_, i) => i + 1).map(ind => (
                        <th key={ind} colSpan={(configEval.notas_por_indicador || 3) + 1} style={{ padding: '6px', borderLeft: '1px solid #cbd5e1', background: '#f8fafc' }}>
                          Indicador {ind}
                        </th>
                      ))}
                      <th style={{ padding: '8px', borderLeft: '1px solid #cbd5e1' }}>Definitiva</th>
                    </tr>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', fontSize: '0.75rem', color: '#64748b' }}>
                      <th style={{ padding: '4px 8px' }}>—</th>
                      {Array.from({ length: Math.min(configEval.indicadores_por_periodo || 2, 4) }, (_, indI) => indI + 1).map(ind => (
                        <React.Fragment key={`sub-${ind}`}>
                          {Array.from({ length: configEval.notas_por_indicador || 3 }, (_, nI) => nI + 1).map(n => (
                            <th key={`n-${ind}-${n}`} style={{ padding: '4px', borderLeft: '1px solid #e2e8f0' }}>N{n}</th>
                          ))}
                          <th style={{ padding: '4px', borderLeft: '1px solid #cbd5e1', fontWeight: 'bold' }}>Prom</th>
                        </React.Fragment>
                      ))}
                      <th style={{ padding: '4px', borderLeft: '1px solid #cbd5e1' }}>Prom</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Estudiante de Prueba</td>
                      {Array.from({ length: Math.min(configEval.indicadores_por_periodo || 2, 4) }, (_, indI) => indI + 1).map(ind => (
                        <React.Fragment key={`td-${ind}`}>
                          {Array.from({ length: configEval.notas_por_indicador || 3 }, (_, nI) => nI + 1).map(n => (
                            <td key={`cell-${ind}-${n}`} style={{ padding: '6px', borderLeft: '1px solid #e2e8f0', color: '#94a3b8' }}>
                              —
                            </td>
                          ))}
                          <td style={{ padding: '6px', borderLeft: '1px solid #cbd5e1', background: '#f1f5f9', fontWeight: 600 }}>
                            —
                          </td>
                        </React.Fragment>
                      ))}
                      <td style={{ padding: '6px', borderLeft: '1px solid #cbd5e1', background: '#f1f5f9', fontWeight: 700 }}>
                        —
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Acciones de Formulario */}
            <div style={{
              borderTop: '1px solid var(--border, #e2e8f0)',
              paddingTop: '1.5rem',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                type="button"
                onClick={() => cambiarAnioEvaluacion(anioEvalSeleccionado)}
                disabled={guardando}
                style={{
                  background: '#f8fafc',
                  color: 'var(--text-secondary, #475569)',
                  border: '1px solid var(--border, #cbd5e1)',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RotateCw size={15} />
                <span>Restablecer</span>
              </button>

              <button
                type="submit"
                disabled={guardando}
                style={{
                  background: guardando ? '#94a3b8' : 'var(--color-primary, #0A3A20)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.7rem 1.8rem',
                  borderRadius: '10px',
                  fontSize: '0.94rem',
                  fontWeight: 700,
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(10, 58, 32, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Save size={16} />
                <span>{guardando ? 'Guardando...' : `Guardar Configuración ${configEval.anio_academico}`}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 2: DATOS INSTITUCIONALES GENERALES                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabActiva === 'institucional' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid var(--border, #e2e8f0)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.04)',
          padding: '2rem'
        }}>
          <form onSubmit={handleSubmitInstitucional}>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text, #1e293b)', fontWeight: 700, borderBottom: '1px solid var(--border, #e2e8f0)', paddingBottom: '0.65rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} style={{ color: 'var(--color-primary-light, #166534)' }} />
                <span>Información General de la Institución</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>Nombre Institución *</label>
                  <input
                    type="text"
                    value={configInst.nombre_institucion || ''}
                    onChange={(e) => setConfigInst({ ...configInst, nombre_institucion: e.target.value })}
                    required
                    style={{ padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border, #cbd5e1)', fontSize: '0.92rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>Director / Rector *</label>
                  <input
                    type="text"
                    value={configInst.director || ''}
                    onChange={(e) => setConfigInst({ ...configInst, director: e.target.value })}
                    required
                    style={{ padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border, #cbd5e1)', fontSize: '0.92rem', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text, #1e293b)', fontWeight: 700, borderBottom: '1px solid var(--border, #e2e8f0)', paddingBottom: '0.65rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} style={{ color: 'var(--color-primary-light, #166534)' }} />
                <span>Periodo Académico Activo Institucional</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>Año Escolar Activo *</label>
                  <input
                    type="text"
                    value={configInst.anio_escolar || ''}
                    onChange={(e) => setConfigInst({ ...configInst, anio_escolar: e.target.value })}
                    required
                    placeholder="ej. 2026"
                    style={{ padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border, #cbd5e1)', fontSize: '0.92rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>Período Académico Actual *</label>
                  <input
                    type="text"
                    value={configInst.periodo_actual || ''}
                    onChange={(e) => setConfigInst({ ...configInst, periodo_actual: e.target.value })}
                    required
                    placeholder="ej. Bimestre 1"
                    style={{ padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border, #cbd5e1)', fontSize: '0.92rem', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text, #1e293b)', fontWeight: 700, borderBottom: '1px solid var(--border, #e2e8f0)', paddingBottom: '0.65rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={20} style={{ color: 'var(--color-primary-light, #166534)' }} />
                <span>Datos de Contacto y Ubicación</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>Dirección Física</label>
                  <input
                    type="text"
                    value={configInst.direccion || ''}
                    onChange={(e) => setConfigInst({ ...configInst, direccion: e.target.value })}
                    style={{ padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border, #cbd5e1)', fontSize: '0.92rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>Teléfono</label>
                    <input
                      type="text"
                      value={configInst.telefono || ''}
                      onChange={(e) => setConfigInst({ ...configInst, telefono: e.target.value })}
                      style={{ padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border, #cbd5e1)', fontSize: '0.92rem', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>Email de Contacto</label>
                    <input
                      type="email"
                      value={configInst.email_contacto || ''}
                      onChange={(e) => setConfigInst({ ...configInst, email_contacto: e.target.value })}
                      style={{ padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border, #cbd5e1)', fontSize: '0.92rem', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid var(--border, #e2e8f0)',
              paddingTop: '1.5rem',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                type="submit"
                disabled={guardando}
                style={{
                  background: guardando ? '#94a3b8' : 'var(--color-primary, #0A3A20)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.7rem 1.8rem',
                  borderRadius: '10px',
                  fontSize: '0.94rem',
                  fontWeight: 700,
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(10, 58, 32, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Save size={16} />
                <span>{guardando ? 'Guardando...' : 'Guardar Información Institucional'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
