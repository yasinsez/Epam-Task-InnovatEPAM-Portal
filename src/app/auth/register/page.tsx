'use client';

import { FormEvent, useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email.includes('@')) {
      setError('Invalid email format');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string; message?: string };

      if (!response.ok || !payload.success) {
        setError(payload.error ?? 'Registration failed');
        return;
      }

      setSuccess(payload.message ?? 'Registration successful');
      setPassword('');
    } catch {
      setError('Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h1>Register</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>

        {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
        {success ? <p style={{ color: '#0a7c2f' }}>{success}</p> : null}
      </form>
    </main>
  );
}