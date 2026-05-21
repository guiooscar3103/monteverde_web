export default function Card({ title, children, action, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {title && <div className="section-title">{title}</div>}
      {children}
      {action && <div style={{ marginTop: '.75rem' }}>{action}</div>}
    </div>
  )
}
