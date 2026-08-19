import { useAuth } from '../hooks/useAuth';
import logoColegio from '../assets/img/logo-colegio.png';

export default function HeaderBar({ usuario, rol }) {
  const { logout } = useAuth();
  const salir = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      padding: '1rem 1.5rem',
      borderBottom: '1px solid var(--border)',
      background: '#ffffff',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src={logoColegio}
          alt="Logo Monteverde School"
          style={{ 
            height: '36px', 
            width: 'auto',
            objectFit: 'contain',
            borderRadius: '8px',
            background: 'var(--brand-light)',
            padding: '4px'
          }}
        />
        <div>
          <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.95rem', letterSpacing: '-0.2px' }}>
            Monteverde School
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {rol === 'familia' ? 'Familia conectada' : `Bienvenido ${rol}`}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="badge" style={{ 
          background: 'var(--brand-light)', 
          color: 'var(--color-primary)', 
          borderColor: 'rgba(16, 185, 129, 0.15)',
          padding: '0.35rem 0.8rem',
          fontWeight: 700
        }}>
          {usuario} · {rol}
        </span>
        <button 
          className="btn btn--secondary" 
          onClick={salir}
          style={{
            padding: '0.45rem 1rem',
            minWidth: 'auto',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.8rem'
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
