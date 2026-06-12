import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoColegio from '../assets/img/logo-colegio.png';
import adminImg from '../assets/img/admin.png';
import docenteImg from '../assets/img/docente.png';
import familiaImg from '../assets/img/familia.png';
import fondoImg from '../assets/img/fondo.png';
import BorderBeam from '../components/BorderBeam';

// Constantes de estilos para reducir complejidad
const STYLES = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 27, 75, 0.92) 100%)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundBlendMode: 'overlay',
    padding: '2rem 1.5rem',
    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif"
  },
  card: {
    background: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
    width: '100%',
    maxWidth: '460px',
    padding: '2.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'relative',
    overflow: 'hidden'
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '6px',
    background: 'linear-gradient(90deg, #0e4d2b, #27ae60, #10b981)'
  },
  roleButton: (isActive) => ({
    background: isActive ? 'linear-gradient(135deg, #27ae60, #0e4d2b)' : '#f8fafc',
    color: isActive ? '#ffffff' : '#334155',
    border: isActive ? 'none' : '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '0.85rem 0.25rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: isActive ? '0 8px 16px rgba(14, 77, 43, 0.25)' : 'none'
  }),
  submitButton: (isLoading) => ({
    width: '100%',
    padding: '0.9rem',
    borderRadius: '16px',
    background: isLoading ? '#cbd5e1' : 'linear-gradient(135deg, #27ae60 0%, #0e4d2b 100%)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '1rem',
    border: 'none',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 0.25s',
    boxShadow: isLoading ? 'none' : '0 4px 14px rgba(14, 77, 43, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '0.5rem'
  })
};

const ROLE_CREDENTIALS = {
  admin: { email: 'admin@monteverde.com', password: 'admin123' },
  docente: { email: 'docente@monteverde.com', password: 'docente123' },
  familia: { email: 'familia@monteverde.com', password: 'familia123' }
};

const ROLE_IMAGES = {
  admin: adminImg,
  docente: docenteImg,
  familia: familiaImg
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logoError, setLogoError] = useState(false);
  const [activeRole, setActiveRole] = useState('');
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleRoleSelect = (role) => {
    clearError();
    setActiveRole(role);
    if (role && ROLE_CREDENTIALS[role]) {
      const { email: credEmail, password: credPassword } = ROLE_CREDENTIALS[role];
      setEmail(credEmail);
      setPassword(credPassword);
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      const user = await login({ email, password });
      const roleRoutes = { admin: '/admin', docente: '/docente', familia: '/familia' };
      navigate(roleRoutes[user?.rol] || '/');
    } catch (err) {
      console.error('Error en login:', err);
    }
  };

  return (
    <div style={{...STYLES.container, backgroundImage: `url(${fondoImg})`}}>
      {/* Tarjeta de Login Principal */}
      <div style={STYLES.card}>
        {/* Adorno de Degradado Superior */}
        <div style={STYLES.gradient} />

        {/* Encabezado */}
        <div style={{ textAlign: 'center' }}>
          {/* Logo / Escudo del Colegio */}
          <div style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
            {!logoError ? (
              <img
                src={logoColegio}
                alt="Colegio MonteVerde Escudo"
                style={{
                  width: '90px',
                  height: 'auto',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease'
                }}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, #0e4d2b, #27ae60)',
                width: '76px',
                height: '76px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                color: '#ffffff',
                boxShadow: '0 8px 16px rgba(14, 77, 43, 0.3)'
              }}>
                🎓
              </div>
            )}
          </div>
          
          <h1 style={{
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: 850,
            color: '#1e293b',
            letterSpacing: '-0.5px'
          }}>
            Plataforma MonteVerde
          </h1>
          <p style={{
            margin: '0.25rem 0 0 0',
            fontSize: '0.925rem',
            color: '#64748b',
            fontWeight: 500
          }}>
            Sistema de Gestión Educativa
          </p>
        </div>

        {/* Selector de Perfil / Roles Interactivos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#0e4d2b',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Selecciona tu perfil de ingreso:
          </label>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px'
          }}>
            {Object.entries(ROLE_CREDENTIALS).map(([role, _]) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelect(role)}
                style={STYLES.roleButton(activeRole === role)}
                onMouseEnter={(e) => {
                  if (activeRole !== role) {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeRole !== role) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <img src={ROLE_IMAGES[role]} alt={role} style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
              </button>
            ))}
          </div>

          {activeRole && (
            <button
              type="button"
              onClick={() => handleRoleSelect('')}
              style={{
                alignSelf: 'flex-end',
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                marginTop: '4px'
              }}
            >
              Limpiar / Ingreso Manual
            </button>
          )}
        </div>

        {/* Separador visual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
            Credenciales de acceso
          </span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Mostrar mensaje de error si ocurre */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            color: '#dc2626',
            fontSize: '0.85rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'left'
          }}>
            <svg style={{ flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (activeRole) setActiveRole('');
              }}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.2s',
                background: isLoading ? '#f8fafc' : '#ffffff'
              }}
              required
              disabled={isLoading}
            />
          </div>

          {/* Contraseña */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (activeRole) setActiveRole('');
              }}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.2s',
                background: isLoading ? '#f8fafc' : '#ffffff'
              }}
              required
              disabled={isLoading}
            />
          </div>

          {/* Botón Ingresar */}
          <button
            type="submit"
            disabled={isLoading}
            style={STYLES.submitButton(isLoading)}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(14, 77, 43, 0.45)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(14, 77, 43, 0.35)';
              }
            }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" strokeDasharray="42" />
                </svg>
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>
        {/* Magic UI Border Beam Effect */}
        <BorderBeam duration={8} size={160} borderWidth={2.5} colorFrom="#27ae60" colorTo="#0e4d2b" borderRadius="24px" />
      </div>

      {/* Pie de Página e Información de Soporte */}
      <div style={{
        marginTop: '1.5rem',
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: '0.8rem',
        maxWidth: '460px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <span>Colegio MonteVerde &copy; 2026. Todos los derechos reservados.</span>
        <span>Para reportar problemas de acceso, contacte a soporte@monteverde.edu.co</span>
      </div>

      {/* Definición clave para la animación de carga del spinner */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
