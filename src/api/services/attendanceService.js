import { apiClient, unwrap } from '../client';
import { ENDPOINTS } from '../endpoints';

const E = ENDPOINTS.attendance;

export const attendanceService = {
  getStatus: () => apiClient.get(E.status).then(unwrap),
  getToday: () => apiClient.get(E.today).then(unwrap),
  getMyShift: () => apiClient.get(E.myShift).then(unwrap),
  getHistory: ({ page = 1, pageSize = 20, startDate, endDate } = {}) =>
    apiClient
      .get(E.history, { params: { page, pageSize, startDate, endDate } })
      .then(res => ({
        items: res.data?.data || [],
        meta: res.data?.meta || {},
      })),
  // method 'mobile' is recorded as check_in_method = 'mobile' on the server
  checkIn: coords =>
    apiClient
      .post(E.checkIn, { method: 'mobile', ...(coords || {}) })
      .then(unwrap),
  checkOut: coords =>
    apiClient
      .post(E.checkOut, { method: 'mobile', ...(coords || {}) })
      .then(unwrap),
  breakIn: () => apiClient.post(E.breakIn, {}).then(unwrap),
  breakOut: () => apiClient.post(E.breakOut, {}).then(unwrap),

  // Admin / approver
  getPendingRegularizations: async asHr =>
    apiClient.get(asHr ? E.regHrPending : E.regManagerPending).then(unwrap),
  decideRegularization: (id, approve, asHr, comment) => {
    const url = asHr
      ? approve
        ? E.regHrApprove(id)
        : E.regHrReject(id)
      : approve
      ? E.regManagerApprove(id)
      : E.regManagerReject(id);
    return apiClient
      .post(url, { comment, comments: comment, reason: comment })
      .then(unwrap);
  },
};
