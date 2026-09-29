import { apiClient, unwrap } from '../client';
import { ENDPOINTS } from '../endpoints';

const E = ENDPOINTS.leave;

export const leaveService = {
  getTypes: () => apiClient.get(E.types).then(unwrap),
  getBalances: () => apiClient.get(E.balances).then(unwrap),
  getMyApplications: status =>
    apiClient
      .get(E.applications, {
        params: status && status !== 'all' ? { status } : {},
      })
      .then(unwrap),
  getApplication: id => apiClient.get(E.application(id)).then(unwrap),
  // payload: { leaveTypeId, startDate, endDate, reason, isHalfDay, halfDayPeriod }
  apply: payload => apiClient.post(E.applications, payload).then(unwrap),
  cancel: (id, reason) => apiClient.post(E.cancel(id), { reason }).then(unwrap),
  withdraw: (id, reason) =>
    apiClient.post(E.withdraw(id), { reason }).then(unwrap),

  // Approver side
  getPendingApprovals: (page = 1, pageSize = 50) =>
    apiClient
      .get(E.pendingApprovals, { params: { page, pageSize } })
      .then(unwrap),
  getProcessedApprovals: (page = 1, pageSize = 50) =>
    apiClient
      .get(E.processedApprovals, { params: { page, pageSize } })
      .then(unwrap),
  approve: (id, comment) =>
    apiClient.post(E.approve(id), { comment }).then(unwrap),
  reject: (id, reason) => apiClient.post(E.reject(id), { reason }).then(unwrap),
};
