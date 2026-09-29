import { apiClient, unwrap } from '../client';
import { ENDPOINTS } from '../endpoints';

const E = ENDPOINTS.expense;

export const expenseService = {
  getCategories: () => apiClient.get(E.categories).then(unwrap),
  getMyClaims: status =>
    apiClient
      .get(E.claims, {
        params: {
          mode: 'my_expenses',
          ...(status && status !== 'all' ? { status } : {}),
        },
      })
      .then(unwrap),
  getClaim: id => apiClient.get(E.claim(id)).then(unwrap),
  getSummary: () => apiClient.get(E.summary).then(unwrap),
  // payload: { title, description, claimDate, items: [{ categoryId, claimedAmount, expenseDate, description, merchantName }] }
  submit: payload => apiClient.post(E.claims, payload).then(unwrap),

  // Approver side
  getPendingApprovals: () =>
    apiClient
      .get(E.claims, {
        params: { mode: 'approvals', status: 'pending_approvals' },
      })
      .then(unwrap),
  approve: (id, comments) =>
    apiClient.post(E.managerApprove(id), { comments }).then(unwrap),
  reject: (id, reason) => apiClient.post(E.reject(id), { reason }).then(unwrap),
};
