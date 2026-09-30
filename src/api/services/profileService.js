import { apiClient, unwrap } from '../client';
import { ENDPOINTS } from '../endpoints';

const E = ENDPOINTS.employee;

export const profileService = {
  getMyEmployeeProfile: () => apiClient.get(E.me).then(unwrap),
  // Colleagues, used to pick a leave backup person
  listEmployees: (pageSize = 200) =>
    apiClient.get(E.list, { params: { pageSize } }).then(unwrap),

  // Profiles are locked until HR approves an edit request
  // -> { editUnlocked, approvedRequestId, unlockedSection }
  getEditPermission: employeeId =>
    apiClient
      .get(E.editPermission, { params: employeeId ? { employeeId } : {} })
      .then(unwrap),
  getMyUpdateRequests: () => apiClient.get(E.myUpdateRequests).then(unwrap),
  // Same request the portal sends: unlocks the whole profile once approved
  requestEdit: (employeeId, reason) =>
    apiClient
      .post(E.updateRequests, {
        employeeId,
        requestType: 'personal_info',
        targetArea:
          'Complete Profile (Basic, Personal, Professional, Statutory, Documents & Photo)',
        requestedChanges:
          'Basic information, personal information, professional information, statutory details, documents, and profile photo.',
        reason,
      })
      .then(unwrap),

  // Partial update: only the fields sent are changed
  updateEmployee: (id, data) => apiClient.put(E.byId(id), data).then(unwrap),
  getPersonalInfo: id => apiClient.get(E.personalInfo(id)).then(unwrap),
  savePersonalInfo: (id, data) =>
    apiClient.put(E.personalInfo(id), data).then(unwrap),
  getProfessionalInfo: id => apiClient.get(E.professionalInfo(id)).then(unwrap),
  saveProfessionalInfo: (id, data) =>
    apiClient.put(E.professionalInfo(id), data).then(unwrap),

  // Registers the profile photo for face-recognition attendance (portal does
  // this whenever the photo changes)
  enrollFace: (employeeId, images) =>
    apiClient
      .post(E.enrollFace, { employeeId: String(employeeId), images })
      .then(unwrap),
};
