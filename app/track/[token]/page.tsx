import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Shirt } from 'lucide-react';
import { TrackLive } from '../../../components/track-live';
import { getOrderByToken } from '../../../lib/orders';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const order = await getOrderByToken(params.token);
  return {
    title: order ? `${order.code} · LaundryTrack` : 'Tracking link · LaundryTrack',
    description: order ? `Track ${order.code} with LaundryTrack.` : 'Laundry order tracking.',
  };
}

export default async function TrackPage({ params }: { params: { token: string } }) {
  const order = await getOrderByToken(params.token);
  if (!order) notFound();

  return (
    <main className="customer-portal">
      <header className="customer-header">
        <div className="login-brand"><span className="login-mark"><Shirt size={21} /></span><span><b>LaundryTrack</b><small>BY NIRMAL KUMAR</small></span></div>
      </header>
      <TrackLive token={params.token} initial={order} />
      <footer className="customer-credit">Built by <b>Nirmal Kumar</b></footer>
    </main>
  );
}
