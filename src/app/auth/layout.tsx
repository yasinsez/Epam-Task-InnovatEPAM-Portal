/**
 * Authentication Section Layout
 *
 * Provides metadata and layout structure for all authentication pages
 * (/auth, /auth/login, /auth/register, /auth/forgot-password, etc.).
 *
 * @module app/auth/layout
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * Metadata for authentication pages
 *
 * Provides SEO metadata, Open Graph tags, and browser presentation info
 * for all pages under the /auth route.
 */
export const metadata: Metadata = {
  title: 'Sign In or Create Account - InnovatEPAM Portal',
  description:
    'Sign in to your InnovatEPAM Portal account or create a new one to access innovation management features and collaborate with your team.',
  openGraph: {
    title: 'InnovatEPAM Portal - Authentication',
    description:
      'Manage and evaluate innovation ideas across your organization. Sign in or create an account to get started.',
    url: '/auth',
    siteName: 'InnovatEPAM Portal',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

/**
 * Authentication Layout Component
 *
 * Wraps all authentication pages with consistent metadata and structure.
 * Does not add additional visual elements - styling is handled per-page.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child pages/components
 * @returns {ReactNode} Rendered layout
 *
 * @example
 * ```tsx
 * <AuthLayout>
 *   <AuthLandingPage />
 * </AuthLayout>
 * ```
 */
export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return <>{children}</>;
}
