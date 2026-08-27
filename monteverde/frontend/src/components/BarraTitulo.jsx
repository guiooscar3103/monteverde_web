export default function BarraTitulo({ titulo, subtitulo, derecha }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.25rem',
      borderBottom: '1px solid var(--border, #E2E8F0)',
      paddingBottom: '0.75rem',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      <div>
        <h1 style={{
          margin: 0,
          fontSize: '1.65rem',
          fontWeight: 700,
          color: 'var(--text, #0F172A)',
          letterSpacing: '-0.025em',
          lineHeight: 1.2
        }}>
          {titulo}
        </h1>
        {subtitulo && (
          <p style={{
            margin: '0.25rem 0 0',
            fontSize: '0.875rem',
            color: 'var(--text-muted, #64748B)',
            fontWeight: 400,
            lineHeight: 1.4
          }}>
            {subtitulo}
          </p>
        )}
      </div>
      {derecha && <div>{derecha}</div>}
    </div>
  );
}
