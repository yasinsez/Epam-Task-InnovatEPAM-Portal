'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const payload = (await response.json()) as { message?: string };
    setMessage(payload.message ?? 'If the email exists, a reset link has been sent');
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <span className="auth-header__icon" aria-hidden>◆</span>
          <h1 className="auth-title">Forgot password</h1>
          <p className="auth-subtitle">Enter your email to receive a reset link</p>
        </header>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn--primary">Send reset link</button>
          {message ? <p className="auth-form__success">{message}</p> : null}
        </form>

        <p className="auth-form__footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/auth/login" className="link">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
