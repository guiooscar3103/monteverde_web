import { useEffect, useMemo, useState } from 'react';
import Tabla from '../../components/Tabla';
import SelectSimple from '../../components/SelectSimple';
import BarraTitulo from '../../components/BarraTitulo';
import Card from '../../components/Card';
import {
  getCursos,
  getEstudiantesPorCurso,
  getAsistenciaPorFecha,
  guardarAsistencia,
  getEstadisticasAsistencia
} from '../../services/api';

const ESTADOS = [
  { value: 'PRESENTE', label: 'Presente', color: '#28a745', icon: '✅' },
  { value: 'AUSENTE', label: 'Ausente', color: '#dc3545', icon: '❌' },
  { value: 'TARDE', label: 'Tarde', color: '#ffc107', icon: '⏰' },
  { value: 'JUSTIFICADO', label: 'Justificado', color: '#17a2b8', icon: '📝' }
];

export default function Asistencia() {
  const [cursoId, setCursoId] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [estudiantes, setEstudiantes] = useState([]);
  const [marcas, setMarcas] = useState([]); // {estudianteId, fecha, estado}
  const [cursosOptions, setCursosOptions] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Cargar cursos al montar
  useEffect(() => {
    const cargarCursos = async () => {
      try {
        const cursos = await getCursos();
        console.log('Cursos cargados:', cursos);
        setCursosOptions(cursos.map(c => ({ value: c.id.toString(), label: c.nombre })));
        if (cursos.length > 0) setCursoId(cursos[0].id.toString());
      } catch (error) {
        console.error('Error al cargar cursos:', error);
        setMensaje('❌ Error al cargar cursos');
      }
    };
    cargarCursos();
  }, []);

  // Cargar estudiantes y asistencia cuando cambien cursoId o fecha
  useEffect(() => {
    if (!cursoId || !fecha) {
      setEstudiantes([]);
      setMarcas([]);
      setEstadisticas(null);
      return;
    }

    const cargarAsistencia = async () => {
      setLoading(true);
      setMensaje('');
      try {
        const [est, lista, stats] = await Promise.all([
          getEstudiantesPorCurso(parseInt(cursoId)),
          getAsistenciaPorFecha({ cursoId: parseInt(cursoId), fecha }),
          getEstadisticasAsistencia({ cursoId: parseInt(cursoId), fecha }).catch(() => null)
        ]);

        console.log('Estudiantes del curso:', est);
        console.log('Asistencia existente:', lista);
        console.log('Estadísticas:', stats);

        setEstudiantes(est);
        setEstadisticas(stats);

        const mapa = new Map(lista.map(a => [a.estudianteId, a.estado]));
        const marcasIniciales = est.map(e => ({
          estudianteId: e.id,
          fecha,
          estado: mapa.get(e.id) || 'PRESENTE'
        }));
        setMarcas(marcasIniciales);
      } catch (error) {
        console.error('Error al cargar asistencia:', error);
        setMensaje('❌ Error al cargar los datos de asistencia: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarAsistencia();
  }, [cursoId, fecha]);

  // Columnas de la tabla
  const columnas = useMemo(() => [
    { 
      key: 'nombre', 
      header: 'Estudiante',
      render: (valor, fila) => (
        <div>
          <strong>{valor}</strong>
          <br />
          <small style={{ color: '#666' }}>{fila.curso_nombre}</small>
        </div>
      )
    },
    {
      key: 'estado',
      header: 'Estado de Asistencia',
      render: (valor, fila) => {
        if (!fila || !fila.id) return null;

        const idx = marcas.findIndex(m => m.estudianteId === fila.id);
        if (idx === -1) return null;

        const estadoActual = marcas[idx]?.estado;
        const estadoConfig = ESTADOS.find(e => e.value === estadoActual);

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={estadoActual}
              onChange={(e) => {
                const nuevasMarcas = [...marcas];
                nuevasMarcas[idx] = { ...nuevasMarcas[idx], estado: e.target.value };
                setMarcas(nuevasMarcas);
              }}
              disabled={loading || guardando}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #ccc',
                fontSize: '1rem',
                minWidth: '140px',
                backgroundColor: estadoConfig?.color + '20' || '#fff'
              }}
            >
              {ESTADOS.map(es => (
                <option key={es.value} value={es.value}>
                  {es.icon} {es.label}
                </option>
              ))}
            </select>
            {estadoConfig && (
              <span style={{ color: estadoConfig.color, fontSize: '1.2rem' }}>
                {estadoConfig.icon}
              </span>
            )}
          </div>
        );
      }
    }
  ], [marcas, loading, guardando]);

  const filas = useMemo(() => {
    return estudiantes.map(e => {
      const marca = marcas.find(m => m.estudianteId === e.id);
      return {
        id: e.id,
        nombre: e.nombre,
        curso_nombre: e.curso_nombre,
        estado: marca?.estado || 'PRESENTE'
      };
    });
  }, [estudiantes, marcas]);

  const handleGuardar = async () => {
    setGuardando(true);
    setMensaje('');
    try {
      const resultado = await guardarAsistencia(marcas);
      if (resultado) {
        setMensaje('✅ Asistencia guardada correctamente');
        // Recargar estadísticas después de guardar
        setTimeout(async () => {
          try {
            const stats = await getEstadisticasAsistencia({ cursoId: parseInt(cursoId), fecha });
            setEstadisticas(stats);
            setMensaje('');
          } catch (error) {
            // 🔧 Usamos `error` para evitar el warning no-unused-vars
            console.warn('No se pudieron cargar las estadísticas actualizadas:', error);
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Error al guardar asistencia:', error);
      setMensaje('❌ Error al guardar asistencia: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const cursoActual = cursosOptions.find(c => c.value === cursoId);
  const fechaFormateada = new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="grid">
      <BarraTitulo 
        titulo="Control de Asistencia" 
        subtitulo="Registrar asistencia diaria de estudiantes"
        derecha={
          <div style={{ fontSize: '0.9rem', textAlign: 'right', color: '#666' }}>
            {cursoActual && (
              <>
                <div><strong>{cursoActual.label}</strong></div>
                <div>{fechaFormateada}</div>
              </>
            )}
          </div>
        }
      />

      {mensaje && (
        <div style={{ 
          padding: '0.75rem 1rem',
          backgroundColor: mensaje.includes('✅') ? '#d4edda' : '#f8d7da',
          color: mensaje.includes('✅') ? '#155724' : '#721c24',
          border: '1px solid',
          borderColor: mensaje.includes('✅') ? '#c3e6cb' : '#f5c6cb',
          borderRadius: '6px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {mensaje}
        </div>
      )}

      <Card title="Filtros">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
          <SelectSimple
            value={cursoId}
            onChange={setCursoId}
            options={cursosOptions}
            etiqueta="Curso"
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={loading}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #ccc',
                fontSize: '1rem',
                width: '160px'
              }}
            />
          </div>

          <button
            onClick={handleGuardar}
            disabled={loading || guardando || marcas.length === 0}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: guardando ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: guardando ? 'not-allowed' : 'pointer',
              opacity: guardando ? 0.7 : 1
            }}
          >
            {guardando ? '💾 Guardando...' : `💾 Guardar Asistencia (${marcas.length})`}
          </button>
        </div>
      </Card>

      {estadisticas && (
        <Card title="Resumen del Día">
          <div className="grid grid-4" style={{ textAlign: 'center', gap: '1rem' }}>
            <div>
              <strong style={{ color: '#28a745', fontSize: '1.5rem' }}>
                {estadisticas.por_estado.PRESENTE || 0}
              </strong>
              <br />
              <small>✅ Presentes</small>
            </div>
            <div>
              <strong style={{ color: '#dc3545', fontSize: '1.5rem' }}>
                {estadisticas.por_estado.AUSENTE || 0}
              </strong>
              <br />
              <small>❌ Ausentes</small>
            </div>
            <div>
              <strong style={{ color: '#ffc107', fontSize: '1.5rem' }}>
                {estadisticas.por_estado.TARDE || 0}
              </strong>
              <br />
              <small>⏰ Tarde</small>
            </div>
            <div>
              <strong style={{ color: '#17a2b8', fontSize: '1.5rem' }}>
                {estadisticas.por_estado.JUSTIFICADO || 0}
              </strong>
              <br />
              <small>📝 Justificado</small>
            </div>
          </div>
          
          <div style={{ 
            marginTop: '1rem', 
            textAlign: 'center', 
            padding: '0.5rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px'
          }}>
            <strong>
              Total: {estadisticas.registrados} / {estadisticas.total_estudiantes} estudiantes
            </strong>
            {estadisticas.pendientes > 0 && (
              <span style={{ color: '#dc3545', marginLeft: '1rem' }}>
                ({estadisticas.pendientes} pendientes)
              </span>
            )}
          </div>
        </Card>
      )}

      {loading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
            <p>Cargando estudiantes...</p>
          </div>
        </Card>
      ) : estudiantes.length > 0 ? (
        <Card title={`Lista de Asistencia - ${cursoActual?.label || 'Curso'}`}>
          <Tabla columns={columnas} rows={filas} />
          <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
            💡 Selecciona el estado de asistencia para cada estudiante y haz clic en "Guardar Asistencia"
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <p>No hay estudiantes en este curso</p>
            <small>Selecciona un curso diferente o verifica que tenga estudiantes asignados</small>
          </div>
        </Card>
      )}
    </div>
  );
}
