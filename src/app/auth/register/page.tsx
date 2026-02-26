'use client';

import Link from 'next/link';
import React, { FormEvent, useState } from 'react';

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

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };

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
    <main className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <span className="auth-header__icon" aria-hidden>◆</span>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Join the InnovatEPAM Portal to share your ideas</p>
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
          <div className="form-group">
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
          </div>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
          {error ? <p className="auth-form__error">{error}</p> : null}
          {success ? <p className="auth-form__success">{success}</p> : null}
        </form>

        <p className="auth-form__footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          Already have an account? <Link href="/auth/login" className="link">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
