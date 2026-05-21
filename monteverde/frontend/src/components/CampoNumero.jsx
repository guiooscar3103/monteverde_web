export default function CampoNumero({ value, onChange, min=0, max=5, paso=0.1 }) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={paso}
      value={value ?? ''}
      onChange={e => onChange(Number(e.target.value))}
      style={{width:80, padding:'.35rem'}}
    />
  )
}
