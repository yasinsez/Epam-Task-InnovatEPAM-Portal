'use client';

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
    <main style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h1>Forgot Password</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit">Send reset link</button>
      </form>
      {message ? <p>{message}</p> : null}
    </main>
  );
}
