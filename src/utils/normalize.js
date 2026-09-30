// The backend mixes camelCase and snake_case. These helpers read either form
// and return one consistent shape for the UI.

// Names are often stored lowercase with stray spaces ("aqil  jamadar ");
// show them capitalised with single spaces
export const capitalize = str =>
  String(str || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)(\S)/g, (m, sp, ch) => sp + ch.toUpperCase());

export const pick = (obj, ...keys) => {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return undefined;
};

// Extracts an array from { data: [...] } | { data: { items: [...] } } | [...]
export const asList = payload => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
};

export const normalizeUser = (u = {}, roles = []) => ({
  id: pick(u, 'id'),
  uuid: pick(u, 'uuid'),
  email: pick(u, 'email') || '',
  firstName: capitalize(pick(u, 'firstName', 'first_name')),
  lastName: capitalize(pick(u, 'lastName', 'last_name')),
  phone: pick(u, 'phone', 'mobile') || '',
  avatarUrl: pick(u, 'avatarUrl', 'avatar_url') || null,
  designation:
    pick(u, 'designation', 'designationName', 'designation_name') || '',
  organizationId: pick(u, 'organizationId', 'organization_id'),
  orgName: pick(u, 'orgName', 'organizationName', 'organization_name') || '',
  department: pick(u, 'departmentName', 'department_name') || '',
  employeeId: pick(u, 'employeeId', 'employee_id') || null,
  roles: (u.roles && u.roles.length ? u.roles : roles || []).map(r =>
    typeof r === 'string' ? r : r?.code || r?.name,
  ),
  accessRole: pick(u, 'accessRole', 'role') || null,
  enabledModules: u.enabledModules || null,
});

export const normalizeEmployee = (e = {}) => ({
  id: pick(e, 'id'),
  employeeCode: pick(e, 'employeeCode', 'employee_code') || '',
  firstName: capitalize(pick(e, 'firstName', 'first_name')),
  lastName: capitalize(pick(e, 'lastName', 'last_name')),
  email: pick(e, 'email', 'workEmail', 'work_email') || '',
  phone: pick(e, 'phone', 'mobile') || '',
  avatarUrl: pick(e, 'avatarUrl', 'avatar_url') || null,
  gender: pick(e, 'gender') || '',
  dateOfBirth: pick(e, 'dateOfBirth', 'date_of_birth') || null,
  dateOfJoining: pick(e, 'dateOfJoining', 'date_of_joining') || null,
  bloodGroup: pick(e, 'bloodGroup', 'blood_group') || '',
  maritalStatus: pick(e, 'maritalStatus', 'marital_status') || '',
  employmentType: pick(e, 'employmentType', 'employment_type') || '',
  status: pick(e, 'status') || '',
  department: pick(e, 'departmentName', 'department_name', 'department') || '',
  designation:
    pick(e, 'designationName', 'designation_name', 'designation') || '',
  branch:
    pick(e, 'branchName', 'branch_name', 'locationName', 'location_name') || '',
  manager: capitalize(
    pick(
      e,
      'reportingManagerName',
      'reporting_manager_name',
      'managerName',
      'manager_name',
    ) ||
      [
        pick(e, 'rmFirstName', 'rm_first_name'),
        pick(e, 'rmLastName', 'rm_last_name'),
      ]
        .filter(Boolean)
        .join(' '),
  ),
  companyName: pick(e, 'companyName', 'company_name') || '',
});

export const normalizeAttendanceRecord = (r = {}) => ({
  id: pick(r, 'id'),
  date: pick(
    r,
    'checkInDate',
    'check_in_date',
    'date',
    'attendanceDate',
    'attendance_date',
  ),
  checkInTime: pick(r, 'checkInTime', 'check_in_time'),
  checkOutTime: pick(r, 'checkOutTime', 'check_out_time'),
  durationMinutes: Number(
    pick(
      r,
      'workDurationMinutes',
      'work_duration_minutes',
      'durationMinutes',
      'duration_minutes',
    ) || 0,
  ),
  breakMinutes: Number(pick(r, 'breakTimeMinutes', 'break_time_minutes') || 0),
  overtimeMinutes: Number(pick(r, 'overtimeMinutes', 'overtime_minutes') || 0),
  status: String(pick(r, 'status') || '').toLowerCase(),
  isLate: Boolean(pick(r, 'isLate', 'is_late')),
  isEarlyDeparture: Boolean(pick(r, 'isEarlyDeparture', 'is_early_departure')),
  method: pick(r, 'checkInMethod', 'check_in_method') || '',
  checkOutMethod: pick(r, 'checkOutMethod', 'check_out_method') || '',
  locationName: pick(r, 'checkInLocationName', 'check_in_location_name') || '',
  isRegularized: Boolean(pick(r, 'isRegularized', 'is_regularized')),
});

export const normalizeLeaveType = (t = {}) => ({
  id: Number(pick(t, 'id', 'leaveTypeId', 'leave_type_id')),
  name: capitalize(
    pick(
      t,
      'leaveName',
      'leave_name',
      'name',
      'leaveTypeName',
      'leave_type_name',
    ) || 'Leave',
  ),
  code: pick(t, 'leaveCode', 'leave_code', 'code') || '',
  color: pick(t, 'color') || null,
  annualQuota: Number(pick(t, 'annualQuota', 'annual_quota') || 0),
  description: pick(t, 'description') || '',
});

export const normalizeLeaveBalance = (b = {}) => ({
  leaveTypeId: Number(pick(b, 'leaveTypeId', 'leave_type_id', 'id')),
  name: capitalize(
    pick(
      b,
      'leaveName',
      'leave_name',
      'leaveTypeName',
      'leave_type_name',
      'name',
    ) || 'Leave',
  ),
  code: pick(b, 'leaveCode', 'leave_code', 'code') || '',
  available: Number(
    pick(b, 'availableBalance', 'available_balance', 'available', 'balance') ??
      0,
  ),
  consumed: Number(
    pick(b, 'consumedBalance', 'consumed_balance', 'consumed', 'used') ?? 0,
  ),
  total: Number(
    pick(
      b,
      'allocatedBalance',
      'allocated_balance',
      'totalBalance',
      'total_balance',
      'creditedBalance',
      'credited_balance',
      'annualQuota',
      'annual_quota',
      'total',
    ) ?? 0,
  ),
  pending: Number(
    pick(b, 'pendingApprovalBalance', 'pending_approval_balance', 'pending') ??
      0,
  ),
});

export const normalizeLeaveApplication = (a = {}) => ({
  id: pick(a, 'id', 'applicationId', 'application_id'),
  leaveTypeId: pick(a, 'leaveTypeId', 'leave_type_id'),
  leaveType: capitalize(
    pick(
      a,
      'leaveName',
      'leave_name',
      'leaveTypeName',
      'leave_type_name',
      'leaveType',
    ) || 'Leave',
  ),
  startDate: pick(
    a,
    'applicationStartDate',
    'application_start_date',
    'startDate',
    'start_date',
  ),
  endDate: pick(
    a,
    'applicationEndDate',
    'application_end_date',
    'endDate',
    'end_date',
  ),
  totalDays: Number(pick(a, 'totalDays', 'total_days', 'days') || 0),
  isHalfDay: Boolean(pick(a, 'isHalfDay', 'is_half_day')),
  halfDayPeriod: pick(a, 'halfDayPeriod', 'half_day_period') || null,
  reason: pick(a, 'reason', 'reasonDescription', 'reason_description') || '',
  status: String(pick(a, 'status') || 'pending').toLowerCase(),
  appliedOn: pick(a, 'submittedAt', 'submitted_at', 'createdAt', 'created_at'),
  approverName: pick(a, 'approverName', 'approver_name') || '',
  rejectionReason: pick(a, 'rejectionReason', 'rejection_reason') || '',
  employeeName: capitalize(
    pick(a, 'employeeName', 'employee_name') ||
      [
        pick(
          a,
          'firstName',
          'first_name',
          'employeeFirstName',
          'employee_first_name',
        ),
        pick(
          a,
          'lastName',
          'last_name',
          'employeeLastName',
          'employee_last_name',
        ),
      ]
        .filter(Boolean)
        .join(' '),
  ),
  employeeCode: pick(a, 'employeeCode', 'employee_code') || '',
  applicationId: pick(
    a,
    'applicationId',
    'application_id',
    'leaveApplicationId',
    'leave_application_id',
    'id',
  ),
});

export const normalizeExpenseCategory = (c = {}) => ({
  id: Number(pick(c, 'id')),
  name: pick(c, 'name') || 'Category',
  code: pick(c, 'code') || '',
  spendingLimit: Number(pick(c, 'spendingLimit', 'spending_limit') || 0),
  isReceiptMandatory: Boolean(
    pick(c, 'isReceiptMandatory', 'is_receipt_mandatory'),
  ),
});

export const normalizeExpenseClaim = (c = {}) => ({
  id: pick(c, 'id'),
  claimNumber: pick(c, 'claimNumber', 'claim_number') || `#${pick(c, 'id')}`,
  title: pick(c, 'title') || 'Expense claim',
  category: pick(c, 'categoryName', 'category_name', 'category') || '',
  claimDate: pick(c, 'claimDate', 'claim_date', 'createdAt', 'created_at'),
  amount: Number(
    pick(
      c,
      'totalClaimedAmount',
      'total_claimed_amount',
      'amount',
      'claimedAmount',
    ) || 0,
  ),
  approvedAmount: Number(
    pick(c, 'totalApprovedAmount', 'total_approved_amount') || 0,
  ),
  status: String(pick(c, 'status') || 'submitted').toLowerCase(),
  description: pick(c, 'description') || '',
  merchantName: pick(c, 'merchantName', 'merchant_name') || '',
  rejectionReason:
    pick(
      c,
      'rejectionReason',
      'rejection_reason',
      'returnComments',
      'return_comments',
    ) || '',
  employeeName: capitalize(
    pick(c, 'employeeName', 'employee_name') ||
      [
        pick(c, 'firstName', 'first_name', 'employeeFirstName'),
        pick(c, 'lastName', 'last_name', 'employeeLastName'),
      ]
        .filter(Boolean)
        .join(' '),
  ),
  items: Array.isArray(c.items) ? c.items : [],
});

export const normalizeNotification = (n = {}) => ({
  id: pick(n, 'id'),
  title: pick(n, 'title', 'subject') || 'Notification',
  message: pick(n, 'message', 'body', 'content') || '',
  isRead: Boolean(pick(n, 'isRead', 'is_read', 'readAt', 'read_at')),
  createdAt: pick(n, 'createdAt', 'created_at'),
  type: pick(n, 'type', 'category') || 'general',
});

export const normalizeHoliday = (h = {}) => ({
  id: pick(h, 'id'),
  name: capitalize(pick(h, 'holidayName', 'holiday_name', 'name') || 'Holiday'),
  date: pick(h, 'holidayDate', 'holiday_date', 'date'),
  type: pick(h, 'holidayType', 'holiday_type', 'type') || '',
  isOptional: Boolean(pick(h, 'isOptional', 'is_optional')),
});

// Work hour (attendance regularization) request
export const normalizeRegularization = (r = {}) => ({
  id: pick(r, 'id'),
  date: pick(r, 'requestDate', 'request_date'),
  endDate: pick(r, 'endDate', 'end_date'),
  isDateRange: Boolean(pick(r, 'isDateRange', 'is_date_range')),
  checkIn: pick(r, 'requestedCheckInTime', 'requested_check_in_time'),
  checkOut: pick(r, 'requestedCheckOutTime', 'requested_check_out_time'),
  actualCheckIn: pick(r, 'actualCheckInTime', 'actual_check_in_time'),
  actualCheckOut: pick(r, 'actualCheckOutTime', 'actual_check_out_time'),
  reason: pick(r, 'reason') || '',
  dayType: pick(r, 'dayType', 'day_type') || '',
  comment: pick(r, 'comment') || '',
  status: String(pick(r, 'status') || 'pending_manager').toLowerCase(),
  managerComments: pick(r, 'managerComments', 'manager_comments') || '',
  hrComments: pick(r, 'hrComments', 'hr_comments') || '',
  createdAt: pick(r, 'createdAt', 'created_at'),
});

export const normalizeEncashment = (e = {}) => ({
  id: pick(e, 'id'),
  leaveType: capitalize(
    pick(e, 'leaveTypeName', 'leave_type_name', 'leaveName', 'leave_name') ||
      'Leave',
  ),
  days: Number(pick(e, 'encashmentDays', 'encashment_days') || 0),
  dailyRate: Number(pick(e, 'dailyRate', 'daily_rate') || 0),
  amount: Number(pick(e, 'totalAmount', 'total_amount') || 0),
  date: pick(e, 'encashmentDate', 'encashment_date', 'createdAt', 'created_at'),
  status: String(pick(e, 'status') || 'pending').toLowerCase(),
  reason: pick(e, 'reason') || '',
});
