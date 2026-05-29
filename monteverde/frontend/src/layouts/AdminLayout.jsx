import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import fondoImg from '../assets/img/fondo.png';
import logoColegio from '../assets/img/logo-colegio.png';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/admin',
      label: 'Panel Principal',
      exact: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    },
    {
      to: '/admin/usuarios',
      label: 'Gestión Usuarios',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      to: '/admin/docentes',
      label: 'Asignación Docentes',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    {
      to: '/admin/cursos',
      label: 'Gestión de Cursos',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
          <path d="M8 4v16" />
        </svg>
      )
    },
    {
      to: '/admin/familias',
      label: 'Vínculos Familiares',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          <circle cx="18" cy="9" r="2" />
        </svg>
      )
    },
    {
      to: '/admin/circulares',
      label: 'Gestión Circulares',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )
    },
    {
      to: '/admin/configuracion',
      label: 'Configuración',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Menú lateral */}
      <aside style={{
        background: '#ecfdf5',
        color: '#134e4a',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '4px 0 24px rgba(16, 185, 129, 0.14)'
      }}>
        {/* Cabecera de logotipo del menú lateral */}
        <div style={{
          padding: '1.5rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <img
            src={logoColegio}
            alt="MonteVerde"
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'contain',
              borderRadius: '12px',
              background: '#ffffff',
              padding: '6px',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.15)'
            }}
          />
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '1.15rem',
              fontWeight: 700,
              color: '#0f766e',
              letterSpacing: '0.5px',
              padding: 0
            }}>
              MonteVerde
            </h2>
            <span style={{
              fontSize: '0.75rem',
              color: '#065f46',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Administración
            </span>
          </div>
        </div>

        {/* Navegación del menú lateral */}
        <nav style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                color: isActive ? '#064e3b' : '#14532d',
                background: isActive ? 'linear-gradient(135deg, #86efac, #34d399)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.925rem',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 12px rgba(56, 189, 120, 0.25)' : 'none'
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)';
                  e.currentTarget.style.color = '#14532d';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#14532d';
                }
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Pie de página con tarjeta de usuario en el menú lateral */}
        <div style={{
          padding: '1.25rem 1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 700,
              color: '#ffffff'
            }}>
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'A'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.nombre || 'Administrador'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || 'admin@monteverde.com'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = '#f87171';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Área de contenido del panel principal */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflowY: 'auto',
        backgroundImage: `url(${fondoImg})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        {/* Barra superior de cabecera */}
        <header style={{
          background: '#ffffff',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 4,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#334155' }}>
              Panel de Administración
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Campana de notificación simulada */}
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <div style={{
                background: '#f1f5f9',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: '#ef4444',
                color: '#ffffff',
                borderRadius: '50%',
                width: '8px',
                height: '8px',
                border: '2px solid #ffffff'
              }}></span>
            </div>

            {/* Píldora de perfil de usuario */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 12px 4px 6px',
              background: '#f1f5f9',
              borderRadius: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'A'}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                {user?.nombre || 'Administrador'}
              </span>
            </div>
          </div>
        </header>

        {/* Área de contenido interno */}
        <main style={{ padding: '2rem 1.5rem', flexGrow: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
