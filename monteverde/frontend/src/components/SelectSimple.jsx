export default function SelectSimple({ value, onChange, options = [], etiqueta = 'Seleccione...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {etiqueta && <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{etiqueta}</label>}
      <select
        value={value}
        onChange={(e) => {
          console.log('Valor seleccionado:', e.target.value);
          onChange(e.target.value);
        }}
        style={{
          padding: '.5rem',
          borderRadius: '6px',
          border: '1px solid #ccc',
          fontSize: '1rem'
        }}
      >
        <option value="">{etiqueta}</option>
        {options.map(op => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    </div>
  );
}