/**
 * Authentication Landing Page
 *
 * Entry point for unauthenticated users at /auth route.
 * Displays Sign In and Create Account CTAs with automatic redirect
 * for authenticated users to the dashboard.
 *
 * **Architecture Decision**: Client Component
 * - Uses NextAuth `useSession()` hook (requires 'use client' directive)
 * - Performs client-side session check and redirect
 * - Metadata handled by parent layout.tsx (Server Component)
 *
 * **Features**:
 * - NextAuth session checking with redirect for authenticated users
 * - Mobile-first responsive design (320px → 621px → 1025px breakpoints)
 * - WCAG 2.1 AA accessibility compliance (44×44px touch targets, 4.5:1 contrast)
 * - Loading state during session verification
 * - Semantic HTML structure (main, header, h1)
 *
 * @module app/auth/page
 */

'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import React, { useEffect } from 'react';
import { AuthLandingHeader } from '@/app/components/auth/AuthLandingHeader';
import { PrimaryAuthButtons } from '@/app/components/auth/PrimaryAuthButtons';
import { SecondaryAuthLinks } from '@/app/components/auth/SecondaryAuthLinks';

/**
 * Authentication Landing Page Component
 *
 * Renders the landing page for unauthenticated users with CTAs to:
 * - Sign In → /auth/login
 * - Create Account → /auth/register
 *
 * Automatically redirects authenticated users to /dashboard using
 * NextAuth session state and Next.js router.
 *
 * @returns {React.ReactElement | null} Rendered landing page, loading state, or null during redirect
 *
 * @example
 * // Unauthenticated user sees:
 * // - "InnovatEPAM Portal" heading
 * // - "Share your innovation ideas..." subtitle
 * // - "Create Account" button (primary)
 * // - "Sign In" button (secondary)
 *
 * @example
 * // Authenticated user experiences:
 * // 1. Brief loading state ("Loading...")
 * // 2. Automatic redirect to /dashboard
 * // 3. No visible content (null return during navigation)
 */
export default function AuthLandingPage(): React.ReactElement | null {
  const { data: session, status } = useSession();
  const router = useRouter();

  /**
   * Effect: Redirect authenticated users to dashboard
   *
   * Monitors session status and performs client-side redirect
   * when user is authenticated. Uses `router.replace()` to
   * prevent back-button navigation to auth page.
   *
   * @effect
   */
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Redirect authenticated users to dashboard
      // Use replace() to prevent back-button loop
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  /**
   * Loading State: Session verification in progress
   *
   * Displayed while NextAuth checks session validity.
   * Shows accessible loading message with ARIA live region.
   */
  if (status === 'loading') {
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        <p>Loading...</p>
      </div>
    );
  }

  /**
   * Redirect State: Authenticated user navigation
   *
   * Returns null while client-side navigation to /dashboard
   * is in progress. Prevents flash of auth content.
   */
  if (status === 'authenticated') {
    return null;
  }

  /**
   * Landing Page: Unauthenticated user view
   *
   * Renders semantic HTML structure with:
   * - <main> landmark for page content
   * - <header> with h1 heading
   * - Primary CTA buttons (navigation links)
   */
  return (
    <main className="auth-page">
      <div className="auth-card">
        <AuthLandingHeader
          title="InnovatEPAM Portal"
          subtitle="Share your innovation ideas and collaborate with your team to drive organizational growth"
        />

        <PrimaryAuthButtons
          signInLabel="Sign In"
          createAccountLabel="Create Account"
        />

        <SecondaryAuthLinks
          showForgotPassword={true}
          forgotPasswordLabel="Forgot Password?"
          showCrossLinksHint={false}
        />
      </div>
    </main>
  );
}
