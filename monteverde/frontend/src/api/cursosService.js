import api from './axios';

export const cursosService = {
  // Listar cursos
  async getCursos(params = {}) {
    const response = await api.get('/cursos/', { params });
    return response.data;
  },

  // Obtener curso específico
  async getCurso(id) {
    const response = await api.get(`/cursos/${id}`);
    return response.data;
  },

  // Crear curso (admin)
  async createCurso(cursoData) {
    const response = await api.post('/cursos/', cursoData);
    return response.data;
  },

  // Actualizar curso (admin)
  async updateCurso(id, cursoData) {
    const response = await api.put(`/cursos/${id}`, cursoData);
    return response.data;
  },

  // Eliminar curso (admin)
  async deleteCurso(id) {
    const response = await api.delete(`/cursos/${id}`);
    return response.data;
  }
};
