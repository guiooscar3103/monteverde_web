import api from './axios';

export const authService = {
  // Login
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    const { access_token, refresh_token, usuario } = response.data;

    // Guardar tokens y usuario
    localStorage.setItem('token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('user', JSON.stringify(usuario));

    return { access_token, refresh_token, usuario };
  },

  // Registro
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Obtener perfil
  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data.usuario;
  },

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  // Verificar si está autenticado
  isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Obtener usuario del localStorage
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};
