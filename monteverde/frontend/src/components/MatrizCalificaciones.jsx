import { useRef, useCallback } from 'react';
import { ClipboardList, Lightbulb } from 'lucide-react';

/**
 * MatrizCalificaciones
 * Tabla tipo Excel totalmente dinámica para ingresar notas de estudiantes por indicador de logro.
 * Se adapta automáticamente a cualquier cantidad de indicadores, notas parciales y escala configurada.
 *
 * Props:
 *  - estudiantes: [{estudiante_id, estudiante_nombre, indicadores: [{indicador_id, numero, descripcion, notas, promedio}], definitiva}]
 *  - configuracion: { notas_por_indicador, escala: { min, max, aprobacion, tipo } }
 *  - onNotaChange: (estudianteId, indicadorId, numeroNota, valor) => void
 *  - loading: bool
 */

export default function MatrizCalificaciones({
  estudiantes,
  configuracion,
  onNotaChange,
  loading
}) {
  const cellRefs = useRef({});

  // Extraer parámetros dinámicos de configuración con valores por defecto resilientes
  const notasPorIndicador = configuracion?.notas_por_indicador || 3;
  const escalaMin = configuracion?.escala?.min ?? 1.0;
  const escalaMax = configuracion?.escala?.max ?? 5.0;
  const notaAprobatoria = configuracion?.escala?.aprobacion ?? 3.0;
  const pasoStep = escalaMax > 10 ? 1 : 0.1;

  const colorNota = (nota) => {
    if (nota === null || nota === undefined || nota === '') return '';
    const n = parseFloat(nota);
    if (isNaN(n)) return 'nota-invalida';
    if (n >= notaAprobatoria) return 'nota-aprobada';
    return 'nota-reprobada';
  };

  const colorDefinitiva = (nota) => {
    if (nota === null || nota === undefined) return '';
    return nota >= notaAprobatoria ? 'definitiva-aprobada' : 'definitiva-reprobada';
  };

  const formatNota = (nota) => {
    if (nota === null || nota === undefined || nota === '') return '—';
    const num = parseFloat(nota);
    return isNaN(num) ? '—' : (escalaMax > 10 ? num.toFixed(1) : num.toFixed(2));
  };

  // Construir lista plana de IDs de celdas para navegación con Tab/Enter
  const getCellIds = useCallback(() => {
    if (!estudiantes?.length) return [];
    const ids = [];
    const listaNotas = Array.from({ length: notasPorIndicador }, (_, i) => i + 1);
    estudiantes.forEach(est => {
      (est.indicadores || []).forEach(ind => {
        listaNotas.forEach(n => {
          ids.push(`${est.estudiante_id}-${ind.indicador_id}-${n}`);
        });
      });
    });
    return ids;
  }, [estudiantes, notasPorIndicador]);

  const handleKeyDown = useCallback((e, currentId) => {
    if (e.key !== 'Tab' && e.key !== 'Enter') return;
    e.preventDefault();

    const ids = getCellIds();
    const idx = ids.indexOf(currentId);
    let nextIdx;

    if (e.shiftKey && e.key === 'Tab') {
      nextIdx = idx - 1;
    } else {
      nextIdx = idx + 1;
    }

    if (nextIdx >= 0 && nextIdx < ids.length) {
      const nextRef = cellRefs.current[ids[nextIdx]];
      nextRef?.focus();
    }
  }, [getCellIds]);

  if (loading) {
    return (
      <div className="matriz-loading">
        <div className="spinner-ring" />
        <p>Cargando estudiantes...</p>
      </div>
    );
  }

  if (!estudiantes?.length) {
    return (
      <div className="matriz-empty">
        <div className="matriz-empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <ClipboardList size={44} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />
        </div>
        <p>No hay estudiantes en este curso.</p>
      </div>
    );
  }

  const indicadoresRef = estudiantes[0]?.indicadores || [];
  const numIndicadores = indicadoresRef.length;
  const listaIndicesNotas = Array.from({ length: notasPorIndicador }, (_, i) => i + 1);

  // Calcular progreso dinámico
  const totalCeldas = estudiantes.length * numIndicadores * notasPorIndicador;
  const celdasLlenas = estudiantes.reduce((acc, est) =>
    acc + (est.indicadores || []).reduce((a2, ind) =>
      a2 + listaIndicesNotas.filter(n => {
        const val = ind.notas ? ind.notas[n] : ind[`nota_${n}`];
        return val !== null && val !== undefined && val !== '';
      }).length
    , 0)
  , 0);
  const progreso = totalCeldas > 0 ? Math.round((celdasLlenas / totalCeldas) * 100) : 0;

  return (
    <div className="matriz-wrapper">
      {/* Barra de progreso */}
      <div className="matriz-progreso">
        <div className="progreso-label">
          Progreso: <strong>{celdasLlenas}</strong> / {totalCeldas} notas ingresadas
          <span className="progreso-pct">{progreso}%</span>
        </div>
        <div className="progreso-bar">
          <div className="progreso-fill" style={{ width: `${progreso}%` }} />
        </div>
      </div>

      {/* Tabla principal */}
      <div className="matriz-scroll">
        <table className="matriz-tabla" role="grid">
          <colgroup>
            <col className="col-estudiante" />
            {indicadoresRef.map((ind) => (
              <span key={`cg-ind-${ind.indicador_id}`} style={{ display: 'contents' }}>
                {listaIndicesNotas.map((n) => (
                  <col key={`col-n${n}-${ind.indicador_id}`} className="col-nota" />
                ))}
                <col key={`col-prom-${ind.indicador_id}`} className="col-promedio" />
              </span>
            ))}
            <col className="col-definitiva" />
          </colgroup>

          <thead>
            {/* Fila 1: Nombres de indicadores (agrupados con colSpan dinámico) */}
            <tr>
              <th className="th-estudiante" rowSpan={2}>Estudiante</th>
              {indicadoresRef.map((ind) => (
                <th
                  key={`th-ind-${ind.indicador_id}`}
                  colSpan={notasPorIndicador + 1}
                  className={`th-indicador th-indicador--${ind.numero}`}
                  title={ind.descripcion}
                >
                  <span className="th-ind-badge">{ind.numero}</span>
                  <span className="th-ind-desc">{ind.descripcion}</span>
                </th>
              ))}
              <th className="th-definitiva" rowSpan={2}>Definitiva</th>
            </tr>

            {/* Fila 2: Subcolumnas dinámicas por nota */}
            <tr>
              {indicadoresRef.map((ind) => (
                <span key={`subcols-${ind.indicador_id}`} style={{ display: 'contents' }}>
                  {listaIndicesNotas.map((n) => (
                    <th key={`sub-n${n}-${ind.indicador_id}`} className="th-sub">
                      Nota {n}
                    </th>
                  ))}
                  <th key={`sub-prom-${ind.indicador_id}`} className="th-sub th-sub-prom">
                    Promedio
                  </th>
                </span>
              ))}
            </tr>
          </thead>

          <tbody>
            {estudiantes.map((est, rowIdx) => (
              <tr key={est.estudiante_id} className={rowIdx % 2 === 0 ? 'fila-par' : 'fila-impar'}>
                {/* Nombre estudiante */}
                <td className="celda-estudiante">
                  <span className="est-nombre">{est.estudiante_nombre}</span>
                </td>

                {/* Notas por indicador */}
                {(est.indicadores || []).map((ind) => {
                  const tieneAlgunaNota = listaIndicesNotas.some(n => {
                    const v = ind.notas ? ind.notas[n] : ind[`nota_${n}`];
                    return v !== null && v !== undefined && v !== '';
                  });
                  const pendiente = !tieneAlgunaNota;

                  return (
                    <span key={`row-ind-${est.estudiante_id}-${ind.indicador_id}`} style={{ display: 'contents' }}>
                      {listaIndicesNotas.map((n) => {
                        const cellId = `${est.estudiante_id}-${ind.indicador_id}-${n}`;
                        const rawVal = ind.notas ? ind.notas[n] : ind[`nota_${n}`];
                        const val = rawVal ?? '';

                        const isInvalid =
                          val !== '' &&
                          val !== null &&
                          val !== undefined &&
                          (isNaN(parseFloat(val)) || parseFloat(val) < escalaMin || parseFloat(val) > escalaMax);

                        return (
                          <td
                            key={cellId}
                            className={`celda-nota ${pendiente && !val ? 'celda-pendiente' : ''} ${isInvalid ? 'celda-invalida' : ''}`}
                          >
                            <input
                              ref={el => (cellRefs.current[cellId] = el)}
                              type="number"
                              className={`input-nota ${colorNota(val)}`}
                              value={val}
                              min={escalaMin}
                              max={escalaMax}
                              step={pasoStep}
                              onChange={e => onNotaChange(est.estudiante_id, ind.indicador_id, n, e.target.value)}
                              onKeyDown={e => handleKeyDown(e, cellId)}
                              onFocus={e => e.target.select()}
                              placeholder="—"
                              aria-label={`Nota ${n} (${escalaMin}–${escalaMax})`}
                            />
                            {isInvalid && (
                              <span className="nota-error-tooltip" title={`Rango permitido: ${escalaMin} a ${escalaMax}`}>!</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Promedio indicador (calculado) */}
                      <td key={`prom-${ind.indicador_id}`} className={`celda-promedio ${colorNota(ind.promedio)}`}>
                        <span className="prom-valor">{formatNota(ind.promedio)}</span>
                      </td>
                    </span>
                  );
                })}

                {/* Definitiva */}
                <td className={`celda-definitiva ${colorDefinitiva(est.definitiva)}`}>
                  <span className="def-valor">{formatNota(est.definitiva)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="matriz-leyenda">
        <span className="leyenda-item"><span className="dot dot-verde" />≥ {notaAprobatoria} aprobado</span>
        <span className="leyenda-item"><span className="dot dot-rojo" />&lt; {notaAprobatoria} reprobado</span>
        <span className="leyenda-item"><span className="dot dot-pendiente" />Pendiente</span>
        <span className="leyenda-sep">|</span>
        <span className="leyenda-tip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Lightbulb size={13} style={{ color: 'var(--brand)' }} />
          <span>Navega con <kbd>Tab</kbd> / <kbd>Enter</kbd> entre celdas · Escala: {escalaMin} a {escalaMax}</span>
        </span>
      </div>
    </div>
  );
}
