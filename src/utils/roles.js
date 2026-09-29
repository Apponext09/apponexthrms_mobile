// Role codes come from shared/src/constants on the backend
export const ADMIN_ROLES = [
  'super_admin',
  'organization_admin',
  'company_admin',
  'hr_manager',
  'finance',
];
const has = (roles, list) =>
  (roles || []).some(r => list.includes(String(r).toLowerCase()));

export const isAdmin = roles => has(roles, ADMIN_ROLES);

// Admin roles always get the admin side; everyone else (including team leads
// and managers) gets the employee side. There is no switching between them.
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
