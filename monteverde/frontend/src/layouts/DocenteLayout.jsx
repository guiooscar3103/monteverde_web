import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import HeaderBar from '../components/HeaderBar';
import { useAuth } from '../hooks/useAuth';
import fondoImg from '../assets/img/fondo.png';
import logoColegio from '../assets/img/logo-colegio.png';

export default function DocenteLayout() {
  const { user, usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { 
      to: '/docente', 
      label: 'Inicio', 
      exact: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    { 
      to: '/docente/calificaciones', 
      label: 'Gestión Académica',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      )
    },
    { 
      to: '/docente/asistencia', 
      label: 'Asistencia',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    { 
      to: '/docente/observador', 
      label: 'Observador',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="15" y2="16" />
        </svg>
      )
    },
    { 
      to: '/docente/mensajes', 
      label: 'Mensajes',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    }
  ];

  const displayUser = user || usuario;

  return (
    <div className="layout-split">
      <aside className="sidebar" style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-white)' }}>
        <div style={{ 
          padding: '0.5rem 0.25rem 1.25rem 0.25rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          borderBottom: '1px solid var(--border)' 
        }}>
          <img
            src={logoColegio}
            alt="Logo Monteverde School"
            style={{ 
              width: '42px', 
              height: '42px', 
              objectFit: 'contain',
              borderRadius: '10px',
              background: 'var(--brand-light)',
              padding: '6px',
              boxShadow: 'var(--shadow-sm)'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 800,
              color: 'var(--color-primary)',
              letterSpacing: '-0.3px',
              lineHeight: '1.2',
              display: 'block'
            }}>
              MonteVerde
            </span>
            <span style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              display: 'block',
              marginTop: '2px'
            }}>
              Docente
            </span>
          </div>
        </div>

        <nav style={{ display: 'grid', gap: '6px', marginTop: '0.75rem' }}>
          {navItems.map((item) => (
            <NavLink 
              key={item.to} 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} 
              to={item.to} 
              end={item.exact}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>


      </aside>

      <main className="main-content" style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-light)',
        backgroundImage: `url(${fondoImg})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        flexGrow: 1
      }}>
        <HeaderBar
          usuario={displayUser?.nombre || 'Profesor'}
          rol={displayUser?.rol || 'Docente'}
        />
        <div className="fade-in" style={{ padding: '2rem 1.5rem', flexGrow: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
