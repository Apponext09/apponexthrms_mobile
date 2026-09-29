import { apiClient, unwrap } from '../client';
import { ENDPOINTS } from '../endpoints';

const E = ENDPOINTS.notifications;

export const notificationService = {
  list: (page = 1, pageSize = 30) =>
    apiClient.get(E.list, { params: { page, pageSize } }).then(unwrap),
  unreadCount: () => apiClient.get(E.unreadCount).then(unwrap),
  markRead: id => apiClient.patch(E.markRead(id)).then(unwrap),
  markAllRead: () => apiClient.post(E.markAllRead).then(unwrap),
};
