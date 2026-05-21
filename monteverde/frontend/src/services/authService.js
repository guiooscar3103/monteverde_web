// src/services/authService.js

/**
 * Servicio de autenticación que maneja login/logout contra JSON Server
 */

const API_BASE_URL = 'http://localhost:3000';

/**
 * Iniciar sesión
 */
export const login = async (email, password) => {
  const res = await fetch(`${API_BASE_URL}/usuarios`);
  if (!res.ok) throw new Error('Error al conectar con el servidor');
  const usuarios = await res.json();

  const user = usuarios.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    throw new Error('Credenciales incorrectas');
  }

  const usuarioSesion = {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    estudianteId: user.estudianteId // solo para familia
  };

  localStorage.setItem('usuario', JSON.stringify(usuarioSesion));
  return usuarioSesion;
};

/**
 * Cerrar sesión
 */
export const logout = () => {
  localStorage.removeItem('usuario');
};