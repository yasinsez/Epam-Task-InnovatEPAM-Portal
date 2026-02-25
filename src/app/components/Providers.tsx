'use client';

import { SessionProvider } from 'next-auth/react';

import { AuthProvider } from '@/app/components/AuthContext';

/**
 * App-level providers for auth context and session state.
 */
export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  );
}
