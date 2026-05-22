import React from 'react';

/**
 * Componente BlurFade - Simula el componente BlurFade de Magic UI utilizando animaciones CSS puras y ligeras.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - El contenido que se va a animar.
 * @param {number} [props.delay=0] - Retardo en segundos antes de que comience la animación.
 * @param {number} [props.duration=0.4] - Duración de la animación en segundos.
 * @param {string} [props.blur="8px"] - Cantidad de desenfoque inicial.
 * @param {string} [props.yOffset="8px"] - Desplazamiento vertical inicial.
 * @param {string} [props.className=""] - Clases CSS adicionales para aplicar al contenedor.
 */
export default function BlurFade({
  children,
  delay = 0,
  duration = 0.4,
  blur = '8px',
  yOffset = '8px',
  className = ''
}) {
  const style = {
    '--blur-fade-delay': `${delay}s`,
    '--blur-fade-duration': `${duration}s`,
    '--blur-fade-blur': blur,
    '--blur-fade-y': yOffset
  };

  return (
    <div className={`blur-fade ${className}`} style={style}>
      {children}
    </div>
  );
}
