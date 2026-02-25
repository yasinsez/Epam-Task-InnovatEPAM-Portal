'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
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
    <main style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h1>Reset Password</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label htmlFor="password">New Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
        <button type="submit">Reset password</button>
      </form>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {message ? <p style={{ color: '#0a7c2f' }}>{message}</p> : null}
    </main>
  );
}
