import { apiClient, unwrap } from '../client';
import { ENDPOINTS } from '../endpoints';

export const authService = {
  login: (email, password) =>
    apiClient.post(ENDPOINTS.auth.login, { email, password }).then(unwrap),
  logout: () => apiClient.post(ENDPOINTS.auth.logout).then(unwrap),
  me: () => apiClient.get(ENDPOINTS.auth.me).then(unwrap),
  updateProfile: payload =>
    apiClient.put(ENDPOINTS.auth.profile, payload).then(unwrap),
  changePassword: (currentPassword, newPassword) =>
    apiClient
      .post(ENDPOINTS.auth.changePassword, { currentPassword, newPassword })
      .then(unwrap),
};
