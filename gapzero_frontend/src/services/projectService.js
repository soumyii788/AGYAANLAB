import api from '../utils/api';

export const projectService = {
  async getProjects(params = {}) {
    const response = await api.get('/research/projects/', { params });
    return response.data;
  },

  async getProject(id) {
    const response = await api.get(`/research/projects/${id}/`);
    return response.data;
  },

  async createProject(projectData) {
    const response = await api.post('/research/projects/', projectData);
    return response.data;
  },

  async updateProject(id, projectData) {
    const response = await api.patch(`/research/projects/${id}/`, projectData);
    return response.data;
  },

  async deleteProject(id) {
    const response = await api.delete(`/research/projects/${id}/`);
    return response.data;
  },

  async getProjectStats() {
    const response = await api.get('/research/projects/stats/');
    return response.data;
  },

  async getProjectNotes(projectId) {
    const response = await api.get(`/research/projects/${projectId}/notes/`);
    return response.data;
  },

  async createProjectNote(projectId, noteData) {
    const response = await api.post(`/research/projects/${projectId}/notes/`, noteData);
    return response.data;
  },

  async getProjectSources(projectId) {
    const response = await api.get('/sources/', { params: { project: projectId } });
    return response.data;
  },

  async createProjectSource(sourceData) {
    const response = await api.post('/sources/', sourceData);
    return response.data;
  },

  async getProjectAnalyses(projectId) {
    const response = await api.get('/analysis/', { params: { project: projectId } });
    return response.data;
  },

  async createAnalysis(analysisData) {
    const response = await api.post('/analysis/', analysisData);
    return response.data;
  }
};

export default projectService;
