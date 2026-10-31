import api from '../utils/api';

export const dashboardService = {
  async getStats() {
    const response = await api.get('/common/dashboard/stats/');
    return response.data;
  },

  async getActivity() {
    const response = await api.get('/common/activity/');
    return response.data;
  },

  async checkHealth() {
    const response = await api.get('/common/health/');
    return response.data;
  }
};

export default dashboardService;
