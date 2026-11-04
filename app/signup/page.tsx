'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, ShieldCheck, Shirt } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? 'Unable to create your account.');
        return;
      }
      window.location.assign('/customer');
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
          <span className="login-kicker"><ShieldCheck size={14} /> CUSTOMER ACCOUNT</span>
          <h1>Create your account.</h1>
          <p>Sign up to see orders saved with your email.</p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <label>Name<input autoComplete="name" required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>
          <label>Email address<input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input autoComplete="new-password" type="password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create customer account'}<ArrowRight size={17} /></button>
        </form>
        <p className="login-note">Customer accounts can view orders associated with their email. Order tracking links also work without an account.</p>
        <p className="login-switch">Already have an account? <a href="/login">Sign in</a></p>
        <footer>Built by <b>Nirmal Kumar</b></footer>
      </section>
      <aside className="login-aside" aria-label="LaundryTrack brand">
        <div className="aside-orbit orbit-one" /><div className="aside-orbit orbit-two" />
        <div className="aside-content"><span>YOUR LAUNDRY ACCOUNT</span><h2>Your orders,<br />all in one place.</h2><p>Create an account to see the progress of orders linked to your email.</p></div>
        <div className="aside-signature"><span>Designed &amp; built by</span><b>Nirmal Kumar</b></div>
      </aside>
    </main>
  );
}
