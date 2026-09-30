import { apiClient, unwrap } from '../client';
import { ENDPOINTS } from '../endpoints';

const E = ENDPOINTS.settings;

export const settingsService = {
  // Organization settings, e.g. require_checkout, att_adj_window_days
  getOrgSettings: () => apiClient.get(E.org).then(unwrap),
  // Holidays from the employee's assigned holiday calendar
  getMyHolidays: year =>
    apiClient.get(E.myHolidays, { params: year ? { year } : {} }).then(unwrap),
};
