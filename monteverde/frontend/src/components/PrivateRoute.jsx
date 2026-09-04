import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children, allowedRoles = [], requiredRoles = [] }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const roles = allowedRoles.length > 0 ? allowedRoles : requiredRoles;

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && user && !roles.includes(user.rol)) {
    if (user.rol === 'admin') return <Navigate to="/admin" replace />;
    if (user.rol === 'coordinador') return <Navigate to="/coordinador" replace />;
    if (user.rol === 'docente') return <Navigate to="/docente" replace />;
    if (user.rol === 'familia') return <Navigate to="/familia" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
