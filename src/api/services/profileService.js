import { apiClient, unwrap } from '../client';
import { ENDPOINTS } from '../endpoints';

export const profileService = {
  getMyEmployeeProfile: () => apiClient.get(ENDPOINTS.employee.me).then(unwrap),
  // Colleagues, used to pick a leave backup person
  listEmployees: (pageSize = 200) =>
    apiClient
      .get(ENDPOINTS.employee.list, { params: { pageSize } })
      .then(unwrap),
};
