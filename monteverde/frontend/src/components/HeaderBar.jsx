import { useAuth } from '../hooks/useAuth';
import logoColegio from '../assets/img/logo-colegio.png';
import iconoDocente from '../assets/img/icono docente.png';
import iconoFamilia from '../assets/img/icono familia.png';

export default function HeaderBar({ usuario, rol }) {
  const { logout } = useAuth();
  const salir = () => {
    logout();
    window.location.href = '/';
  };

  // Determinar la ilustración de avatar a nivel de header según el rol
  let avatarImg = logoColegio; // Por defecto es el escudo del colegio
  const rolNormalizado = rol?.toLowerCase() || '';
  if (rolNormalizado.includes('docente') || rolNormalizado.includes('profesor')) {
    avatarImg = iconoDocente;
  } else if (rolNormalizado.includes('familia') || rolNormalizado.includes('padre') || rolNormalizado.includes('madre')) {
    avatarImg = iconoFamilia;
  }

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
            {rolNormalizado.includes('familia') ? 'Familia conectada' : `Bienvenido ${rol}`}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src={avatarImg}
            alt={`Avatar de ${rol}`}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
              background: 'var(--brand-light)',
              border: '2.2px solid var(--color-primary)',
              boxShadow: 'var(--shadow-sm)',
              padding: rolNormalizado.includes('admin') ? '3px' : '0'
            }}
          />
          <span className="badge" style={{ 
            background: 'var(--brand-light)', 
            color: 'var(--color-primary)', 
            borderColor: 'rgba(16, 185, 129, 0.15)',
            padding: '0.35rem 0.8rem',
            fontWeight: 700
          }}>
            {usuario} · {rol}
          </span>
        </div>
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
