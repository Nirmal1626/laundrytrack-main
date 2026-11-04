import { Check } from 'lucide-react';
import { ORDER_STATUSES, type PublicOrder } from '../lib/order-types';

const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export function OrderTracker({ order }: { order: PublicOrder }) {
  const step = ORDER_STATUSES.indexOf(order.status);
  const when = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(order.createdAt));

  return (
    <article className="customer-order">
      <div className="customer-order-top">
        <div><small>ORDER</small><b>{order.code}</b></div>
        <span className={`customer-status status-${order.status.toLowerCase()}`}><Check size={14} /> {order.status}</span>
      </div>
      <h2>{order.items}</h2>
      <p>{order.service} · Received {when}{order.urgent ? ' · Urgent' : ''}</p>
      <div className="customer-progress">
        {ORDER_STATUSES.map((status, index) => <i key={status} className={index <= step ? 'is-complete' : ''} />)}
      </div>
      <div className="customer-steps">
        {ORDER_STATUSES.map((status, index) => <span key={status} className={index <= step ? 'is-complete' : ''}>{status}</span>)}
      </div>
      <div className="customer-order-total"><span>{order.paid ? 'Paid' : 'Payment due'}</span><b>{money(order.total)}</b></div>
    </article>
  );
}
