import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import SelectSimple from '../../components/SelectSimple';
import CampoNumero from '../../components/CampoNumero';
import Tabla from '../../components/Tabla';
import BarraTitulo from '../../components/BarraTitulo';
import BlurFade from '../../components/BlurFade';
import { getMyCoursesAndSubjects, getEstudiantesPorCurso, getCalificacionesPor, guardarCalificaciones } from '../../services/api';

// Constantes y funciones helper
const PERIODOS = [
  { value: '2025-P1', label: '2025 - Primer Período' },
  { value: '2025-P2', label: '2025 - Segundo Período' },
  { value: '2025-P3', label: '2025 - Tercer Período' },
  { value: '2025-P4', label: '2025 - Cuarto Período' }
];

const MATERIA_MAP = {
  'Matemáticas': 'Matematicas',
  'Lenguaje': 'Lenguaje',
  'Ciencias Naturales': 'Ciencias',
  'Ciencias Sociales': 'Historia',
  'Inglés': 'Ingles',
  'Educación Física': 'Educacion_Fisica'
};

const mapMateriaALegacy = (materiaNombre) => MATERIA_MAP[materiaNombre] || materiaNombre;

const _procesarAsignacionesAcademicas = (data) => {
  return data.map(item => ({
    id: item.curso_id,
    nombre: item.curso_nombre,
    nivel: item.curso_nivel,
    letra: item.curso_letra
  }));
};

const _obtenerAsignaturasDelCurso = (cursoSeleccionado, asignacionAcademica) => {
  const cursoAsig = asignacionAcademica.find(c => c.curso_id.toString() === cursoSeleccionado);
  if (!cursoAsig?.materias) return [];
  return cursoAsig.materias.map(m => ({
    value: mapMateriaALegacy(m.materia_nombre),
    label: m.materia_nombre
  }));
};

const _combinarEstudiantesConCalificaciones = (estudiantes, califs) => {
  const califMap = {};
  califs.forEach(c => {
    califMap[c.estudiante_id] = c;
  });
  
  return estudiantes.map(e => ({
    ...e,
    nota: califMap[e.id]?.nota || '',
    calificacion_id: califMap[e.id]?.id || null
  }));
};

const _crearCalificacionesParaGuardar = (calificaciones, asignaturaSeleccionada, periodoSeleccionado) => {
  return calificaciones
    .filter(est => est.nota !== '' && est.nota >= 0 && est.nota <= 5)
    .map(est => ({
      estudianteId: est.id,
      asignatura: asignaturaSeleccionada,
      periodo: periodoSeleccionado,
      nota: parseFloat(est.nota)
    }));
};

const _validarNotaChange = (valor) => {
  return valor === '' || (!isNaN(valor) && valor >= 0 && valor <= 5);
};

const _buildColumnas = (handleNotaChange) => [
  { 
    key: 'nombre', 
    label: 'Estudiante',
    render: (valor, fila) => (
      <div>
        <strong>{valor}</strong>
        <br />
        <small style={{ color: '#666' }}>{fila.curso_nombre}</small>
      </div>
    )
  },
  {
    key: 'nota',
    label: 'Nota (0.0 - 5.0)',
    render: (valor, fila) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <CampoNumero
          value={valor}
          onChange={(v) => handleNotaChange(fila.id, v)}
          min={0}
          max={5}
          paso={0.1}
        />
        {valor !== '' && (
          <span style={{ 
            color: valor >= 3.0 ? '#28a745' : '#dc3545',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            {valor >= 3.0 ? '✅' : '❌'}
          </span>
        )}
      </div>
    )
  }
];

function EstadisticasCalificaciones({ totalEstudiantes, estudiantesConNota, promedioGeneral }) {
  return (
    <BlurFade delay={0.18} duration={0.4}>
      <Card>
        <div className="grid grid-4" style={{ textAlign: 'center', gap: '1rem' }}>
          <div>
            <strong style={{ color: 'var(--brand)', fontSize: '1.5rem' }}>{totalEstudiantes}</strong>
            <br />
            <small>Total Estudiantes</small>
          </div>
          <div>
            <strong style={{ color: '#007bff', fontSize: '1.5rem' }}>{estudiantesConNota}</strong>
            <br />
            <small>Con Calificación</small>
          </div>
          <div>
            <strong style={{ color: estudiantesConNota > 0 ? '#28a745' : '#6c757d', fontSize: '1.5rem' }}>
              {estudiantesConNota > 0 ? promedioGeneral : '--'}
            </strong>
            <br />
            <small>Promedio General</small>
          </div>
          <div>
            <strong style={{ color: '#ffc107', fontSize: '1.5rem' }}>
              {totalEstudiantes > 0 ? Math.round((estudiantesConNota / totalEstudiantes) * 100) : 0}%
            </strong>
            <br />
            <small>Progreso</small>
          </div>
        </div>
      </Card>
    </BlurFade>
  );
}

function CalificacionesFiltros({
  cursoSeleccionado,
  setCursoSeleccionado,
  cursos,
  asignaturaSeleccionada,
  setAsignaturaSeleccionada,
  asignaturas,
  periodoSeleccionado,
  setPeriodoSeleccionado
}) {
  return (
    <BlurFade delay={0.12} duration={0.35}>
      <Card title="Filtros">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <SelectSimple
            etiqueta="Curso"
            value={cursoSeleccionado}
            onChange={(valor) => {
              console.log('Curso seleccionado:', valor);
              setCursoSeleccionado(valor);
            }}
            options={cursos.map(c => ({ value: c.id.toString(), label: c.nombre }))}
          />
          <SelectSimple
            etiqueta="Asignatura"
            value={asignaturaSeleccionada}
            onChange={(valor) => {
              console.log('Asignatura seleccionada:', valor);
              setAsignaturaSeleccionada(valor);
            }}
            options={asignaturas}
          />
          <SelectSimple
            etiqueta="Período"
            value={periodoSeleccionado}
            onChange={(valor) => {
              console.log('Periodo seleccionado:', valor);
              setPeriodoSeleccionado(valor);
            }}
            options={PERIODOS}
          />
        </div>
      </Card>
    </BlurFade>
  );
}

function CalificacionesContenido({
  loading,
  calificaciones,
  cursoActual,
  columnas,
  guardando,
  handleGuardar
}) {
  const calificacionesConNota = calificaciones.filter(e => e.nota !== '').length;

  if (loading) {
    return (
      <BlurFade delay={0.2} duration={0.3}>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
            <p>Cargando estudiantes...</p>
          </div>
        </Card>
      </BlurFade>
    );
  }

  if (calificaciones.length > 0) {
    return (
      <BlurFade delay={0.24} duration={0.45}>
        <Card title={`Estudiantes de ${cursoActual?.nombre || 'Curso'}`}>
          <Tabla
            columns={columnas}
            rows={calificaciones}
          />
        </Card>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            💡 Rango de notas: 0.0 a 5.0 | Nota mínima aprobatoria: 3.0
          </div>
          <button
            onClick={handleGuardar}
            disabled={guardando || calificacionesConNota === 0}
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
            {guardando ? '💾 Guardando...' : `💾 Guardar ${calificacionesConNota} Calificaciones`}
          </button>
        </div>
      </BlurFade>
    );
  }

  return (
    <BlurFade delay={0.2} duration={0.3}>
      <Card>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <p>No hay estudiantes en este curso</p>
          <small>Selecciona un curso diferente o verifica que tenga estudiantes asignados</small>
        </div>
      </Card>
    </BlurFade>
  );
}

export default function RegistroCalificaciones() {
  const [asignacionAcademica, setAsignacionAcademica] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [calificaciones, setCalificaciones] = useState([]); 
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [asignaturas, setAsignaturas] = useState([]);
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState('');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('2025-P3');
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Cargar carga académica al montar
  useEffect(() => {
    const cargarCargaAcademica = async () => {
      try {
        const data = await getMyCoursesAndSubjects();
        console.log('Carga académica cargada:', data);
        setAsignacionAcademica(data);
        
        const cursosMapeados = _procesarAsignacionesAcademicas(data);
        setCursos(cursosMapeados);
        if (data.length > 0) {
          setCursoSeleccionado(data[0].curso_id.toString());
        }
      } catch (error) {
        console.error('Error al cargar carga académica:', error);
        setMensaje('❌ Error al cargar la carga académica');
      }
    };
    cargarCargaAcademica();
  }, []);

  // Actualizar asignaturas dinámicamente cuando cambie el curso seleccionado
  useEffect(() => {
    if (!cursoSeleccionado || asignacionAcademica.length === 0) return;
    
    const asignaturasMapeadas = _obtenerAsignaturasDelCurso(cursoSeleccionado, asignacionAcademica);
    setAsignaturas(asignaturasMapeadas);
    
    if (asignaturasMapeadas.length > 0) {
      const existeActual = asignaturasMapeadas.some(a => a.value === asignaturaSeleccionada);
      if (!existeActual) {
        setAsignaturaSeleccionada(asignaturasMapeadas[0].value);
      }
    } else {
      setAsignaturas([]);
      setAsignaturaSeleccionada('');
    }
  }, [cursoSeleccionado, asignacionAcademica]);

  // ✅ Función separada para cargar datos
  const cargarEstudiantesYCalif = async () => {
    if (!cursoSeleccionado || !asignaturaSeleccionada) return;
    
    setLoading(true);
    setMensaje('');
    
    try {
      console.log('Cargando estudiantes y calificaciones...');
      
      const estudiantes = await getEstudiantesPorCurso(parseInt(cursoSeleccionado));
      console.log('Estudiantes del curso:', estudiantes);

      const califs = await getCalificacionesPor({
        cursoId: parseInt(cursoSeleccionado),
        asignatura: asignaturaSeleccionada,
        periodo: periodoSeleccionado
      });
      console.log('Calificaciones encontradas:', califs);

      const estudiantesConCalif = _combinarEstudiantesConCalificaciones(estudiantes, califs);
      console.log('Estudiantes con calificaciones:', estudiantesConCalif);
      setCalificaciones(estudiantesConCalif);
    } catch (error) {
      console.error('Error:', error);
      setCalificaciones([]);
      setMensaje('❌ Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstudiantesYCalif();
  }, [cursoSeleccionado, asignaturaSeleccionada, periodoSeleccionado]);

  const handleNotaChange = (estudianteId, valor) => {
    if (!_validarNotaChange(valor)) return;
    
    setCalificaciones(prev =>
      prev.map(est =>
        est.id === estudianteId ? { ...est, nota: valor } : est
      )
    );
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setMensaje('');
    
    try {
      const nuevas = _crearCalificacionesParaGuardar(calificaciones, asignaturaSeleccionada, periodoSeleccionado);

      if (nuevas.length === 0) {
        setMensaje('⚠️ No hay calificaciones válidas para guardar');
        return;
      }

      console.log('Guardando calificaciones:', nuevas);
      await guardarCalificaciones(nuevas);
      
      setMensaje('✅ Calificaciones guardadas correctamente');
      
      setTimeout(() => {
        cargarEstudiantesYCalif();
        setMensaje('');
      }, 1500);
      
    } catch (error) {
      console.error('Error al guardar:', error);
      setMensaje('❌ Error al guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const columnas = _buildColumnas(handleNotaChange);

  const cursoActual = cursos.find(c => c.id.toString() === cursoSeleccionado);
  const totalEstudiantes = calificaciones.length;
  const estudiantesConNota = calificaciones.filter(e => e.nota !== '').length;
  const promedioGeneral = calificaciones.length > 0 
    ? (calificaciones.filter(e => e.nota !== '').reduce((sum, e) => sum + parseFloat(e.nota || 0), 0) / estudiantesConNota).toFixed(2)
    : '0.00';

  return (
    <div className="grid">
      <BlurFade delay={0.05} duration={0.3}>
        <BarraTitulo 
          titulo="Gestión de Calificaciones"
          subtitulo="Registrar y actualizar notas de estudiantes"
          derecha={
            <div style={{ fontSize: '0.9rem', textAlign: 'right', color: '#666' }}>
              {cursoActual && (
                <>
                  <div><strong>{cursoActual.nombre}</strong></div>
                  <div>{asignaturaSeleccionada} - {periodoSeleccionado}</div>
                </>
              )}
            </div>
          }
        />
      </BlurFade>

      {/* Mostrar mensajes de estado */}
      {mensaje && (
        <BlurFade delay={0.1} duration={0.25}>
          <div style={{ 
            padding: '0.75rem 1rem',
            backgroundColor: mensaje.includes('✅') ? '#d4edda' : mensaje.includes('⚠️') ? '#fff3cd' : '#f8d7da',
            color: mensaje.includes('✅') ? '#155724' : mensaje.includes('⚠️') ? '#856404' : '#721c24',
            border: '1px solid',
            borderColor: mensaje.includes('✅') ? '#c3e6cb' : mensaje.includes('⚠️') ? '#ffeaa7' : '#f5c6cb',
            borderRadius: '6px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {mensaje}
          </div>
        </BlurFade>
      )}

      {/* Filtros */}
      <CalificacionesFiltros
        cursoSeleccionado={cursoSeleccionado}
        setCursoSeleccionado={setCursoSeleccionado}
        cursos={cursos}
        asignaturaSeleccionada={asignaturaSeleccionada}
        setAsignaturaSeleccionada={setAsignaturaSeleccionada}
        asignaturas={asignaturas}
        periodoSeleccionado={periodoSeleccionado}
        setPeriodoSeleccionado={setPeriodoSeleccionado}
      />

      {/* Estadísticas */}
      {calificaciones.length > 0 && !loading && (
        <EstadisticasCalificaciones 
          totalEstudiantes={totalEstudiantes}
          estudiantesConNota={estudiantesConNota}
          promedioGeneral={promedioGeneral}
        />
      )}

      {/* Tabla de calificaciones */}
      <CalificacionesContenido
        loading={loading}
        calificaciones={calificaciones}
        cursoActual={cursoActual}
        columnas={columnas}
        guardando={guardando}
        handleGuardar={handleGuardar}
      />
    </div>
  );
}
