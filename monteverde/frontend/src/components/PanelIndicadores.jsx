import { useState, useEffect } from 'react';
import { Target, Pencil, AlertTriangle, Save, Loader2 } from 'lucide-react';

/**
 * PanelIndicadores
 * Permite configurar dinámicamente los indicadores de logro de un periodo académico.
 * Se adapta a la cantidad de indicadores exigida por la configuración (ej. 2, 3, 5, etc.).
 * Si los indicadores ya tienen notas registradas, solicita confirmación antes de alterarlos.
 */
export default function PanelIndicadores({
  indicadores = [],          // [{id, numero, descripcion}] — actuales guardados
  cantidadIndicadores = 2,   // Cantidad requerida según la configuración académica
  onGuardar,                 // async fn({ indicadores: [...] }) → { success }
  guardando = false,
  tieneNotas = false,        // true si ya hay notas registradas para este periodo
  disabled = false,
}) {
  const numRequerido = cantidadIndicadores || 2;
  const indices = Array.from({ length: numRequerido }, (_, i) => i + 1);

  // Inicializar mapa de descripciones { 1: '...', 2: '...', ... }
  const [descripciones, setDescripciones] = useState(() => {
    const mapa = {};
    indices.forEach(num => {
      const ind = (indicadores || []).find(i => i.numero === num);
      mapa[num] = ind?.descripcion || '';
    });
    return mapa;
  });

  const [editando, setEditando] = useState(false);
  const [error, setError] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  // Verificar si todos los indicadores requeridos están definidos
  const todosDefinidos = indices.every(num => {
    const ind = (indicadores || []).find(i => i.numero === num);
    return Boolean(ind && ind.descripcion?.trim());
  });

  // Sincronizar estado cuando cambian los indicadores o la cantidad requerida
  useEffect(() => {
    const mapa = {};
    indices.forEach(num => {
      const ind = (indicadores || []).find(i => i.numero === num);
      mapa[num] = ind?.descripcion || '';
    });
    setDescripciones(mapa);
    if (!todosDefinidos) {
      setEditando(true);
    } else {
      setEditando(false);
    }
  }, [indicadores, cantidadIndicadores, todosDefinidos]);

  const handleDescChange = (numero, valor) => {
    setDescripciones(prev => ({
      ...prev,
      [numero]: valor
    }));
  };

  const handleEditar = () => {
    if (tieneNotas) {
      setConfirmando(true);
    } else {
      setEditando(true);
    }
  };

  const handleConfirmarCambio = () => {
    setConfirmando(false);
    setEditando(true);
  };

  const handleGuardar = async () => {
    setError('');

    // Validar que todas las descripciones estén completas
    for (const num of indices) {
      const desc = (descripciones[num] || '').trim();
      if (!desc) {
        setError(`Debes escribir la descripción del Indicador ${num}.`);
        return;
      }
      if (desc.length < 5) {
        setError(`El Indicador ${num} debe tener al menos 5 caracteres.`);
        return;
      }
    }

    const payloadIndicadores = indices.map(num => ({
      numero: num,
      descripcion: (descripciones[num] || '').trim()
    }));

    try {
      await onGuardar({
        indicadores: payloadIndicadores,
        // Compatibilidad legacy
        ind1: descripciones[1] || '',
        ind2: descripciones[2] || ''
      });
      setEditando(false);
    } catch (e) {
      setError(e.message || 'Error al guardar los indicadores.');
    }
  };

  const handleCancelar = () => {
    const mapa = {};
    indices.forEach(num => {
      const ind = (indicadores || []).find(i => i.numero === num);
      mapa[num] = ind?.descripcion || '';
    });
    setDescripciones(mapa);
    setError('');
    setEditando(false);
    setConfirmando(false);
  };

  /* ── Modal de confirmación si existen calificaciones ── */
  if (confirmando) {
    return (
      <div className="panel-indicadores panel-indicadores--confirmar">
        <div className="pi-confirm-box">
          <div className="pi-confirm-icon">
            <AlertTriangle size={36} style={{ color: '#dc2626' }} />
          </div>
          <h3>¿Cambiar indicadores de logro?</h3>
          <p>
            Este período ya tiene notas registradas. Si modificas los indicadores,
            <strong> se eliminarán las notas parciales asociadas a los indicadores modificados</strong>.
            Esta acción no se puede deshacer.
          </p>
          <div className="pi-confirm-actions">
            <button className="btn-pi btn-pi--danger" onClick={handleConfirmarCambio}>
              Sí, modificar indicadores
            </button>
            <button className="btn-pi btn-pi--ghost" onClick={handleCancelar}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Vista de sólo lectura ── */
  if (!editando && todosDefinidos) {
    return (
      <div className="panel-indicadores">
        <div className="pi-header">
          <h3 className="pi-title">
            <span className="pi-icon">
              <Target size={18} />
            </span>
            Indicadores de logro configurados ({indicadores.length})
          </h3>
          {!disabled && (
            <button
              className="btn-pi btn-pi--outline"
              onClick={handleEditar}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Pencil size={14} />
              <span>Editar indicadores</span>
            </button>
          )}
        </div>
        <div className="pi-cards" style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: '1rem' }}>
          {(indicadores || []).map(ind => (
            <div key={ind.id || ind.numero} className={`pi-card pi-card--${ind.numero}`}>
              <div className="pi-card-numero">Indicador {ind.numero}</div>
              <div className="pi-card-desc">{ind.descripcion}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Formulario dinámico de edición ── */
  return (
    <div className="panel-indicadores panel-indicadores--editing">
      <div className="pi-header">
        <h3 className="pi-title">
          <span className="pi-icon">
            <Target size={18} />
          </span>
          {todosDefinidos ? 'Editar indicadores de logro' : 'Configurar indicadores de logro'}
        </h3>
        <p className="pi-subtitle">
          Define los <strong>{numRequerido} indicadores</strong> que se evaluarán en este periodo antes de ingresar notas.
        </p>
      </div>

      <div className="pi-form">
        {indices.map(num => (
          <div key={num} className="pi-field">
            <label className="pi-label" htmlFor={`indicador-${num}`}>
              <span className={`pi-badge pi-badge--${num}`}>{num}</span>
              Indicador de Logro {num}
            </label>
            <textarea
              id={`indicador-${num}`}
              className="pi-textarea"
              placeholder={`Ej: El estudiante demuestra dominio de las competencias del indicador ${num}...`}
              value={descripciones[num] || ''}
              onChange={e => handleDescChange(num, e.target.value)}
              rows={2}
              maxLength={500}
              disabled={guardando}
            />
            <span className="pi-char-count">{(descripciones[num] || '').length}/500</span>
          </div>
        ))}

        {error && (
          <div className="pi-error" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div className="pi-actions">
          <button
            className="btn-pi btn-pi--primary"
            onClick={handleGuardar}
            disabled={guardando || indices.some(n => !(descripciones[n] || '').trim())}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {guardando ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Guardar {numRequerido} indicadores</span>
              </>
            )}
          </button>
          {todosDefinidos && (
            <button className="btn-pi btn-pi--ghost" onClick={handleCancelar} disabled={guardando}>
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
