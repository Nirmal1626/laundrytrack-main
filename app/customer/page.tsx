import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Shirt } from 'lucide-react';
import { OrderTracker } from '../../components/order-tracker';
import { verifySessionToken } from '../../lib/auth';
import { listOrdersForEmail } from '../../lib/orders';

export const dynamic = 'force-dynamic';

export default async function CustomerPage() {
  const token = cookies().get('laundrytrack_session')?.value;
  const user = token ? await verifySessionToken(token) : null;
  if (!user || user.role !== 'customer') redirect('/login');

  const orders = await listOrdersForEmail(user.email);

  return (
    <main className="customer-portal">
      <header className="customer-header">
        <div className="login-brand"><span className="login-mark"><Shirt size={21} /></span><span><b>LaundryTrack</b><small>BY NIRMAL KUMAR</small></span></div>
        <form action="/api/auth/logout" method="post"><button>Sign out</button></form>
      </header>
      <section className="customer-welcome">
        <span>YOUR LAUNDRY ACCOUNT</span>
        <h1>Hello, {user.name.split(' ')[0]}.</h1>
        <p>{orders.length ? 'Here are the orders saved with this email.' : 'No orders are saved with this email yet.'}</p>
      </section>
      <div className="customer-orders">
        {orders.map((order) => <OrderTracker key={order.code} order={order} />)}
        {orders.length === 0 && <article className="customer-order customer-empty"><h2>Nothing here yet</h2><p>When the counter creates an order with your email, it shows up on this page. You can also open the tracking link from WhatsApp without signing in.</p></article>}
      </div>
      <footer className="customer-credit">Built by <b>Nirmal Kumar</b></footer>
    </main>
  );
}
