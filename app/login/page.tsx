'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, ShieldCheck, Shirt } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [setup, setSetup] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, setup, name }),
      });
      const result = await response.json();
      if (response.status === 409 && result.needsSetup) {
        setSetup(true);
        setName(result.name ?? '');
        setError('');
        return;
      }
      if (!response.ok) {
        setError(result.error ?? 'Unable to sign in.');
        return;
      }
      window.location.assign(result.user.role === 'customer' ? '/customer' : '/');
    } catch {
      setError('Could not reach the server. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <a className="login-brand" href="/login">
          <span className="login-mark"><Shirt size={21} /></span>
          <span><b>LaundryTrack</b><small>BY NIRMAL KUMAR</small></span>
        </a>
        <div className="login-copy">
          <span className="login-kicker"><ShieldCheck size={14} /> SECURE WORKSPACE</span>
          <h1>Welcome back.</h1>
          <p>{setup ? 'Choose the password you will use next time.' : 'Sign in with your LaundryTrack email.'}</p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <label>Email address<input autoComplete="username" type="email" required value={email} onChange={(event) => { setEmail(event.target.value); setSetup(false); }} placeholder="you@example.com" /></label>
          {setup && <label>Display name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Name shown on the counter" /></label>}
          <label>Password<input autoComplete={setup ? 'new-password' : 'current-password'} type="password" required minLength={setup ? 8 : 1} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={setup ? 'At least 8 characters' : 'Enter your password'} /></label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit" disabled={busy}>{busy ? 'Signing in…' : setup ? 'Save password and sign in' : 'Sign in'}<ArrowRight size={17} /></button>
        </form>
        <p className="login-switch">New customer? <a href="/signup">Create an account</a></p>
        <p className="login-note">The owner and two counter emails sign in here. Any other email added on an order becomes a customer. Customers can also open the tracking link from WhatsApp without signing in.</p>
        <footer>Built by <b>Nirmal Kumar</b></footer>
      </section>
      <aside className="login-aside" aria-label="LaundryTrack brand">
        <div className="aside-orbit orbit-one" /><div className="aside-orbit orbit-two" />
        <div className="aside-content"><span>LAUNDRY OPERATIONS</span><h2>Every order,<br />in good hands.</h2><p>A calmer way to run the counter, track each garment, and keep customers in the loop.</p></div>
        <div className="aside-signature"><span>Designed & built by</span><b>Nirmal Kumar</b></div>
      </aside>
    </main>
  );
}