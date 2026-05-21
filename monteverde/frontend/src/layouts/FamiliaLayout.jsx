import { NavLink, Outlet } from 'react-router-dom';
import HeaderBar from '../components/HeaderBar';
import { useAuth } from '../hooks/useAuth';
import MobileBottomNav from '../components/MobileBottomNav';
import fondoImg from '../assets/img/fondo.png';

export default function FamiliaLayout() {
  const { usuario } = useAuth();

  return (
    <div className="layout-split" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }}>
      <aside className="sidebar" style={{ borderRight: '1px solid rgba(14, 77, 43, .08)', padding: '1.5rem', background: '#ecfdf5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <img src={`${import.meta.env.BASE_URL}logo-monteverde.png`} alt="Logo Monteverde School" style={{ height: 32, width: 'auto' }} />
        </div>
        <nav style={{ display: 'grid', gap: '.75rem', marginTop: '1rem' }}>
          <NavLink className="nav-link" to="/familia" end>Inicio</NavLink>
          <NavLink className="nav-link" to="/familia/reporte">Notas</NavLink>
          <NavLink className="nav-link" to="/familia/mensajes">Mensajes</NavLink>
        </nav>
      </aside>

      <main className="main-content" style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-light)',
        backgroundImage: `url(${fondoImg})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <HeaderBar usuario={usuario?.nombre || 'Familia'} rol="Familia" />
        <div style={{ padding: '1.5rem' }}>
          <Outlet />
        </div>
        <MobileBottomNav />
      </main>
    </div>
  );
}
