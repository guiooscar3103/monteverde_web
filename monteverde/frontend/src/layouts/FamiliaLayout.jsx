import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home,
  Award,
  MessageSquare
} from 'lucide-react';
import HeaderBar from '../components/HeaderBar';
import { useAuth } from '../hooks/useAuth';
import logoColegio from '../assets/img/logo-colegio.png';

export default function FamiliaLayout() {
  const { user, usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { 
      to: '/familia', 
      label: 'Inicio', 
      exact: true,
      icon: <Home size={20} className="sidebar-icon" />
    },
    { 
      to: '/familia/reporte', 
      label: 'Notas',
      icon: <Award size={20} className="sidebar-icon" />
    },
    { 
      to: '/familia/mensajes', 
      label: 'Mensajes',
      icon: <MessageSquare size={20} className="sidebar-icon" />
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
              Familia
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
        backgroundColor: '#F8FAFC',
        flexGrow: 1
      }}>
        <HeaderBar usuario={displayUser?.nombre || 'Familia'} rol="Familia" />
        <div className="fade-in" style={{ padding: '2rem 1.5rem', flexGrow: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
