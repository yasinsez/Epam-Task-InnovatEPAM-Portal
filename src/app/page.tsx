/**
 * Home Page / Root Route
 *
 * Entry point for the InnovatEPAM Portal. This page intelligently
 * redirects users based on their authentication status:
 * - Authenticated users → `/dashboard` (main application)
 * - Unauthenticated users → `/auth` (authentication landing page)
 *
 * @module app/page
 */

'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import React from 'react';

/**
 * Home Page Component
 *
 * Provides intelligent routing based on authentication state.
 * Shows a brief loading state while determining user's authentication status,
 * then redirects to the appropriate page.
 *
 * @returns {React.ReactElement | null} Loading state or null during redirect
 *
 * @example
 * // User visits /
 * // If authenticated: Redirects to /dashboard
 * // If unauthenticated: Redirects to /auth
 * // During check: Shows "Loading..."
 */
export default function HomePage(): React.ReactElement | null {
  const { status } = useSession();
  const router = useRouter();

  /**
   * Effect: Redirect based on authentication status
   *
   * Monitors session status and performs client-side redirect
   * to either dashboard (authenticated) or auth page (unauthenticated).
   *
   * @effect
   */
  useEffect(() => {
    if (status === 'authenticated') {
      // Authenticated users go to dashboard
      router.replace('/dashboard');
    } else if (status === 'unauthenticated') {
      // Unauthenticated users go to auth landing page
      router.replace('/auth');
    }
    // If status is 'loading', wait for the useSession hook to complete
  }, [status, router]);

  /**
   * Loading State: Session verification in progress
   *
   * Displays while NextAuth checks session validity.
   * Uses ARIA live region for accessibility.
   */
  if (status === 'loading') {
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        <p>Loading...</p>
      </div>
    );
  }

  /**
   * Return null while client-side navigation is in progress
   *
   * Prevents flash of content as page redirects.
   */
  return null;
}

