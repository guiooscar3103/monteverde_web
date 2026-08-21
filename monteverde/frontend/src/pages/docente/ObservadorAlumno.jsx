import { useEffect, useMemo, useState } from 'react';
import Tabla from '../../components/Tabla';
import SelectSimple from '../../components/SelectSimple';
import BarraTitulo from '../../components/BarraTitulo';
import Card from '../../components/Card';
import BlurFade from '../../components/BlurFade';
import { useAuth } from '../../hooks/useAuth';
import {
  getCursos,
  getEstudiantesPorCurso,
  getObservadorPorCurso,
  agregarAnotacion,
  eliminarObservacion
} from '../../services/api';

const TIPOS_OBSERVACION = [
  { value: 'POSITIVA', label: 'Positiva' },
  { value: 'NEGATIVA', label: 'Llamado de Atención' },
  { value: 'NEUTRAL', label: 'Seguimiento' },
  { value: 'DISCIPLINARIA', label: 'Disciplinaria' }
];

const COLORES_TIPO = {
  'POSITIVA': '#28a745',
  'NEGATIVA': '#dc3545', 
  'NEUTRAL': '#6c757d',
  'DISCIPLINARIA': '#fd7e14'
};

// Funciones helper
const _construirOpcionesEstudiantes = (estudiantes) => {
  return estudiantes.map(e => ({ 
    value: e.id.toString(), 
    label: e.nombre 
  }));
};

const _construirFilasObservaciones = (anotaciones) => {
  return anotaciones.map(a => ({
    id: a.id,
    fecha: a.fecha,
    estudiante: a.estudiante_nombre || `ID: ${a.estudianteId}`,
    tipo: a.tipo,
    detalle: a.detalle,
    docenteId: a.docenteId,
    docente_nombre: a.docente_nombre
  }));
};

const _validarFormAnotacion = (form) => {
  return form.estudianteId && form.detalle.trim();
};

const _crearDatosAnotacion = (form, usuarioId) => {
  return {
    estudianteId: parseInt(form.estudianteId),
    docenteId: usuarioId,
    fecha: form.fecha,
    tipo: form.tipo,
    detalle: form.detalle.trim()
  };
};

export default function ObservadorAlumno() {
  const { usuario } = useAuth();
  const [cursoId, setCursoId] = useState('');
  const [anotaciones, setAnotaciones] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [form, setForm] = useState({
    estudianteId: '',
    fecha: new Date().toISOString().slice(0, 10),
    tipo: 'POSITIVA',
    detalle: ''
  });

  const [cursosOptions, setCursosOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Estados para Eliminación
  const [observacionAEliminar, setObservacionAEliminar] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);

  // Cargar cursos
  useEffect(() => {
    const cargarCursos = async () => {
      try {
        console.log('📚 Cargando cursos...');
        const cursos = await getCursos();
        console.log('📚 Cursos obtenidos:', cursos);
        
        setCursosOptions(cursos.map(c => ({ 
          value: c.id.toString(), 
          label: c.nombre 
        })));
        
        if (cursos.length > 0) {
          setCursoId(cursos[0].id.toString());
        }
      } catch (error) {
        console.error('❌ Error al cargar cursos:', error);
        setMensaje('❌ Error al cargar los cursos');
      }
    };
    cargarCursos();
  }, []);

  // Cargar datos del curso
  useEffect(() => {
    if (!cursoId) return;

    const cargarDatos = async () => {
      setLoading(true);
      setMensaje('');
      
      try {
        console.log('🔍 Cargando datos para curso:', cursoId);
        
        // Cargar estudiantes
        const estudiantesData = await getEstudiantesPorCurso(parseInt(cursoId));
        console.log('👥 Estudiantes cargados:', estudiantesData);
        setEstudiantes(estudiantesData || []);

        // Cargar observaciones
        try {
          const anotacionesData = await getObservadorPorCurso(parseInt(cursoId));
          console.log('📝 Observaciones cargadas:', anotacionesData);
          setAnotaciones(anotacionesData || []);
        } catch (obsError) {
          console.warn('⚠️ No se pudieron cargar observaciones:', obsError);
          setAnotaciones([]);
        }

        // Resetear estudiante seleccionado
        setForm(prev => ({
          ...prev,
          estudianteId: '',
          detalle: ''
        }));

      } catch (error) {
        console.error('❌ Error general:', error);
        setMensaje('❌ Error al cargar datos: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [cursoId]);

  const estOptions = useMemo(() => _construirOpcionesEstudiantes(estudiantes), [estudiantes]);
  const filas = useMemo(() => _construirFilasObservaciones(anotaciones), [anotaciones]);

  // Columnas con la nueva columna ACCIONES
  const columnas = [
    { key: 'fecha', header: 'Fecha' },
    { key: 'estudiante', header: 'Estudiante' },
    { 
      key: 'tipo', 
      header: 'Tipo',
      render: (valor) => (
        <span style={{ color: COLORES_TIPO[valor] || '#666', fontWeight: 'bold' }}>
          {valor}
        </span>
      )
    },
    { 
      key: 'detalle', 
      header: 'Detalle',
      render: (valor) => (
        <div style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
          {valor}
        </div>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setObservacionAEliminar(row)}
          disabled={eliminandoId === row.id}
          style={{
            padding: '0.35rem 0.75rem',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: eliminandoId === row.id ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            transition: 'all 0.15s ease'
          }}
          title="Eliminar observación"
        >
          {eliminandoId === row.id ? '⏳ Eliminando...' : '🗑️ Eliminar'}
        </button>
      )
    }
  ];

  // Agregar observación
  const agregar = async () => {
    if (!_validarFormAnotacion(form)) {
      alert('Por favor selecciona un estudiante y escribe un detalle');
      return;
    }

    try {
      setGuardando(true);
      const datosAEnviar = _crearDatosAnotacion(form, usuario?.id);
      await agregarAnotacion(datosAEnviar);
      setMensaje('✅ Observación agregada correctamente.');
      setTimeout(() => setMensaje(''), 3500);
      
      setForm(prev => ({ 
        ...prev, 
        detalle: '',
        estudianteId: '' 
      }));
      
      const nuevasObs = await getObservadorPorCurso(parseInt(cursoId));
      setAnotaciones(nuevasObs || []);
      
    } catch (error) {
      console.error('❌ Error al agregar observación:', error);
      setMensaje('❌ Error: ' + (error.message || 'Error al agregar'));
    } finally {
      setGuardando(false);
    }
  };

  // Confirmar y procesar eliminación de observación
  const handleConfirmarEliminar = async () => {
    if (!observacionAEliminar || eliminandoId) return;

    const idAEliminar = observacionAEliminar.id;
    try {
      setEliminandoId(idAEliminar);
      setMensaje('');

      await eliminarObservacion(idAEliminar);

      // Actualizar inmediatamente el estado local sin recargar página
      setAnotaciones(prev => prev.filter(obs => obs.id !== idAEliminar));
      setObservacionAEliminar(null);
      setMensaje('✅ Observación eliminada correctamente.');
      setTimeout(() => setMensaje(''), 4000);

    } catch (error) {
      console.error('❌ Error al eliminar observación:', error);
      const msg = error.message || '';
      
      if (msg.includes('403') || msg.toLowerCase().includes('permisos') || msg.toLowerCase().includes('acceso denegado')) {
        setMensaje('❌ No tienes permisos para eliminar esta observación.');
      } else if (msg.includes('404') || msg.toLowerCase().includes('no encontrada')) {
        setMensaje('❌ La observación ya no existe o fue eliminada anteriormente.');
        // Limpiar de la lista local si ya no existe en el backend
        setAnotaciones(prev => prev.filter(obs => obs.id !== idAEliminar));
      } else {
        setMensaje('❌ No fue posible eliminar la observación. Inténtalo nuevamente.');
      }
      setObservacionAEliminar(null);
    } finally {
      setEliminandoId(null);
    }
  };

  const cursoActual = cursosOptions.find(c => c.value === cursoId);
  const botonHabilitado = !guardando && !!form.estudianteId && !!form.detalle.trim();

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <BlurFade delay={0.05} duration={0.3}>
        <BarraTitulo 
          titulo="Observador del Alumno" 
          subtitulo="Registrar observaciones y seguimiento de estudiantes"
          derecha={
            <div style={{ fontSize: '0.9rem', textAlign: 'right', color: '#666' }}>
              {cursoActual && (
                <>
                  <div><strong>{cursoActual.label}</strong></div>
                  <div>Total: {anotaciones.length} observaciones</div>
                </>
              )}
            </div>
          }
        />
      </BlurFade>

      {/* Indicador de carga */}
      {loading && (
        <BlurFade delay={0.08} duration={0.25}>
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            marginBottom: '0.5rem',
            color: '#666'
          }}>
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mx-auto mb-2"></div>
            <p>Cargando datos del curso...</p>
          </div>
        </BlurFade>
      )}

      {/* Mensajes de notificación */}
      {mensaje && (
        <BlurFade delay={0.1} duration={0.25}>
          <div style={{ 
            padding: '0.75rem 1rem',
            backgroundColor: mensaje.includes('✅') ? '#d4edda' : '#f8d7da',
            color: mensaje.includes('✅') ? '#155724' : '#721c24',
            border: '1px solid',
            borderColor: mensaje.includes('✅') ? '#c3e6cb' : '#f5c6cb',
            borderRadius: '8px',
            marginBottom: '0.5rem',
            textAlign: 'center',
            fontWeight: 600
          }}>
            {mensaje}
          </div>
        </BlurFade>
      )}

      {/* Selector de curso */}
      <BlurFade delay={0.12} duration={0.35}>
        <Card title="Seleccionar Curso">
          <SelectSimple
            value={cursoId}
            onChange={(valor) => {
              console.log('📚 Curso cambiado a:', valor);
              setCursoId(valor);
            }}
            options={cursosOptions}
            etiqueta="Curso"
          />
        </Card>
      </BlurFade>

      {/* Historial con columna de Acciones */}
      <BlurFade delay={0.18} duration={0.4}>
        <Card title={`Historial - ${cursoActual?.label || 'Curso'}`}>
          {filas.length > 0 ? (
            <Tabla columns={columnas} rows={filas} />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <p>No hay observaciones para este curso</p>
            </div>
          )}
        </Card>
      </BlurFade>

      {/* Formulario para Agregar Nueva Observación */}
      <BlurFade delay={0.24} duration={0.45}>
        <Card title="Agregar Nueva Observación">
          <div style={{ display: 'grid', gap: '1rem' }}>
            
            {/* Estudiante */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Estudiante:
              </label>
              <select
                value={form.estudianteId}
                onChange={(e) => {
                  setForm({ ...form, estudianteId: e.target.value });
                }}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  width: '100%',
                  fontSize: '0.95rem',
                  background: 'var(--bg-white, #fff)'
                }}
              >
                <option value="">-- Selecciona un estudiante --</option>
                {estOptions.map(est => (
                  <option key={est.value} value={est.value}>
                    {est.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Tipo de Observación:
              </label>
              <select
                value={form.tipo}
                onChange={(e) => {
                  setForm({ ...form, tipo: e.target.value });
                }}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  width: '100%',
                  fontSize: '0.95rem',
                  background: 'var(--bg-white, #fff)'
                }}
              >
                {TIPOS_OBSERVACION.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Detalle */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Detalle:
              </label>
              <textarea
                rows={4}
                placeholder="Escribe aquí la observación de seguimiento comportamental o académico..."
                value={form.detalle}
                onChange={(e) => {
                  setForm({ ...form, detalle: e.target.value });
                }}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  width: '100%',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Botón de Envío */}
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={agregar}
                disabled={!botonHabilitado}
                style={{
                  padding: '0.85rem 2.5rem',
                  backgroundColor: botonHabilitado ? 'var(--brand, #11998e)' : '#cccccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: botonHabilitado ? 'pointer' : 'not-allowed',
                  minWidth: '220px',
                  boxShadow: botonHabilitado ? '0 2px 6px rgba(17, 153, 142, 0.25)' : 'none'
                }}
              >
                {guardando ? '⏳ Guardando...' : '📝 Agregar Observación'}
              </button>
            </div>
          </div>
        </Card>
      </BlurFade>

      {/* Modal de Confirmación de Eliminación */}
      {observacionAEliminar && (
        <div 
          className="modal-overlay" 
          onClick={() => !eliminandoId && setObservacionAEliminar(null)}
        >
          <div 
            className="modal-content" 
            style={{ maxWidth: '440px' }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.75rem' }}>⚠️</span>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 700 }}>
                  ¿Eliminar observación?
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Estudiante: <strong>{observacionAEliminar.estudiante}</strong>
                </p>
              </div>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Esta acción eliminará permanentemente esta observación y no se puede deshacer.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                disabled={!!eliminandoId}
                onClick={() => setObservacionAEliminar(null)}
                style={{
                  padding: '0.55rem 1.15rem',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: eliminandoId ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!!eliminandoId}
                onClick={handleConfirmarEliminar}
                style={{
                  padding: '0.55rem 1.25rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: eliminandoId ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {eliminandoId ? '⏳ Eliminando...' : '🗑️ Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}