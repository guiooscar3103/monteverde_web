import { useState } from 'react';

/**
 * PanelIndicadores
 * Permite configurar los 2 indicadores de logro de un bimestre.
 * Si los indicadores ya tienen notas registradas, pide confirmación antes de cambiarlos.
 */
export default function PanelIndicadores({
  indicadores,        // [{id, numero, descripcion}] — actuales guardados
  onGuardar,          // async fn({ ind1, ind2 }) → { success }
  guardando,
  tieneNotas = false, // true si ya hay notas registradas para este bimestre
  disabled = false,
}) {
  const ind1 = indicadores?.find(i => i.numero === 1);
  const ind2 = indicadores?.find(i => i.numero === 2);

  const [editando, setEditando] = useState(!ind1 || !ind2);
  const [desc1, setDesc1] = useState(ind1?.descripcion || '');
  const [desc2, setDesc2] = useState(ind2?.descripcion || '');
  const [error, setError] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  const ambosDefinidos = ind1 && ind2;

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
    const d1 = desc1.trim();
    const d2 = desc2.trim();

    if (!d1 || !d2) {
      setError('Debes escribir la descripción de ambos indicadores.');
      return;
    }
    if (d1.length < 10 || d2.length < 10) {
      setError('Cada indicador debe tener al menos 10 caracteres.');
      return;
    }

    try {
      await onGuardar({ ind1: d1, ind2: d2 });
      setEditando(false);
    } catch (e) {
      setError(e.message || 'Error al guardar los indicadores.');
    }
  };

  const handleCancelar = () => {
    setDesc1(ind1?.descripcion || '');
    setDesc2(ind2?.descripcion || '');
    setError('');
    setEditando(false);
    setConfirmando(false);
  };

  /* ── Modal de confirmación ── */
  if (confirmando) {
    return (
      <div className="panel-indicadores panel-indicadores--confirmar">
        <div className="pi-confirm-box">
          <div className="pi-confirm-icon">⚠️</div>
          <h3>¿Cambiar indicadores?</h3>
          <p>
            Este bimestre ya tiene notas registradas. Si cambias los indicadores,
            <strong> se eliminarán todas las notas parciales</strong> asociadas a ellos.
            Esta acción no se puede deshacer.
          </p>
          <div className="pi-confirm-actions">
            <button className="btn-pi btn-pi--danger" onClick={handleConfirmarCambio}>
              Sí, cambiar indicadores
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
  if (!editando && ambosDefinidos) {
    return (
      <div className="panel-indicadores">
        <div className="pi-header">
          <h3 className="pi-title">
            <span className="pi-icon">🎯</span>
            Indicadores de logro configurados
          </h3>
          {!disabled && (
            <button className="btn-pi btn-pi--outline" onClick={handleEditar}>
              ✏️ Editar indicadores
            </button>
          )}
        </div>
        <div className="pi-cards">
          <div className="pi-card pi-card--1">
            <div className="pi-card-numero">Indicador 1</div>
            <div className="pi-card-desc">{ind1.descripcion}</div>
          </div>
          <div className="pi-card pi-card--2">
            <div className="pi-card-numero">Indicador 2</div>
            <div className="pi-card-desc">{ind2.descripcion}</div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Formulario de edición ── */
  return (
    <div className="panel-indicadores panel-indicadores--editing">
      <div className="pi-header">
        <h3 className="pi-title">
          <span className="pi-icon">🎯</span>
          {ambosDefinidos ? 'Editar indicadores de logro' : 'Configurar indicadores de logro'}
        </h3>
        <p className="pi-subtitle">
          Define los 2 indicadores que se evaluarán en este bimestre antes de ingresar notas.
        </p>
      </div>

      <div className="pi-form">
        <div className="pi-field">
          <label className="pi-label" htmlFor="indicador-1">
            <span className="pi-badge pi-badge--1">1</span>
            Indicador de Logro 1
          </label>
          <textarea
            id="indicador-1"
            className="pi-textarea"
            placeholder="Ej: El estudiante identifica y aplica conceptos de suma y resta en situaciones cotidianas..."
            value={desc1}
            onChange={e => setDesc1(e.target.value)}
            rows={3}
            maxLength={500}
            disabled={guardando}
          />
          <span className="pi-char-count">{desc1.length}/500</span>
        </div>

        <div className="pi-field">
          <label className="pi-label" htmlFor="indicador-2">
            <span className="pi-badge pi-badge--2">2</span>
            Indicador de Logro 2
          </label>
          <textarea
            id="indicador-2"
            className="pi-textarea"
            placeholder="Ej: El estudiante interpreta y resuelve problemas usando operaciones básicas..."
            value={desc2}
            onChange={e => setDesc2(e.target.value)}
            rows={3}
            maxLength={500}
            disabled={guardando}
          />
          <span className="pi-char-count">{desc2.length}/500</span>
        </div>

        {error && (
          <div className="pi-error">⚠️ {error}</div>
        )}

        <div className="pi-actions">
          <button
            className="btn-pi btn-pi--primary"
            onClick={handleGuardar}
            disabled={guardando || !desc1.trim() || !desc2.trim()}
          >
            {guardando ? '⏳ Guardando...' : '✅ Guardar indicadores'}
          </button>
          {ambosDefinidos && (
            <button className="btn-pi btn-pi--ghost" onClick={handleCancelar} disabled={guardando}>
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
