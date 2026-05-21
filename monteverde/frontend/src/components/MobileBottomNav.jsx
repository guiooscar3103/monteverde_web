import { NavLink } from 'react-router-dom';

export default function MobileBottomNav() {
  const links = [
    { to: '/familia', label: 'Inicio', icon: '🏠' },
    { to: '/familia/reporte', label: 'Notas', icon: '📘' },
    { to: '/familia/mensajes', label: 'Mensajes', icon: '💬' },
    { to: '/familia', label: 'Perfil', icon: '👤' }
  ];

  return (
    <div className="mobile-bottom-nav">
      <nav>
        {links.map(link => (
          <NavLink
            key={link.to + link.label}
            to={link.to}
            end={link.label === 'Inicio'}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
