import { useRef, useCallback } from 'react';

/**
 * MatrizCalificaciones
 * Tabla tipo Excel para ingresar notas de estudiantes por indicador de logro.
 *
 * Props:
 *  - estudiantes: [{estudiante_id, estudiante_nombre, indicadores: [{indicador_id, numero, descripcion, nota_1..3, promedio}], definitiva}]
 *  - onNotaChange: (estudianteId, indicadorId, numeroNota, valor) => void
 *  - loading: bool
 */

const RANGO_MIN = 0.0;
const RANGO_MAX = 5.0;
const APROBATORIO = 3.0;

function colorNota(nota) {
  if (nota === null || nota === undefined || nota === '') return '';
  const n = parseFloat(nota);
  if (isNaN(n)) return 'nota-invalida';
  if (n >= APROBATORIO) return 'nota-aprobada';
  return 'nota-reprobada';
}

function colorDefinitiva(nota) {
  if (nota === null || nota === undefined) return '';
  return nota >= APROBATORIO ? 'definitiva-aprobada' : 'definitiva-reprobada';
}

function formatNota(nota) {
  if (nota === null || nota === undefined || nota === '') return '—';
  return parseFloat(nota).toFixed(2);
}

function CeldaNota({ value, onChange, onKeyDown, cellRef, pendiente }) {
  const isInvalid =
    value !== '' &&
    value !== null &&
    value !== undefined &&
    (isNaN(parseFloat(value)) || parseFloat(value) < RANGO_MIN || parseFloat(value) > RANGO_MAX);

  return (
    <td className={`celda-nota ${pendiente && !value ? 'celda-pendiente' : ''} ${isInvalid ? 'celda-invalida' : ''}`}>
      <input
        ref={cellRef}
        type="number"
        className={`input-nota ${colorNota(value)}`}
        value={value ?? ''}
        min={RANGO_MIN}
        max={RANGO_MAX}
        step={0.1}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={e => e.target.select()}
        placeholder="—"
        aria-label={`Nota (${RANGO_MIN}–${RANGO_MAX})`}
      />
      {isInvalid && (
        <span className="nota-error-tooltip" title={`Rango: ${RANGO_MIN} a ${RANGO_MAX}`}>!</span>
      )}
    </td>
  );
}

export default function MatrizCalificaciones({ estudiantes, onNotaChange, loading }) {
  const cellRefs = useRef({});

  // Construir lista plana de IDs de celdas para navegación con Tab/Enter
  const getCellIds = useCallback(() => {
    if (!estudiantes?.length) return [];
    const ids = [];
    estudiantes.forEach(est => {
      est.indicadores.forEach(ind => {
        [1, 2, 3].forEach(n => {
          ids.push(`${est.estudiante_id}-${ind.indicador_id}-${n}`);
        });
      });
    });
    return ids;
  }, [estudiantes]);

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
        <div className="matriz-empty-icon">📋</div>
        <p>No hay estudiantes en este curso.</p>
      </div>
    );
  }

  const indicadoresRef = estudiantes[0]?.indicadores || [];
  const numIndicadores = indicadoresRef.length;

  // Calcular progreso
  const totalCeldas = estudiantes.length * numIndicadores * 3;
  const celdasLlenas = estudiantes.reduce((acc, est) =>
    acc + est.indicadores.reduce((a2, ind) =>
      a2 + [ind.nota_1, ind.nota_2, ind.nota_3].filter(n => n !== null && n !== undefined && n !== '').length
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
              <>
                <col key={`col-n1-${ind.indicador_id}`} className="col-nota" />
                <col key={`col-n2-${ind.indicador_id}`} className="col-nota" />
                <col key={`col-n3-${ind.indicador_id}`} className="col-nota" />
                <col key={`col-prom-${ind.indicador_id}`} className="col-promedio" />
              </>
            ))}
            <col className="col-definitiva" />
          </colgroup>

          <thead>
            {/* Fila 1: Nombres de indicadores (agrupados) */}
            <tr>
              <th className="th-estudiante" rowSpan={2}>Estudiante</th>
              {indicadoresRef.map((ind) => (
                <th
                  key={`th-ind-${ind.indicador_id}`}
                  colSpan={4}
                  className={`th-indicador th-indicador--${ind.numero}`}
                  title={ind.descripcion}
                >
                  <span className="th-ind-badge">{ind.numero}</span>
                  <span className="th-ind-desc">{ind.descripcion}</span>
                </th>
              ))}
              <th className="th-definitiva" rowSpan={2}>Definitiva</th>
            </tr>

            {/* Fila 2: Subcolumnas */}
            <tr>
              {indicadoresRef.map((ind) => (
                <>
                  <th key={`sub-n1-${ind.indicador_id}`} className="th-sub">Nota 1</th>
                  <th key={`sub-n2-${ind.indicador_id}`} className="th-sub">Nota 2</th>
                  <th key={`sub-n3-${ind.indicador_id}`} className="th-sub">Nota 3</th>
                  <th key={`sub-prom-${ind.indicador_id}`} className="th-sub th-sub-prom">Promedio</th>
                </>
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
                {est.indicadores.map((ind) => {
                  const cellId1 = `${est.estudiante_id}-${ind.indicador_id}-1`;
                  const cellId2 = `${est.estudiante_id}-${ind.indicador_id}-2`;
                  const cellId3 = `${est.estudiante_id}-${ind.indicador_id}-3`;
                  const pendiente = ind.nota_1 === null && ind.nota_2 === null && ind.nota_3 === null;

                  return (
                    <>
                      <CeldaNota
                        key={cellId1}
                        value={ind.nota_1 ?? ''}
                        cellRef={el => (cellRefs.current[cellId1] = el)}
                        pendiente={pendiente}
                        onChange={v => onNotaChange(est.estudiante_id, ind.indicador_id, 1, v)}
                        onKeyDown={e => handleKeyDown(e, cellId1)}
                      />
                      <CeldaNota
                        key={cellId2}
                        value={ind.nota_2 ?? ''}
                        cellRef={el => (cellRefs.current[cellId2] = el)}
                        pendiente={pendiente}
                        onChange={v => onNotaChange(est.estudiante_id, ind.indicador_id, 2, v)}
                        onKeyDown={e => handleKeyDown(e, cellId2)}
                      />
                      <CeldaNota
                        key={cellId3}
                        value={ind.nota_3 ?? ''}
                        cellRef={el => (cellRefs.current[cellId3] = el)}
                        pendiente={pendiente}
                        onChange={v => onNotaChange(est.estudiante_id, ind.indicador_id, 3, v)}
                        onKeyDown={e => handleKeyDown(e, cellId3)}
                      />
                      {/* Promedio indicador (calculado) */}
                      <td key={`prom-${ind.indicador_id}`} className={`celda-promedio ${colorNota(ind.promedio)}`}>
                        <span className="prom-valor">{formatNota(ind.promedio)}</span>
                      </td>
                    </>
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
        <span className="leyenda-item"><span className="dot dot-verde" />≥ {APROBATORIO} aprobado</span>
        <span className="leyenda-item"><span className="dot dot-rojo" />&lt; {APROBATORIO} reprobado</span>
        <span className="leyenda-item"><span className="dot dot-pendiente" />Pendiente</span>
        <span className="leyenda-sep">|</span>
        <span className="leyenda-tip">💡 Navega con <kbd>Tab</kbd> / <kbd>Enter</kbd> entre celdas</span>
      </div>
    </div>
  );
}
