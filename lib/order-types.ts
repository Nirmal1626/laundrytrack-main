export type OrderStatus = 'Received' | 'Washing' | 'Ironing' | 'Ready';

export const ORDER_STATUSES: OrderStatus[] = ['Received', 'Washing', 'Ironing', 'Ready'];
export const SERVICES = ['Wash & Iron', 'Wash & Fold', 'Dry Clean', 'Ironing only'] as const;
export const EXPENSE_CATEGORIES = ['Supplies', 'Transport', 'Utilities', 'Rent', 'Other'] as const;

export type PublicOrder = {
  code: string;
  name: string;
  items: string;
  service: string;
  status: OrderStatus;
  total: number;
  paid: boolean;
  urgent: boolean;
  createdAt: string;
  updatedAt: string;
};
