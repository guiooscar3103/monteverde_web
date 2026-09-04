import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Library,
  Megaphone,
  LogOut,
  Bell,
  Sparkles,
  Calendar
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import logoColegio from '../assets/img/logo-colegio.png';

export default function CoordinadorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/coordinador',
      label: 'Panel Académico',
      exact: true,
      icon: <LayoutDashboard size={20} className="sidebar-icon" />
    },
    {
      to: '/coordinador/calendario',
      label: 'Calendario y Periodos',
      icon: <Calendar size={20} className="sidebar-icon" />
    },
    {
      to: '/coordinador/cursos',
      label: 'Gestión de Cursos',
      icon: <BookOpen size={20} className="sidebar-icon" />
    },
    {
      to: '/coordinador/asignaturas',
      label: 'Planes y Asignaturas',
      icon: <Library size={20} className="sidebar-icon" />
    },
    {
      to: '/coordinador/docentes',
      label: 'Asignación Docente',
      icon: <GraduationCap size={20} className="sidebar-icon" />
    },
    {
      to: '/coordinador/circulares',
      label: 'Circulares Académicas',
      icon: <Megaphone size={20} className="sidebar-icon" />
    }
  ];

  return (
    <div className="layout-split">
      {/* Menú lateral */}
      <aside className="sidebar" style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-white)' }}>
        {/* Cabecera de logotipo del menú lateral */}
        <div style={{
          padding: '0.5rem 0.25rem 1.25rem 0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--border)'
        }}>
          <img
            src={logoColegio}
            alt="MonteVerde"
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span style={{
                fontSize: '0.66rem',
                color: '#047857',
                background: '#D1FAE5',
                padding: '2px 6px',
                borderRadius: '6px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'inline-block'
              }}>
                Coordinación
              </span>
            </div>
          </div>
        </div>

        {/* Navegación del menú lateral */}
        <nav style={{ display: 'grid', gap: '6px', marginTop: '0.75rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Tarjeta de usuario en el menú lateral */}
        <div style={{
          padding: '1.25rem 1rem',
          borderRadius: 'var(--radius)',
          background: 'var(--bg-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: '1px solid var(--border)',
          marginTop: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#047857',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#ffffff',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'C'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.nombre || 'Coordinador Académico'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || 'coordinador@monteverde.com'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: 'var(--radius-xs)',
              background: '#FFE4E6',
              border: '1px solid #FECDD3',
              color: '#9F1239',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FCA5A5';
              e.currentTarget.style.color = '#7F1D1D';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFE4E6';
              e.currentTarget.style.color = '#9F1239';
            }}
          >
            <LogOut size={15} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Área de contenido principal */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflowY: 'auto',
        backgroundColor: '#F8FAFC',
        flexGrow: 1
      }}>
        {/* Barra superior de cabecera */}
        <header style={{
          background: '#ffffff',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 4,
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              Portal de Coordinación Académica
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px 4px 6px',
              background: 'var(--bg-light)',
              borderRadius: '20px',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: '#047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'C'}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {user?.nombre || 'Coordinación'}
              </span>
            </div>
          </div>
        </header>

        {/* Área de contenido interno */}
        <main className="fade-in" style={{ padding: '2rem 1.5rem', flexGrow: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
