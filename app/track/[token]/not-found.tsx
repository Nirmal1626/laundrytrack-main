import { Shirt } from 'lucide-react';

export default function TrackNotFound() {
  return (
    <main className="customer-portal">
      <header className="customer-header">
        <div className="login-brand"><span className="login-mark"><Shirt size={21} /></span><span><b>LaundryTrack</b><small>BY NIRMAL KUMAR</small></span></div>
      </header>
      <section className="customer-welcome">
        <span>TRACKING LINK</span>
        <h1>This link is not valid.</h1>
        <p>Check the WhatsApp message from the counter, or ask them to send the tracking link again.</p>
      </section>
      <footer className="customer-credit">Built by <b>Nirmal Kumar</b></footer>
    </main>
  );
}
