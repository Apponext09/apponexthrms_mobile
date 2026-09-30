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
  // Same payload as the portal: { leaveTypeId, startDate, endDate, isHalfDay,
  //   customDuration, reason, backupPerson, emergencyContact,
  //   attachedFileName, dayWiseBreakdown: [{ date, dayType }] }
  apply: payload => apiClient.post(E.applications, payload).then(unwrap),
  cancel: (id, reason) =>
    apiClient.post(E.cancel(id), reason ? { reason } : {}).then(unwrap),

  // { holidays, weeklyOffRules } from the employee's holiday calendar
  getCalendar: () => apiClient.get(E.calendar).then(unwrap),
  // Org leave rules, e.g. enableBackupPerson
  getSettings: () => apiClient.get(E.settings).then(unwrap),

  getOptionalHolidays: () => apiClient.get(E.optionalHolidays).then(unwrap),
  selectOptionalHoliday: holidayId =>
    apiClient.post(E.optionalHolidays, { holidayId }).then(unwrap),
  removeOptionalHoliday: selectionId =>
    apiClient.delete(E.optionalHoliday(selectionId)).then(unwrap),

  getMyEncashments: () => apiClient.get(E.myEncashments).then(unwrap),
  previewEncashment: (leaveTypeId, encashmentDays) =>
    apiClient
      .post(E.encashmentPreview, { leaveTypeId, encashmentDays })
      .then(unwrap),
  requestEncashment: ({ leaveTypeId, encashmentDays, reason }) =>
    apiClient
      .post(E.encashmentRequest, { leaveTypeId, encashmentDays, reason })
      .then(unwrap),

  // AI check of a medical certificate image (portal does this on upload)
  analyzeCertificate: (base64Data, mimeType) =>
    apiClient.post(E.analyzeCertificate, { base64Data, mimeType }).then(unwrap),
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
