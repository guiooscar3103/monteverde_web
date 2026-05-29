import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Asistencia from './pages/docente/Asistencia';
import ObservadorAlumno from './pages/docente/ObservadorAlumno';
import Mensajes from './pages/docente/Mensajes';
import FamiliaHome from './pages/familia/Home';
import FamiliaMensajes from './pages/familia/Mensajes';
import ReporteAcademico from './pages/familia/ReporteAcademico';

// Estructuras de diseño (Layouts)
import DocenteLayout from './layouts/DocenteLayout';
import FamiliaLayout from './layouts/FamiliaLayout'; 
import AdminLayout from './layouts/AdminLayout';

// Páginas
import DocenteHome from './pages/docente/Home';
import RegistroCalificaciones from './pages/docente/RegistroCalificaciones';

// Páginas de administración
import Dashboard from './pages/admin/Dashboard';
import Usuarios from './pages/admin/Usuarios';
import Docentes from './pages/admin/Docentes';
import Familias from './pages/admin/Familias';
import Configuracion from './pages/admin/Configuracion';
import Cursos from './pages/admin/Cursos';
import Circulares from './pages/admin/Circulares';

// ===================================================
// RUTA ADMINISTRATIVA DE ALTA FIDELIDAD
// ===================================================

// ===================================================
// Componente para proteger rutas
// ===================================================
function PrivateRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
        <p>Cargando...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    // Redirigir al dashboard correcto según el rol
    if (user.rol === 'admin') return <Navigate to="/admin" replace />;
    if (user.rol === 'docente') return <Navigate to="/docente" replace />;
    if (user.rol === 'familia') return <Navigate to="/familia" replace />;
  }
  
  return children;
}

// ===================================================
// Redirección de Raíz robusta anti-bucles
// ===================================================
function RootRedirect() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.rol === 'admin') return <Navigate to="/admin" replace />;
  if (user?.rol === 'docente') return <Navigate to="/docente" replace />;
  if (user?.rol === 'familia') return <Navigate to="/familia" replace />;

  // Si tiene un rol no reconocido o está corrupto, cerramos sesión para evitar bucles de redirección
  logout();
  return <Navigate to="/login" replace />;
}


// ===================================================
// Estructura principal de rutas
// ===================================================
function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* ======================================
          LOGIN
      ====================================== */}
      <Route path="/login" element={<Login />} />
      
      {/* ======================================
          DOCENTE
      ====================================== */}
      <Route 
        path="/docente" 
        element={
          <PrivateRoute allowedRoles={['docente']}>
            <DocenteLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DocenteHome />} />
        <Route path="calificaciones" element={<RegistroCalificaciones />} />
        <Route path="asistencia" element={<Asistencia />} />
        <Route path="observador" element={<ObservadorAlumno />} />
        <Route path="mensajes" element={<Mensajes />} />
      </Route>
      
      {/* ======================================
          ADMIN - MEJORADO
      ====================================== */}
      <Route 
        path="/admin" 
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminLayout />
          </PrivateRoute>
        } 
      >
        <Route index element={<Dashboard />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="docentes" element={<Docentes />} />
        <Route path="familias" element={<Familias />} />
        <Route path="cursos" element={<Cursos />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="circulares" element={<Circulares />} />
      </Route>
      
      {/* ======================================
          FAMILIA
      ====================================== */}
      <Route 
        path="/familia" 
        element={
          <PrivateRoute allowedRoles={['familia']}>
            <FamiliaLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<FamiliaHome />} />
        <Route path="home" element={<FamiliaHome />} />
        <Route path="mensajes" element={<FamiliaMensajes />} />
        <Route path="reporte" element={<ReporteAcademico />} />
      </Route>

      {/* ======================================
          RAÍZ / HOME
      ====================================== */}
      <Route path="/" element={<RootRedirect />} />
      
      {/* ======================================
          RUTA COMODÍN DE CAPTURA (404)
      ====================================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
