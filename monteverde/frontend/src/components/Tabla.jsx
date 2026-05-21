// src/components/Tabla.jsx

export default function Tabla({ columns = [], rows = [] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
      <thead>
        <tr>
          {columns.map(col => (
            <th
              key={col.key}
              style={{
                border: '1px solid #ddd',
                padding: '0.5rem',
                backgroundColor: '#f8f9fa',
                textAlign: 'left'
              }}
            >
              {col.label || col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} style={{ textAlign: 'center', padding: '1rem' }}>
              Sin datos
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map(col => (
                <td
                  key={col.key}
                  style={{
                    border: '1px solid #ddd',
                    padding: '0.5rem'
                  }}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}