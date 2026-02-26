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
        setError(result?.error ?? 'Invalid email or password');
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
    <main style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h1>Login</h1>
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
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>

        {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      </form>

      <p style={{ marginTop: 16 }}>
        Don&apos;t have an account? <Link href="/auth/register">Register</Link>
      </p>

      {/* Development Only: Mock Credentials */}
      {showMockCredentials && (
        <div
          style={{
            marginTop: 32,
            padding: 16,
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: 8,
          }}
        >
          <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', fontSize: '0.9rem' }}>
            🔧 Development Credentials
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {Object.entries(MOCK_CREDENTIALS).map(([key, creds]) => (
              <div
                key={key}
                style={{
                  padding: 8,
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 4,
                }}
              >
                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: '500' }}>
                  {creds.name} ({creds.role})
                </p>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#666' }}>
                  📧 {creds.email}
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#666' }}>
                  🔑 {creds.password}
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#999' }}>
                  {creds.description}
                </p>
                <button
                  type="button"
                  onClick={() => handleQuickFill(creds)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '0.8rem',
                    backgroundColor: '#003da5',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                  data-testid={`quick-fill-${key}`}
                >
                  Quick Fill
                </button>
              </div>
            ))}
          </div>
          <p style={{ margin: '12px 0 0 0', fontSize: '0.75rem', color: '#999' }}>
            ⚠️ These credentials are for development only
          </p>
        </div>
      )}
    </main>
  );
}

