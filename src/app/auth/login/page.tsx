'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import React, { FormEvent, useEffect, useState } from 'react';
import { MOCK_CREDENTIALS, shouldShowMockCredentials } from '@/lib/auth/mock-credentials';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showMockCredentials = shouldShowMockCredentials();
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        const msg = result?.error;
        setError(
          msg === 'CredentialsSignin' ? 'Invalid email or password' : (msg ?? 'Invalid email or password'),
        );
        return;
      }

      router.replace('/dashboard');
      router.refresh();
    } catch {
      setError('Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Quick-fill handler for mock credentials (dev only)
   */
  const handleQuickFill = (creds: (typeof MOCK_CREDENTIALS)[keyof typeof MOCK_CREDENTIALS]) => {
    setEmail(creds.email);
    setPassword(creds.password);
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <span className="auth-header__icon" aria-hidden>◆</span>
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">Enter your credentials to access the portal</p>
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
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
          {error ? <p className="auth-form__error">{error}</p> : null}
        </form>

        <p className="auth-form__footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          Don&apos;t have an account? <Link href="/auth/register" className="link">Register</Link>
        </p>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link href="/auth/forgot-password" className="link link--tertiary">Forgot password?</Link>
        </p>

        {showMockCredentials && (
          <div
            className="auth-mock-credentials"
            style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
          >
            <p style={{ margin: '0 0 12px 0', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
              🔧 Development Credentials
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(MOCK_CREDENTIALS).map(([key, creds]) => (
                <div
                  key={key}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                    {creds.name} ({creds.role})
                  </p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.8125rem', color: '#64748b' }}>
                    📧 {creds.email}
                  </p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.8125rem', color: '#64748b' }}>
                    🔑 {creds.password}
                  </p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                    {creds.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleQuickFill(creds)}
                    className="btn btn--primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                    data-testid={`quick-fill-${key}`}
                  >
                    Quick Fill
                  </button>
                </div>
              ))}
            </div>
            <p style={{ margin: '12px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
              ⚠️ Development only
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

