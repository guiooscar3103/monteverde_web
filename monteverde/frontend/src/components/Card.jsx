export default function Card({ title, children, action, className = '', style }) {
  return (
    <div className={`card ${className}`} style={style}>
      {title && <div className="section-title">{title}</div>}
      {children}
      {action && <div style={{ marginTop: '.75rem' }}>{action}</div>}
    </div>
  )
}
