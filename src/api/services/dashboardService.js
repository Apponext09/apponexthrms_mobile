import { apiClient, unwrap } from '../client';
import { ENDPOINTS } from '../endpoints';

export const dashboardService = {
  getMyStats: () => apiClient.get(ENDPOINTS.dashboard.me).then(unwrap),
  getAdminStats: () => apiClient.get(ENDPOINTS.dashboard.admin).then(unwrap),
};
