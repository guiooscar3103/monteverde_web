export default function BarraTitulo({ titulo, subtitulo, derecha }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', borderBottom:'1px solid #eee', paddingBottom:'.5rem'}}>
      <div>
        <h1 style={{margin:0}}>{titulo}</h1>
        {subtitulo && <small style={{opacity:.8}}>{subtitulo}</small>}
      </div>
      <div>{derecha}</div>
    </div>
  )
}
