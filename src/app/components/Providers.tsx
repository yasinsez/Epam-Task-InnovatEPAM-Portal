'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

import { AuthProvider } from '@/app/components/AuthContext';

/**
 * App-level providers for auth context and session state.
 * Receives initial session from server to avoid client-side loading flash.
 */
export function Providers({
  children,
  session,
}: Readonly<{ children: React.ReactNode; session?: Session | null }>) {
  return (
    <SessionProvider session={session}>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  );
}
