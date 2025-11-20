import api from './api';

export const fetchDashboardMetrics = async () => {
  const response = await api.get('/dashboard/metrics');
  return response.data.data;
};
