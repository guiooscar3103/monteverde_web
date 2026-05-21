import { Link } from 'react-router-dom'

export default function ButtonLink({ to, children, variant = 'default', ...props }) {
  const base = {
    padding: '.6rem 1rem',
    borderRadius: '10px',
    border: '1px solid var(--border)',
    background: '#fff',
    display: 'inline-block',
    textAlign: 'center'
  }
  const styles = {
    default: base,
    primary: { ...base, background: 'var(--brand-2)', color: '#fff', border: 'none' }
  }
  return (
    <Link to={to} style={styles[variant]} {...props}>
      {children}
    </Link>
  )
}
