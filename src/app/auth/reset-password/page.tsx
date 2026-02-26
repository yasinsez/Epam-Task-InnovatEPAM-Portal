'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    const payload = (await response.json()) as {
      success?: boolean;
      message?: string;
      error?: string;
    };
    if (!response.ok || !payload.success) {
      setError(payload.error ?? 'Password reset failed');
      return;
    }

    setMessage(payload.message ?? 'Password reset successful');
    setTimeout(() => {
      globalThis.location.href = '/auth/login';
    }, 1000);
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <span className="auth-header__icon" aria-hidden>◆</span>
          <h1 className="auth-title">Reset password</h1>
          <p className="auth-subtitle">Enter your new password below</p>
        </header>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>
          <button type="submit" className="btn btn--primary">Reset password</button>
          {error ? <p className="auth-form__error">{error}</p> : null}
          {message ? <p className="auth-form__success">{message}</p> : null}
        </form>

        <p className="auth-form__footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/auth/login" className="link">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-loading"><p>Loading...</p></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
