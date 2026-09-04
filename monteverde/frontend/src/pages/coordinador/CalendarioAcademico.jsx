import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Lock,
  Unlock,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CalendarCheck,
  ShieldCheck,
  Save,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import {
  getCalendarioAcademico,
  actualizarCalendarioAcademico,
  cambiarEstadoPeriodoLectivo,
  actualizarPeriodoLectivo
} from '../../services/api';

export default function CalendarioAcademico() {
  const [calendario, setCalendario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  // Modales
  const [modalPeriodo, setModalPeriodo] = useState(null); // Periodo siendo editado
  const [formPeriodo, setFormPeriodo] = useState({
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    fecha_cierre_calificaciones: '',
    estado: 'ABIERTO'
  });

  const [modalGeneral, setModalGeneral] = useState(false);
  const [formGeneral, setFormGeneral] = useState({
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    descripcion: ''
  });

  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarCalendario(anioSeleccionado);
  }, [anioSeleccionado]);

  const cargarCalendario = async (anio) => {
    setCargando(true);
    setErrorMsg('');
    try {
      const data = await getCalendarioAcademico(anio);
      setCalendario(data);
    } catch (err) {
      console.error('Error al cargar calendario académico:', err);
      setErrorMsg('No se pudo cargar el calendario institucional. Por favor, reintente.');
    } finally {
      setCargando(false);
    }
  };

  const handleToggleEstado = async (periodo) => {
    const nuevoEstado = periodo.estado === 'ABIERTO' ? 'CERRADO' : 'ABIERTO';
    const accion = nuevoEstado === 'ABIERTO' ? 'aperturar' : 'cerrar';

    if (!window.confirm(`¿Estás seguro de que deseas ${accion} el "${periodo.nombre}"? ${nuevoEstado === 'CERRADO' ? 'Los docentes no podrán asentar nuevas notas.' : 'Los docentes habilitados podrán registrar notas.'}`)) {
      return;
    }

    try {
      await cambiarEstadoPeriodoLectivo(periodo.id, nuevoEstado);
      setSuccessMsg(`Periodo "${periodo.nombre}" ${nuevoEstado === 'ABIERTO' ? 'aperturado' : 'cerrado'} exitosamente.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      cargarCalendario(anioSeleccionado);
    } catch (err) {
      console.error('Error al cambiar estado del periodo:', err);
      setErrorMsg(err.message || 'Error al cambiar estado del periodo.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const abrirModalPeriodo = (periodo) => {
    setModalPeriodo(periodo);
    setFormPeriodo({
      nombre: periodo.nombre || '',
      fecha_inicio: periodo.fecha_inicio ? periodo.fecha_inicio.substring(0, 10) : '',
      fecha_fin: periodo.fecha_fin ? periodo.fecha_fin.substring(0, 10) : '',
      fecha_cierre_calificaciones: periodo.fecha_cierre_calificaciones ? periodo.fecha_cierre_calificaciones.substring(0, 10) : '',
      estado: periodo.estado || 'ABIERTO'
    });
  };

  const handleGuardarPeriodo = async (e) => {
    e.preventDefault();
    if (!modalPeriodo) return;
    setGuardando(true);
    try {
      await actualizarPeriodoLectivo(modalPeriodo.id, formPeriodo);
      setSuccessMsg(`Periodo "${formPeriodo.nombre}" actualizado correctamente.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setModalPeriodo(null);
      cargarCalendario(anioSeleccionado);
    } catch (err) {
      console.error('Error al guardar periodo:', err);
      alert(err.message || 'Error al guardar los cambios del periodo.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalGeneral = () => {
    if (!calendario) return;
    setFormGeneral({
      nombre: calendario.nombre || '',
      fecha_inicio: calendario.fecha_inicio ? calendario.fecha_inicio.substring(0, 10) : '',
      fecha_fin: calendario.fecha_fin ? calendario.fecha_fin.substring(0, 10) : '',
      descripcion: calendario.descripcion || ''
    });
    setModalGeneral(true);
  };

  const handleGuardarGeneral = async (e) => {
    e.preventDefault();
    if (!calendario) return;
    setGuardando(true);
    try {
      await actualizarCalendarioAcademico(calendario.id, formGeneral);
      setSuccessMsg('Fechas generales del calendario actualizadas correctamente.');
      setTimeout(() => setSuccessMsg(''), 4000);
      setModalGeneral(false);
      cargarCalendario(anioSeleccionado);
    } catch (err) {
      console.error('Error al guardar calendario general:', err);
      alert(err.message || 'Error al guardar el calendario.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      {/* Encabezado Principal */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #059669 100%)',
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
            <Sparkles size={14} /> COORDINACIÓN CURRICULAR Y EVALUATIVA
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.5px' }}>
            Calendario Académico y Periodos Lectivos
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.98rem', lineHeight: '1.5' }}>
            Gestiona las fechas oficiales del ciclo escolar, establece los límites de ingreso de calificaciones para docentes y apertura o cierra los bimestres evaluativos.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.15)', padding: '0.6rem 1.2rem', borderRadius: '12px', backdropFilter: 'blur(6px)' }}>
          <Calendar size={20} color="#ffffff" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: '#A7F3D0' }}>Año Lectivo</span>
            <select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(parseInt(e.target.value, 10))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.1rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y} style={{ color: '#1f2937' }}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <CheckCircle2 size={20} color="#16a34a" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600
        }}>
          <AlertTriangle size={20} color="#dc2626" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Resumen General del Año Escolar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            backgroundColor: '#ecfdf5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669'
          }}>
            <CalendarCheck size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#111827' }}>
                {calendario?.nombre || `Ciclo Académico ${anioSeleccionado}`}
              </h2>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#065f46',
                backgroundColor: '#d1fae5',
                padding: '3px 10px',
                borderRadius: '20px',
                textTransform: 'uppercase'
              }}>
                {calendario?.estado || 'EN CURSO'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#6b7280' }}>
              Vigencia Institucional: <strong>{calendario?.fecha_inicio || '01/02/2026'}</strong> al <strong>{calendario?.fecha_fin || '30/11/2026'}</strong>
              {calendario?.descripcion ? ` • ${calendario.descripcion}` : ''}
            </p>
          </div>
        </div>

        <button
          onClick={abrirModalGeneral}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f9fafb',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '10px',
            padding: '0.65rem 1.25rem',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
        >
          <Edit3 size={16} /> Modificar Fechas Generales
        </button>
      </div>

      {/* Grid de Periodos Lectivos / Bimestres */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
              Periodos Evaluativos (Bimestres)
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              El Coordinador controla el ingreso de notas abriendo/cerrando periodos o definiendo la fecha límite.
            </span>
          </div>
        </div>

        {cargando ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af', fontWeight: 600 }}>
            Cargando periodos lectivos institucionales...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {(calendario?.periodos || []).map((periodo) => {
              const estaAbierto = periodo.estado === 'ABIERTO';
              const permiteCalificar = periodo.permite_calificaciones;
              const plazoVencido = estaAbierto && !permiteCalificar;

              return (
                <div
                  key={periodo.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '1.75rem',
                    border: estaAbierto
                      ? (plazoVencido ? '2px solid #f59e0b' : '2px solid #10b981')
                      : '1px solid #e5e7eb',
                    boxShadow: estaAbierto
                      ? (plazoVencido ? '0 8px 20px -4px rgba(245, 158, 11, 0.15)' : '0 8px 20px -4px rgba(16, 185, 129, 0.15)')
                      : '0 2px 6px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  {/* Encabezado de la Tarjeta */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          backgroundColor: estaAbierto
                            ? (plazoVencido ? '#fffbeb' : '#ecfdf5')
                            : '#f3f4f6',
                          color: estaAbierto
                            ? (plazoVencido ? '#d97706' : '#059669')
                            : '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem'
                        }}>
                          {periodo.orden}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
                          {periodo.nombre}
                        </h4>
                      </div>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        backgroundColor: !estaAbierto
                          ? '#fee2e2'
                          : (plazoVencido ? '#fef3c7' : '#d1fae5'),
                        color: !estaAbierto
                          ? '#991b1b'
                          : (plazoVencido ? '#b45309' : '#065f46'),
                        border: plazoVencido ? '1px solid #fde68a' : 'none',
                        textTransform: 'uppercase'
                      }}>
                        {!estaAbierto ? (
                          <>
                            <Lock size={13} />
                            CERRADO
                          </>
                        ) : plazoVencido ? (
                          <>
                            <AlertTriangle size={13} />
                            ABIERTO (PLAZO VENCIDO)
                          </>
                        ) : (
                          <>
                            <Unlock size={13} />
                            ABIERTO
                          </>
                        )}
                      </span>
                    </div>

                    {/* Rango de Fechas del Periodo */}
                    <div style={{
                      backgroundColor: '#f9fafb',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      marginBottom: '1rem',
                      border: '1px solid #f3f4f6'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#4b5563', marginBottom: '4px' }}>
                        <Calendar size={14} color="#6b7280" />
                        <span>Vigencia del periodo:</span>
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1f2937' }}>
                        {periodo.fecha_inicio || 'Sin definir'} — {periodo.fecha_fin || 'Sin definir'}
                      </div>
                    </div>

                    {/* Fecha Límite de Calificaciones */}
                    <div style={{
                      backgroundColor: permiteCalificar ? '#eff6ff' : '#fff1f2',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      marginBottom: '1.5rem',
                      border: `1px solid ${permiteCalificar ? '#bfdbfe' : '#fecdd3'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: permiteCalificar ? '#1e40af' : '#9f1239', marginBottom: '4px' }}>
                        <Clock size={14} />
                        <span style={{ fontWeight: 700 }}>Límite Ingreso de Notas:</span>
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: permiteCalificar ? '#1e3a8a' : '#881337' }}>
                        {periodo.fecha_cierre_calificaciones ? new Date(periodo.fecha_cierre_calificaciones + 'T00:00:00').toLocaleDateString() : 'Sin fecha límite fija'}
                      </div>
                      <div style={{ fontSize: '0.74rem', marginTop: '4px', color: permiteCalificar ? '#3b82f6' : '#e11d48', fontWeight: 600 }}>
                        {permiteCalificar ? '✓ Docentes autorizados a calificar' : '⛔ Calificaciones bloqueadas para docentes'}
                      </div>
                    </div>
                  </div>

                  {/* Acciones del Coordinador */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: 'auto' }}>
                    {plazoVencido && (
                      <button
                        onClick={() => abrirModalPeriodo(periodo)}
                        style={{
                          width: '100%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '0.6rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #f59e0b',
                          backgroundColor: '#fffbeb',
                          color: '#b45309',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef3c7'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fffbeb'}
                      >
                        <Clock size={14} /> Ampliar Plazo de Calificaciones
                      </button>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => handleToggleEstado(periodo)}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '0.65rem',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        backgroundColor: estaAbierto ? '#fee2e2' : '#dcfce7',
                        color: estaAbierto ? '#991b1b' : '#166534',
                        transition: 'all 0.15s'
                      }}
                    >
                      {estaAbierto ? (
                        <>
                          <Lock size={15} /> Cerrar Periodo
                        </>
                      ) : (
                        <>
                          <Unlock size={15} /> Abrir Periodo
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => abrirModalPeriodo(periodo)}
                      title="Editar fechas y plazo de cierre"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#374151',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Nota Informativa sobre la Regla de Negocio */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <Info size={22} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5' }}>
          <strong>Política de Cierre Automático:</strong> El sistema bloquea automáticamente a los docentes cuando la fecha actual supera la <strong>Fecha Límite de Calificaciones</strong> o cuando el periodo está en estado <strong>CERRADO</strong>. Como Coordinador Académico, puedes reabrir el periodo o extender el plazo temporal en cualquier momento para permitir rectificaciones de notas.
        </div>
      </div>

      {/* Modal Editar Periodo */}
      {modalPeriodo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
                Configuración del {modalPeriodo.nombre}
              </h3>
              <button
                onClick={() => setModalPeriodo(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardarPeriodo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                  Nombre del Periodo
                </label>
                <input
                  type="text"
                  value={formPeriodo.nombre}
                  onChange={e => setFormPeriodo({ ...formPeriodo, nombre: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.92rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={formPeriodo.fecha_inicio}
                    onChange={e => setFormPeriodo({ ...formPeriodo, fecha_inicio: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={formPeriodo.fecha_fin}
                    onChange={e => setFormPeriodo({ ...formPeriodo, fecha_fin: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e40af', marginBottom: '6px' }}>
                  Fecha Límite Cierre de Calificaciones
                </label>
                <input
                  type="date"
                  value={formPeriodo.fecha_cierre_calificaciones}
                  onChange={e => setFormPeriodo({ ...formPeriodo, fecha_cierre_calificaciones: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #93c5fd',
                    fontSize: '0.92rem'
                  }}
                />
                <small style={{ color: '#3b82f6', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  Pasada esta fecha, los docentes no podrán ingresar ni modificar notas en este periodo.
                </small>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                  Estado del Periodo
                </label>
                <select
                  value={formPeriodo.estado}
                  onChange={e => setFormPeriodo({ ...formPeriodo, estado: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.92rem'
                  }}
                >
                  <option value="ABIERTO">ABIERTO (Calificaciones permitidas)</option>
                  <option value="CERRADO">CERRADO (Bloqueo inmediato)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setModalPeriodo(null)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    background: '#f9fafb',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Calendario General */}
      {modalGeneral && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
                Calendario Institucional {anioSeleccionado}
              </h3>
              <button
                onClick={() => setModalGeneral(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardarGeneral} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                  Nombre Oficial del Calendario
                </label>
                <input
                  type="text"
                  value={formGeneral.nombre}
                  onChange={e => setFormGeneral({ ...formGeneral, nombre: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.92rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                    Inicio Año Escolar
                  </label>
                  <input
                    type="date"
                    value={formGeneral.fecha_inicio}
                    onChange={e => setFormGeneral({ ...formGeneral, fecha_inicio: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                    Fin Año Escolar
                  </label>
                  <input
                    type="date"
                    value={formGeneral.fecha_fin}
                    onChange={e => setFormGeneral({ ...formGeneral, fecha_fin: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                  Descripción u Observaciones Institucionales
                </label>
                <textarea
                  value={formGeneral.descripcion}
                  onChange={e => setFormGeneral({ ...formGeneral, descripcion: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.92rem',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setModalGeneral(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    background: '#f9fafb',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
