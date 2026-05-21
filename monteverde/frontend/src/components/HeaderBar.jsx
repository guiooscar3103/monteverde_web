import { useAuth } from '../hooks/useAuth';

export default function HeaderBar({ usuario, rol }) {
  const { logout } = useAuth();
  const salir = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      padding: '1rem 1.5rem',
      borderBottom: '1px solid rgba(14, 77, 43, .08)',
      background: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <img
          src={`${import.meta.env.BASE_URL}logo-monteverde.png`}
          alt="Logo Monteverde School"
          style={{ height: 38, width: 'auto' }}
        />
        <div>
          <div style={{ fontWeight: 700, color: 'var(--brand)' }}>Monteverde School</div>
          <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{rol === 'familia' ? 'Familia conectada' : `Bienvenido ${rol}`}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="badge" style={{ backgroundColor: 'rgba(14, 77, 43, .08)', color: 'var(--brand)' }}>
          {usuario} · {rol}
        </span>
        <button className="btn btn--secondary" onClick={salir}>Cerrar sesión</button>
      </div>
    </div>
  );
}
