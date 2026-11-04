import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex');
  return { salt, passwordHash };
}

export function verifyPassword(password: string, salt: string, passwordHash: string) {
  const supplied = scryptSync(password, Buffer.from(salt, 'hex'), 64);
  const stored = Buffer.from(passwordHash, 'hex');
  if (supplied.length !== stored.length) return false;
  return timingSafeEqual(supplied, stored);
}
