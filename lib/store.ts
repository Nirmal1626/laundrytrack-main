import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { UserRole } from './auth';
import type { OrderStatus } from './order-types';
import { hashPassword } from './passwords';
import { COUNTER_EMAILS, OWNER_EMAIL } from './roles';

export type { OrderStatus };

export type UserRecord = {
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  salt?: string;
  passwordHash?: string;
};

export type OrderRecord = {
  id: number;
  code: string;
  token: string;
  name: string;
  phone: string;
  email: string;
  items: string;
  service: string;
  total: number;
  paid: boolean;
  urgent: boolean;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseRecord = {
  id: number;
  title: string;
  category: string;
  amount: number;
  createdAt: string;
};

type StoreData = {
  users: UserRecord[];
  orders: OrderRecord[];
  expenses: ExpenseRecord[];
  nextOrderId: number;
  nextExpenseId: number;
  sharedInitialPasswordApplied?: boolean;
};

const dataDir = path.join(process.cwd(), 'data');
const storeFile = path.join(dataDir, 'store.json');

const staffSeeds: UserRecord[] = [
  { email: OWNER_EMAIL, name: 'Nirmal Kumar', role: 'owner' },
  { email: COUNTER_EMAILS[0], name: 'Rishabh', role: 'counter_staff' },
  { email: COUNTER_EMAILS[1], name: 'Staff', role: 'counter_staff' },
];

function emptyStore(): StoreData {
  const store = {
    users: staffSeeds.map((user) => ({ ...user })),
    orders: [],
    expenses: [],
    nextOrderId: 1,
    nextExpenseId: 1,
  };
  ensureStaff(store);
  return store;
}

function initializeSharedPassword(store: StoreData) {
  if (store.sharedInitialPasswordApplied) return;
  const password = process.env.INITIAL_ACCOUNT_PASSWORD;
  if (!password) return;
  if (password.length < 8) {
    throw new Error('INITIAL_ACCOUNT_PASSWORD must be at least 8 characters.');
  }

  store.users.forEach((user) => {
    const hashed = hashPassword(password);
    user.salt = hashed.salt;
    user.passwordHash = hashed.passwordHash;
  });
  store.sharedInitialPasswordApplied = true;
}

function ensureStaff(store: StoreData) {
  staffSeeds.forEach((seed) => {
    const existing = store.users.find((user) => user.email === seed.email);
    if (!existing) {
      store.users.push({ ...seed });
      return;
    }
    existing.role = seed.role;
  });
}

async function readStore() {
  try {
    const raw = await readFile(storeFile, 'utf8');
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, '')) as StoreData;
    if (!Array.isArray(parsed.users) || !Array.isArray(parsed.orders) || !Array.isArray(parsed.expenses)) {
      throw new Error('Store file is incomplete.');
    }
    ensureStaff(parsed);
    initializeSharedPassword(parsed);
    parsed.nextOrderId = Number(parsed.nextOrderId) || 1;
    parsed.nextExpenseId = Number(parsed.nextExpenseId) || 1;
    return parsed;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      const store = emptyStore();
      initializeSharedPassword(store);
      return store;
    }
    throw error;
  }
}

async function writeStore(store: StoreData) {
  await mkdir(dataDir, { recursive: true });
  const tempFile = path.join(dataDir, `store.${process.pid}.tmp`);
  await writeFile(tempFile, JSON.stringify(store, null, 2), 'utf8');
  await rename(tempFile, storeFile);
}

let queue: Promise<unknown> = Promise.resolve();

export function updateStore<T>(mutator: (store: StoreData) => T | Promise<T>) {
  const run = queue.then(async () => {
    const store = await readStore();
    const result = await mutator(store);
    await writeStore(store);
    return result;
  });
  queue = run.then(() => undefined, () => undefined);
  return run;
}
