// src/components/ProtectedRoute.jsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // 👈 Cambiado aquí

export default function ProtectedRoute({ requiredRole }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && usuario.rol !== requiredRole) {
    if (usuario.rol === 'docente') {
      return <Navigate to="/docente" replace />;
    } else if (usuario.rol === 'familia') {
      return <Navigate to="/familia" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}