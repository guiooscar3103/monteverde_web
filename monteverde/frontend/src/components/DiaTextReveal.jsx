import React from 'react';

/**
 * Componente DiaTextReveal - Un efecto premium de revelación de texto sin dependencias externas que divide
 * el texto en caracteres, los revela de forma secuencial y aplica un brillo degradado en movimiento.
 *
 * @param {Object} props
 * @param {string} props.text - El texto que se va a mostrar con la animación de revelación.
 * @param {string[]} [props.colors=["#A97CF8", "#F38CB8", "#FDCC92"]] - Los colores para el degradado en movimiento.
 * @param {number} [props.duration=0.5] - La velocidad de la animación de revelación en segundos.
 * @param {string} [props.className=""] - Clases CSS adicionales para aplicar.
 * @param {Object} [props.style={}] - Estilos en línea adicionales.
 */
export default function DiaTextReveal({
  text,
  colors = ['#A97CF8', '#F38CB8', '#FDCC92'],
  duration = 0.5,
  className = '',
  style = {}
}) {
  if (!text) return null;

  const chars = text.split('');
  const gradientString = `linear-gradient(135deg, ${colors.join(', ')})`;

  return (
    <span
      className={`dia-text-reveal-container ${className}`}
      style={{
        ...style,
        '--dia-gradient': gradientString
      }}
    >
      {chars.map((char, index) => {
        const charStyle = {
          '--dia-char-delay': `${index * 0.04}s`,
          '--dia-char-duration': `${duration}s`,
          display: char === ' ' ? 'inline' : 'inline-block',
          whiteSpace: 'pre'
        };

        return (
          <span 
            key={index} 
            className="dia-text-char" 
            style={charStyle}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}
