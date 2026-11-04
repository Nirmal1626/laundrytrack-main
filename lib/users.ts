import type { SessionUser } from './auth';
import { hashPassword, verifyPassword } from './passwords';
import { isStaffRole, normalizeEmail, roleForEmail } from './roles';
import { updateStore, type UserRecord } from './store';

export class AccountError extends Error {
  status: number;
  needsSetup?: boolean;
  accountName?: string;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AccountError';
    this.status = status;
  }
}

function toSessionUser(user: UserRecord): SessionUser {
  return {
    email: user.email,
    name: user.name,
    role: user.role,
    ...(user.phone ? { phone: user.phone } : {}),
  };
}

export async function authenticateUser(input: {
  email: string;
  password: string;
  setup?: boolean;
  name?: string;
}) {
  const email = normalizeEmail(input.email);
  const password = input.password;
  if (!email || !password) throw new AccountError('Enter your email and password.', 400);

  return updateStore((store) => {
    const user = store.users.find((candidate) => candidate.email === email);
    if (!user) {
      throw new AccountError('No account for this email. Customers are added when the counter saves an order.', 401);
    }

    if (!user.passwordHash || !user.salt) {
      if (input.setup !== true) {
        const error = new AccountError('Choose a password for this account.', 409);
        error.needsSetup = true;
        error.accountName = user.name;
        throw error;
      }
      if (password.length < 8) throw new AccountError('Use at least 8 characters for the password.', 400);
      const nextName = input.name?.trim();
      if (nextName) user.name = nextName.slice(0, 80);
      const hashed = hashPassword(password);
      user.salt = hashed.salt;
      user.passwordHash = hashed.passwordHash;
      return { user: toSessionUser(user), needsSetup: false };
    }

    if (!verifyPassword(password, user.salt, user.passwordHash)) {
      throw new AccountError('Email or password is incorrect.', 401);
    }
    return { user: toSessionUser(user), needsSetup: false };
  });
}

export async function registerCustomer(input: { email: string; name: string; password: string }) {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AccountError('Enter a valid email address.', 400);
  }
  if (!name || name.length > 80) {
    throw new AccountError('Enter a name between 1 and 80 characters.', 400);
  }
  if (input.password.length < 8 || input.password.length > 128) {
    throw new AccountError('Use a password between 8 and 128 characters.', 400);
  }
  if (isStaffRole(roleForEmail(email))) {
    throw new AccountError('That email is reserved for a staff account.', 409);
  }

  return updateStore((store) => {
    if (store.users.some((user) => user.email === email)) {
      throw new AccountError('An account already exists for this email. Sign in instead.', 409);
    }

    const hashed = hashPassword(input.password);
    const user: UserRecord = {
      email,
      name,
      role: 'customer',
      salt: hashed.salt,
      passwordHash: hashed.passwordHash,
    };
    store.users.push(user);
    return { user: toSessionUser(user) };
  });
}

export async function ensureCustomer(input: { email: string; name: string; phone: string }) {
  const email = normalizeEmail(input.email);
  if (isStaffRole(roleForEmail(email))) {
    throw new AccountError('That email belongs to the owner or counter staff. Use the customer’s own email.', 400);
  }

  return updateStore((store) => {
    const existing = store.users.find((candidate) => candidate.email === email);
    if (existing) {
      if (existing.role !== 'customer') {
        throw new AccountError('That email belongs to the owner or counter staff. Use the customer’s own email.', 400);
      }
      existing.name = input.name;
      existing.phone = input.phone;
      return toSessionUser(existing);
    }

    const created: UserRecord = {
      email,
      name: input.name,
      role: 'customer',
      phone: input.phone,
    };
    store.users.push(created);
    return toSessionUser(created);
  });
}
