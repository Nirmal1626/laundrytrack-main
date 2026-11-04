'use client';

import { useEffect, useState } from 'react';
import type { PublicOrder } from '../lib/order-types';
import { OrderTracker } from './order-tracker';

export function TrackLive({ token, initial }: { token: string; initial: PublicOrder }) {
  const [order, setOrder] = useState(initial);
  const [live, setLive] = useState(true);

  useEffect(() => {
    const tick = async () => {
      try {
        const response = await fetch(`/api/track/${token}`, { cache: 'no-store' });
        if (!response.ok) {
          setLive(false);
          return;
        }
        const body = await response.json();
        if (body.order) {
          setOrder(body.order);
          setLive(true);
        }
      } catch {
        setLive(false);
      }
    };
    const id = window.setInterval(tick, 12000);
    return () => window.clearInterval(id);
  }, [token]);

  return (
    <>
      <section className="customer-welcome">
        <span>LIVE TRACKING</span>
        <h1>Hello, {order.name.split(' ')[0]}.</h1>
        <p>{live ? 'This page updates when the counter moves your order.' : 'Showing the last status we could load. Refresh if it looks stale.'}</p>
      </section>
      <OrderTracker order={order} />
      <p className="track-footnote">Bookmark this page. The link in your WhatsApp message opens the same order.</p>
    </>
  );
}
