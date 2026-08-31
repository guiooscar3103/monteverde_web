import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, AlertCircle, Loader2, LogIn } from 'lucide-react';
import logoColegio from '../assets/img/logo-colegio.png';
import iconoDocente from '../assets/img/icono docente.png';
import iconoFamilia from '../assets/img/icono familia.png';
import BorderBeam from '../components/BorderBeam';


const ROLE_CREDENTIALS = {
  admin: { email: 'admin@monteverde.com', password: 'admin123' },
  docente: { email: 'docente@monteverde.com', password: 'docente123' },
  familia: { email: 'familiagonzalez@monteverde.com', password: 'familia123' }
};

const ROLE_IMAGES = {
  admin: logoColegio,
  docente: iconoDocente,
  familia: iconoFamilia
};

const ROLE_LABELS = {
  admin: 'Administrador',
  docente: 'Docente',
  familia: 'Familia'
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
    <div 
      className="login-container" 
      style={{
        background: 'linear-gradient(135deg, #0A3A20 0%, #0F172A 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '2rem'
      }}
    >
      {/* Tarjeta de Login Principal */}
      <div className="login-card" style={{ padding: '2.5rem 2rem', border: 'none', borderRadius: '20px', boxShadow: 'var(--shadow-lg)' }}>
        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          {/* Logo / Escudo del Colegio */}
          <div style={{ display: 'inline-block', marginBottom: '1rem' }}>
            {!logoError ? (
              <img
                src={logoColegio}
                alt="Colegio MonteVerde Escudo"
                style={{
                  width: '80px',
                  height: 'auto',
                  borderRadius: '14px',
                  background: 'var(--brand-light)',
                  padding: '8px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.3s ease'
                }}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div style={{
                background: 'var(--brand-light)',
                width: '76px',
                height: '76px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <GraduationCap size={36} />
              </div>
            )}
          </div>

          <h1 style={{
            margin: 0,
            fontSize: '1.6rem',
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '-0.5px'
          }}>
            Plataforma MonteVerde
          </h1>
          <p style={{
            margin: '0.25rem 0 0 0',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            fontWeight: 500
          }}>
            Sistema de Gestión Educativa
          </p>
        </div>

        {/* Selector de Perfil / Roles Interactivos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <label style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px'
          }}>
            Selecciona tu perfil de ingreso:
          </label>

          <div className="role-selector">
            {Object.keys(ROLE_CREDENTIALS).map((role) => (
              <button

                key={role}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`role-btn ${activeRole === role ? 'active' : ''}`}
                style={{
                  borderRadius: '12px',
                  border: activeRole === role ? '1px solid var(--color-primary)' : '1px solid var(--border)'
                }}
              >
                <img
                  src={ROLE_IMAGES[role]}
                  alt={role}
                  style={{
                    width: '34px',
                    height: '34px',
                    objectFit: 'contain',
                    filter: activeRole === role ? 'brightness(0) invert(1)' : 'none'
                  }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{ROLE_LABELS[role]}</span>
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
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                marginTop: '2px'
              }}
            >
              Limpiar / Ingreso Manual
            </button>
          )}
        </div>

        {/* Separador visual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Credenciales de acceso
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Mostrar mensaje de error si ocurre */}
        {error && (
          <div style={{
            background: '#FFE4E6',
            border: '1px solid #FECDD3',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            color: '#9F1239',
            fontSize: '0.8rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'left',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Email */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
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
                borderRadius: '10px',
                background: isLoading ? 'var(--bg-light)' : '#ffffff'
              }}
              required
              disabled={isLoading}
            />
          </div>

          {/* Contraseña */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
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
                borderRadius: '10px',
                background: isLoading ? 'var(--bg-light)' : '#ffffff'
              }}
              required
              disabled={isLoading}
            />
          </div>

          {/* Botón Ingresar */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn--primary submit-btn"
            style={{
              borderRadius: '10px',
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '0.5rem',
              width: '100%',
              fontSize: '0.9rem'
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>
        {/* Magic UI Border Beam Effect */}
        <BorderBeam duration={8} size={150} borderWidth={2} colorFrom="var(--color-primary-light)" colorTo="var(--color-primary)" borderRadius="20px" />
      </div>

      {/* Pie de Página e Información de Soporte */}
      <div style={{
        marginTop: '1.5rem',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.65)',
        fontSize: '0.78rem',
        maxWidth: '440px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <span>Colegio MonteVerde &copy; 2026. Todos los derechos reservados.</span>
        <span>Para reportar problemas de acceso, escribe a soporte@monteverde.edu.co</span>
      </div>

      {/* Definición clave para la animación de carga del spinner */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
