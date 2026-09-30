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
  // Same payload as the portal: { title, claimDate, categoryId, paymentMethod,
  //   merchantName, description, projectCostCenter, isDraft, items: [{
  //   categoryId, expenseDate, claimedAmount, merchantName, description,
  //   receiptUrl, receiptFileName, receiptFileType, receiptFileSize,
  //   employeeJustification }] }
  submit: payload => apiClient.post(E.claims, payload).then(unwrap),
  // Edit a draft or a claim returned for correction
  update: (id, payload) => apiClient.put(E.claim(id), payload).then(unwrap),

  getPolicies: () => apiClient.get(E.policies).then(unwrap),
  // { isValid, violations: [string] }
  validatePolicy: (categoryId, amount, receiptProvided) =>
    apiClient
      .post(E.validatePolicy, { categoryId, amount, receiptProvided })
      .then(unwrap),

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
