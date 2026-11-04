import { randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { ensureCustomer, AccountError } from './users';
import { deliverWhatsApp, whatsAppDigits, type WhatsAppHandoff } from './whatsapp';
import { EXPENSE_CATEGORIES, ORDER_STATUSES, SERVICES, type OrderStatus, type PublicOrder } from './order-types';
import { updateStore, type ExpenseRecord, type OrderRecord } from './store';

export { EXPENSE_CATEGORIES, ORDER_STATUSES, SERVICES };

const nextStatus: Record<OrderStatus, OrderStatus> = {
  Received: 'Washing',
  Washing: 'Ironing',
  Ironing: 'Ready',
  Ready: 'Ready',
};

export function orderCode(id: number) {
  return `LT-${String(id).padStart(5, '0')}`;
}

export function requestOrigin(request: NextRequest) {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  return request.nextUrl.origin;
}

export type StaffOrder = PublicOrder & {
  id: number;
  token: string;
  phone: string;
  email: string;
};

function toStaffOrder(order: OrderRecord): StaffOrder {
  return {
    id: order.id,
    code: order.code,
    token: order.token,
    name: order.name,
    phone: order.phone,
    email: order.email,
    items: order.items,
    service: order.service,
    status: order.status,
    total: order.total,
    paid: order.paid,
    urgent: order.urgent,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function toPublicOrder(order: Pick<OrderRecord, 'code' | 'name' | 'items' | 'service' | 'status' | 'total' | 'paid' | 'urgent' | 'createdAt' | 'updatedAt'>): PublicOrder {
  return {
    code: order.code,
    name: order.name,
    items: order.items,
    service: order.service,
    status: order.status,
    total: order.total,
    paid: order.paid,
    urgent: order.urgent,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function trackingMessage(order: Pick<OrderRecord, 'token' | 'code' | 'name' | 'items' | 'service' | 'status'>, origin: string) {
  const link = `${origin}/track/${order.token}`;
  const statusLine = {
    Received: `we have received ${order.code}.`,
    Washing: `${order.code} is now being washed.`,
    Ironing: `${order.code} is now being ironed.`,
    Ready: `${order.code} is ready for pickup.`,
  }[order.status];
  const text = `Hi ${order.name}, ${statusLine}\n${order.items} · ${order.service}\nTrack your order: ${link}\n— LaundryTrack by Nirmal Kumar`;
  return { text, link };
}

function handoffFor(order: Pick<OrderRecord, 'token' | 'code' | 'name' | 'items' | 'service' | 'status' | 'phone'>, origin: string) {
  const message = trackingMessage(order, origin);
  return deliverWhatsApp({ phone: order.phone, text: message.text, link: message.link });
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export async function listOrders() {
  return updateStore((store) => store.orders.map(toStaffOrder).sort((a, b) => b.id - a.id));
}

export async function listOrdersForEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return updateStore((store) => store.orders
    .filter((order) => order.email === normalized)
    .map(toPublicOrder)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function getOrderByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) return null;
  return updateStore((store) => {
    const order = store.orders.find((candidate) => candidate.token === token);
    return order ? toPublicOrder(order) : null;
  });
}

export async function createOrder(input: Record<string, unknown>, origin: string) {
  const name = cleanText(input.name, 80);
  const phone = cleanText(input.phone, 24);
  const email = cleanText(input.email, 120).toLowerCase();
  const items = cleanText(input.items, 140);
  const service = cleanText(input.service, 40);
  const total = typeof input.total === 'number' ? input.total : Number(input.total);
  const paid = input.paid === true || input.paid === 'Paid';
  const urgent = input.urgent === true;

  if (!name) throw new AccountError('Enter the customer’s name.', 400);
  if (!whatsAppDigits(phone)) throw new AccountError('Enter a valid WhatsApp number. A 10-digit Indian mobile number is enough.', 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AccountError('Enter the customer’s email address.', 400);
  if (!items) throw new AccountError('Enter the items in this order.', 400);
  if (!SERVICES.includes(service as (typeof SERVICES)[number])) throw new AccountError('Choose a service.', 400);
  if (!Number.isFinite(total) || total <= 0 || total > 1000000) throw new AccountError('Enter a valid order total.', 400);

  await ensureCustomer({ email, name, phone });

  const order = await updateStore((store) => {
    const now = new Date().toISOString();
    const id = store.nextOrderId;
    store.nextOrderId += 1;
    const created: OrderRecord = {
      id,
      code: orderCode(id),
      token: randomBytes(18).toString('base64url'),
      name,
      phone,
      email,
      items,
      service,
      total: Math.round(total * 100) / 100,
      paid,
      urgent,
      status: 'Received',
      createdAt: now,
      updatedAt: now,
    };
    store.orders.push(created);
    return toStaffOrder(created);
  });
  const whatsapp: WhatsAppHandoff = await handoffFor(order, origin);
  return { order, whatsapp };
}

export async function updateOrder(id: number, input: { status?: unknown; paid?: unknown; notify?: unknown }, origin: string) {
  const updated = await updateStore((store) => {
    const order = store.orders.find((candidate) => candidate.id === id);
    if (!order) throw new AccountError('Order not found.', 404);

    let changed = false;
    if (input.status !== undefined) {
      if (!ORDER_STATUSES.includes(input.status as OrderStatus)) throw new AccountError('Choose a valid status.', 400);
      const requested = input.status as OrderStatus;
      if (requested !== order.status && requested !== nextStatus[order.status]) {
        throw new AccountError(`Move ${order.code} to ${nextStatus[order.status]} before a later step.`, 400);
      }
      if (requested !== order.status) {
        order.status = requested;
        changed = true;
      }
    }

    if (input.paid !== undefined) {
      const paid = input.paid === true;
      if (paid !== order.paid) {
        order.paid = paid;
        changed = true;
      }
    }

    if (!changed && input.notify !== true && input.status === undefined && input.paid === undefined) {
      throw new AccountError('Nothing to update.', 400);
    }

    const shouldNotify = input.notify === true || (input.status !== undefined && changed);
    if (changed) order.updatedAt = new Date().toISOString();
    return { order: toStaffOrder(order), shouldNotify };
  });
  const whatsapp = updated.shouldNotify ? await handoffFor(updated.order, origin) : null;
  return { order: updated.order, whatsapp };
}

export async function listExpenses() {
  return updateStore((store) => [...store.expenses].sort((a, b) => b.id - a.id));
}

export async function createExpense(input: Record<string, unknown>) {
  const title = cleanText(input.title, 80);
  const category = cleanText(input.category, 40);
  const amount = typeof input.amount === 'number' ? input.amount : Number(input.amount);
  if (!title) throw new AccountError('Enter a description.', 400);
  if (!EXPENSE_CATEGORIES.includes(category as (typeof EXPENSE_CATEGORIES)[number])) throw new AccountError('Choose a category.', 400);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) throw new AccountError('Enter a valid amount.', 400);

  return updateStore((store) => {
    const expense: ExpenseRecord = {
      id: store.nextExpenseId,
      title,
      category,
      amount: Math.round(amount * 100) / 100,
      createdAt: new Date().toISOString(),
    };
    store.nextExpenseId += 1;
    store.expenses.push(expense);
    return expense;
  });
}
