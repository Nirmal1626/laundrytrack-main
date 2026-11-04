import type { UserRole } from './auth';

export const OWNER_EMAIL = 'rkp16feb2006@gmail.com';

export const COUNTER_EMAILS = [
  'rishabhempirewow@gmail.com',
  'collegestudies1626@gmail.com',
] as const;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function roleForEmail(email: string): UserRole {
  const normalized = normalizeEmail(email);
  if (normalized === OWNER_EMAIL) return 'owner';
  if ((COUNTER_EMAILS as readonly string[]).includes(normalized)) return 'counter_staff';
  return 'customer';
}

export function isStaffRole(role: UserRole) {
  return role === 'owner' || role === 'counter_staff';
}
