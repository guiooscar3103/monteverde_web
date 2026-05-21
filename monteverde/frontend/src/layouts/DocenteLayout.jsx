import { NavLink, Outlet } from 'react-router-dom';
import HeaderBar from '../components/HeaderBar';
import { useAuth } from '../hooks/useAuth';
import fondoImg from '../assets/img/fondo.png';

export default function DocenteLayout() {
  const { usuario } = useAuth();
  return (
    <div className="layout-split" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }}>
      <aside className="sidebar" style={{ borderRight: '1px solid rgba(14, 77, 43, .08)', padding: '1.5rem', background: '#ecfdf5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <img
            src={`${import.meta.env.BASE_URL}logo-monteverde.png`}
            alt="Logo Monteverde School"
            style={{ height: 52, width: 'auto' }}
          />
        </div>

        <nav style={{ display: 'grid', gap: '.75rem', marginTop: '1rem' }}>
          <NavLink className="nav-link" to="/docente" end>Inicio</NavLink>
          <NavLink className="nav-link" to="/docente/calificaciones">Gestión Académica</NavLink>
          <NavLink className="nav-link" to="/docente/asistencia">Asistencia</NavLink>
          <NavLink className="nav-link" to="/docente/observador">Observador</NavLink>
          <NavLink className="nav-link" to="/docente/mensajes">Mensajes</NavLink>
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
        <HeaderBar
          usuario={usuario?.nombre || 'Profesor'}
          rol={usuario?.rol || 'Docente'}
        />
        <div style={{ padding: '1.5rem' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
