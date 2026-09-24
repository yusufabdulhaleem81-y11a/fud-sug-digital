import type { UserRole } from '../types/models';

export function homeForRole(role?: UserRole | string | null): string {
  switch (role) {
    case 'president': return '/president/dashboard';
    case 'vp': return '/vp/dashboard';
    case 'exco': return '/exco/dashboard';
    case 'admin':
    case 'super_admin': return '/admin/dashboard';
    default: return '/student/dashboard';
  }
}

export const PORTAL_LABEL: Record<string, string> = {
  student: 'Student Portal',
  exco: 'EXCO Portal',
  vp: 'Vice President Portal',
  president: 'President Portal',
  admin: 'Administrator Portal',
};