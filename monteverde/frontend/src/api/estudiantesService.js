import api from './axios';

export const estudiantesService = {
  // Listar estudiantes
  async getEstudiantes(params = {}) {
    const response = await api.get('/estudiantes/', { params });
    return response.data;
  },

  // Obtener estudiante específico
  async getEstudiante(id) {
    const response = await api.get(`/estudiantes/${id}`);
    return response.data;
  },

  // Crear estudiante (admin)
  async createEstudiante(estudianteData) {
    const response = await api.post('/estudiantes/', estudianteData);
    return response.data;
  }
};
