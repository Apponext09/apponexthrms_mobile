import { apiClient, unwrap } from '../client';
import { ENDPOINTS } from '../endpoints';

export const profileService = {
  getMyEmployeeProfile: () => apiClient.get(ENDPOINTS.employee.me).then(unwrap),
};
