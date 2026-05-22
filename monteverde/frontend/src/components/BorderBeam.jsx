import React from 'react';

/**
 * Componente BorderBeam - Recrea el haz de luz del borde (BorderBeam) de Magic UI utilizando CSS puro de alto rendimiento y ligero.
 *
 * @param {Object} props
 * @param {number} [props.duration=8] - Duración de la animación del haz en segundos.
 * @param {number} [props.size=100] - Tamaño en píxeles del degradado del haz de luz.
 * @param {number} [props.borderWidth=2] - Ancho del haz del borde en píxeles.
 * @param {string} [props.colorFrom="#27ae60"] - Color inicial del haz de luz degradado.
 * @param {string} [props.colorTo="#0e4d2b"] - Color final del haz de luz degradado.
 * @param {string} [props.borderRadius="24px"] - Radio de redondeo de las esquinas para acoplarse a la tarjeta contenedora.
 * @param {number} [props.delay=0] - Retardo en segundos antes de iniciar la animación.
 * @param {string} [props.className=""] - Clases CSS adicionales para aplicar al componente.
 */
export default function BorderBeam({
  duration = 8,
  size = 100,
  borderWidth = 2,
  colorFrom = '#27ae60',
  colorTo = '#0e4d2b',
  borderRadius = '24px',
  delay = 0,
  className = ''
}) {
  const style = {
    '--border-beam-duration': `${duration}s`,
    '--border-beam-size': `${size}px`,
    '--border-beam-width': `${borderWidth}px`,
    '--border-beam-from': colorFrom,
    '--border-beam-to': colorTo,
    '--border-beam-radius': borderRadius,
    '--border-beam-delay': `${delay}s`
  };

  return (
    <div 
      className={`border-beam-container ${className}`} 
      style={style} 
    />
  );
}
