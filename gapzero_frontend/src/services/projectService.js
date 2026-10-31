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

  async searchOnlinePapers(query) {
    const response = await api.get('/sources/search-online/', { params: { query } });
    return response.data;
  },

  async importPaper(projectId, paper) {
    const response = await api.post('/sources/import-paper/', {
      project_id: projectId,
      paper
    });
    return response.data;
  },

  async getProjectAnalyses(projectId) {
    const response = await api.get('/analysis/', { params: { project: projectId } });
    return response.data;
  },

  async runGapAnalysis(projectId) {
    const response = await api.post('/analysis/run-gap-analysis/', { project_id: projectId });
    return response.data;
  },

  async getProjectReports(projectId) {
    const response = await api.get('/reports/', { params: { project: projectId } });
    return response.data;
  },

  async generateReport(projectId, reportType = 'full') {
    const response = await api.post('/reports/generate/', {
      project_id: projectId,
      report_type: reportType
    });
    return response.data;
  },

  async getAllSources(params = {}) {
    const response = await api.get('/sources/', { params });
    return response.data;
  },

  async getAllAnalyses(params = {}) {
    const response = await api.get('/analysis/', { params });
    return response.data;
  },

  async getAllReports(params = {}) {
    const response = await api.get('/reports/', { params });
    return response.data;
  },

  async getSource(id) {
    const response = await api.get(`/sources/${id}/`);
    return response.data;
  },

  async deleteSource(id) {
    const response = await api.delete(`/sources/${id}/`);
    return response.data;
  },

  async reprocessSource(id) {
    const response = await api.post(`/sources/${id}/reprocess/`);
    return response.data;
  },

  async ingestUrl(projectId, url) {
    const response = await api.post('/sources/ingest-url/', {
      project_id: projectId,
      url: url
    });
    return response.data;
  },

  async ingestPdf(projectId, title, file) {
    const formData = new FormData();
    if (projectId) formData.append('project_id', projectId);
    if (title) formData.append('title', title);
    formData.append('pdf_file', file);

    const response = await api.post('/sources/ingest-pdf/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async ingestText(projectId, title, content) {
    const response = await api.post('/sources/ingest-text/', {
      project_id: projectId,
      title: title,
      content: content
    });
    return response.data;
  }
};

export default projectService;
