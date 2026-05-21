import { useEffect, useMemo, useState } from 'react';
import Tabla from '../../components/Tabla';
import SelectSimple from '../../components/SelectSimple';
import BarraTitulo from '../../components/BarraTitulo';
import Card from '../../components/Card';
import { useAuth } from '../../hooks/useAuth';
import {
  getCursos,
  getEstudiantesPorCurso,
  getObservadorPorCurso,
  agregarAnotacion
} from '../../services/api';

const TIPOS_OBSERVACION = [
  { value: 'POSITIVA', label: 'Positiva' },
  { value: 'NEGATIVA', label: 'Llamado de Atención' },
  { value: 'NEUTRAL', label: 'Seguimiento' },
  { value: 'DISCIPLINARIA', label: 'Disciplinaria' }
];

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
  const [loading, setLoading] = useState(false); // Ahora SÍ se usa en el JSX
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

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

  const estOptions = useMemo(() => {
    const options = estudiantes.map(e => ({ 
      value: e.id.toString(), 
      label: e.nombre 
    }));
    console.log('📋 Opciones de estudiantes generadas:', options);
    return options;
  }, [estudiantes]);

  const filas = useMemo(() => {
    const filasGeneradas = anotaciones.map(a => ({
      id: a.id,
      fecha: a.fecha,
      estudiante: a.estudiante_nombre || `ID: ${a.estudianteId}`,
      tipo: a.tipo,
      detalle: a.detalle
    }));
    console.log('📊 Filas para tabla:', filasGeneradas);
    return filasGeneradas;
  }, [anotaciones]);

  const columnas = [
    { key: 'fecha', header: 'Fecha' },
    { key: 'estudiante', header: 'Estudiante' },
    { 
      key: 'tipo', 
      header: 'Tipo',
      render: (valor) => {
        const colores = {
          'POSITIVA': '#28a745',
          'NEGATIVA': '#dc3545', 
          'NEUTRAL': '#6c757d',
          'DISCIPLINARIA': '#fd7e14'
        };
        return (
          <span style={{ color: colores[valor] || '#666', fontWeight: 'bold' }}>
            {valor}
          </span>
        );
      }
    },
    { 
      key: 'detalle', 
      header: 'Detalle',
      render: (valor) => (
        <div style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
          {valor}
        </div>
      )
    }
  ];

  const agregar = async () => {
    console.log('🔴🔴🔴 BOTÓN PRESIONADO!!! 🔴🔴🔴');
    console.log('📝 Form completo:', form);
    console.log('👤 Usuario:', usuario);
    
    if (!form.estudianteId || !form.detalle.trim()) {
      console.log('❌ Validación falló');
      alert('Por favor selecciona un estudiante y escribe un detalle');
      return;
    }

    console.log('✅ Validación OK, enviando...');
    
    try {
      setGuardando(true);
      
      const datosAEnviar = {
        estudianteId: parseInt(form.estudianteId),
        docenteId: usuario?.id || 2,
        fecha: form.fecha,
        tipo: form.tipo,
        detalle: form.detalle.trim()
      };
      
      console.log('📤 Enviando:', datosAEnviar);

      await agregarAnotacion(datosAEnviar);
      console.log('✅ Observación enviada exitosamente');

      alert('✅ Observación agregada correctamente');
      
      setForm(prev => ({ 
        ...prev, 
        detalle: '',
        estudianteId: '' 
      }));
      
      const nuevasObs = await getObservadorPorCurso(parseInt(cursoId));
      setAnotaciones(nuevasObs || []);
      
    } catch (error) {
      console.error('❌ ERROR COMPLETO:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const cursoActual = cursosOptions.find(c => c.value === cursoId);
  
  const botonHabilitado = !guardando && !!form.estudianteId && !!form.detalle.trim();
  console.log('🔘 Estado del botón:', {
    habilitado: botonHabilitado,
    guardando,
    tieneEstudiante: !!form.estudianteId,
    tieneDetalle: !!form.detalle.trim(),
    form
  });

  return (
    <div className="grid">
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

      {/* 👇 INDICADOR DE CARGA (usa la variable `loading`) */}
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          marginBottom: '1rem',
          color: '#666'
        }}>
          <p>⏳ Cargando datos del curso...</p>
        </div>
      )}

      {/* Mensajes */}
      {mensaje && (
        <div style={{ 
          padding: '0.75rem 1rem',
          backgroundColor: mensaje.includes('✅') ? '#d4edda' : '#f8d7da',
          color: mensaje.includes('✅') ? '#155724' : '#721c24',
          border: '1px solid',
          borderRadius: '6px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {mensaje}
        </div>
      )}

      {/* Selector de curso */}
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

      {/* Historial */}
      <Card title={`Historial - ${cursoActual?.label || 'Curso'}`}>
        {filas.length > 0 ? (
          <Tabla columns={columnas} rows={filas} />
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            <p>No hay observaciones para este curso</p>
          </div>
        )}
      </Card>

      {/* Formulario SÚPER SIMPLE */}
      <Card title="Agregar Nueva Observación">
        <div style={{ display: 'grid', gap: '1rem' }}>
          
          {/* Estudiante */}
          <div>
            <label><strong>Estudiante:</strong></label>
            <select
              value={form.estudianteId}
              onChange={(e) => {
                console.log('👤 Estudiante cambiado a:', e.target.value);
                setForm({ ...form, estudianteId: e.target.value });
              }}
              style={{
                padding: '0.75rem',
                border: '2px solid #ccc',
                borderRadius: '4px',
                width: '100%',
                fontSize: '1rem'
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
            <label><strong>Tipo:</strong></label>
            <select
              value={form.tipo}
              onChange={(e) => {
                console.log('📋 Tipo cambiado a:', e.target.value);
                setForm({ ...form, tipo: e.target.value });
              }}
              style={{
                padding: '0.75rem',
                border: '2px solid #ccc',
                borderRadius: '4px',
                width: '100%',
                fontSize: '1rem'
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
            <label><strong>Detalle:</strong></label>
            <textarea
              rows={4}
              placeholder="Escribe aquí la observación..."
              value={form.detalle}
              onChange={(e) => {
                console.log('📝 Detalle cambiado, longitud:', e.target.value.length);
                setForm({ ...form, detalle: e.target.value });
              }}
              style={{
                padding: '0.75rem',
                border: '2px solid #ccc',
                borderRadius: '4px',
                width: '100%',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          {/* BOTÓN SUPER VISIBLE */}
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={(e) => {
                console.log('🔴🔴🔴 CLICK CAPTURADO!!! 🔴🔴🔴');
                console.log('Event object:', e);
                e.preventDefault();
                e.stopPropagation();
                agregar();
              }}
              disabled={!botonHabilitado}
              style={{
                padding: '1rem 3rem',
                backgroundColor: botonHabilitado ? '#007bff' : '#cccccc',
                color: 'white',
                border: '3px solid ' + (botonHabilitado ? '#0056b3' : '#999'),
                borderRadius: '8px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: botonHabilitado ? 'pointer' : 'not-allowed',
                minWidth: '200px',
                textTransform: 'uppercase'
              }}
            >
              {guardando ? '⏳ Guardando...' : '📝 AGREGAR OBSERVACIÓN'}
            </button>
            
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Estado: <strong>{botonHabilitado ? '🟢 HABILITADO' : '🔴 DESHABILITADO'}</strong>
              <br />
              {!botonHabilitado && (
                <span style={{ color: '#dc3545' }}>
                  Falta: {!form.estudianteId ? 'Estudiante ' : ''}{!form.detalle.trim() ? 'Detalle' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}