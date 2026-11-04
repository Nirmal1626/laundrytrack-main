import { SignJWT, jwtVerify } from 'jose';

export type UserRole = 'owner' | 'counter_staff' | 'customer';
export type SessionUser = {
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
};

function jwtKey() {
  const secret = process.env.JWT_SECRET ?? (process.env.NODE_ENV === 'production' ? '' : 'local-development-jwt-secret-change-before-deploy');
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser) {
  const key = jwtKey();
  if (!key) throw new Error('JWT_SECRET must be at least 32 characters.');
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.email)
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  const key = jwtKey();
  if (!key) return null;

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if (
      typeof payload.email !== 'string' ||
      typeof payload.name !== 'string' ||
      !['owner', 'counter_staff', 'customer'].includes(String(payload.role))
    ) return null;

    return {
      email: payload.email,
      name: payload.name,
      role: payload.role as UserRole,
      ...(typeof payload.phone === 'string' ? { phone: payload.phone } : {}),
    };
  } catch {
    return null;
  }
}