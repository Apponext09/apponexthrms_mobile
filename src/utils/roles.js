// Role codes come from shared/src/constants on the backend
export const ADMIN_ROLES = [
  'super_admin',
  'organization_admin',
  'company_admin',
  'hr_manager',
  'finance',
];
export const APPROVER_ROLES = [
  'reporting_manager',
  'team_lead',
  'recruitment_manager',
];

const has = (roles, list) =>
  (roles || []).some(r => list.includes(String(r).toLowerCase()));

export const isAdmin = roles => has(roles, ADMIN_ROLES);
export const isApprover = roles => has(roles, APPROVER_ROLES);

// Admin side = org/HR admins and people managers (they approve leave/expenses)
export const canUseAdminView = roles => isAdmin(roles) || isApprover(roles);

// Employee side needs an employee record to punch attendance and apply leave
export const canUseEmployeeView = user =>
  Boolean(user?.employeeId) || !isAdmin(user?.roles);

export const defaultViewMode = user =>
  isAdmin(user?.roles) ? 'admin' : 'employee';

export const roleLabel = (roles = []) => {
  const map = {
    super_admin: 'Super Admin',
    organization_admin: 'Organization Admin',
    company_admin: 'Company Admin',
    hr_manager: 'HR Manager',
    finance: 'Finance',
    reporting_manager: 'Reporting Manager',
    team_lead: 'Team Lead',
    recruitment_manager: 'Recruitment Manager',
    employee: 'Employee',
    intern: 'Intern',
    consultant: 'Consultant',
  };
  const first = roles.find(r => map[r]) || roles[0];
  return map[first] || 'Employee';
};
