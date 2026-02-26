/**
 * Secondary Authentication Links Component
 *
 * Renders optional secondary links like "Forgot Password?" and
 * informational hints for switching between auth forms.
 *
 * @module components/auth/SecondaryAuthLinks
 */

import Link from 'next/link';
import React from 'react';

/**
 * Props interface for SecondaryAuthLinks component
 *
 * @interface SecondaryAuthLinksProps
 * @property {boolean} [showForgotPassword=false] - Show "Forgot Password?" link
 * @property {string} [forgotPasswordLabel="Forgot Password?"] - Link text
 * @property {boolean} [showCrossLinksHint=false] - Show hint about auth form navigation
 * @property {string} [className] - Optional CSS class for container
 */
export interface SecondaryAuthLinksProps {
  showForgotPassword?: boolean;
  forgotPasswordLabel?: string;
  showCrossLinksHint?: boolean;
  className?: string;
}

/**
 * Secondary Authentication Links
 *
 * Provides optional navigation aids for authentication flows:
 * - Forgot Password link for quick access to reset flow
 * - Hint about cross-links between login/register forms
 *
 * @param {SecondaryAuthLinksProps} props - Component props
 * @returns {React.ReactElement} Rendered links container
 *
 * @example
 * ```tsx
 * <SecondaryAuthLinks
 *   showForgotPassword={true}
 *   forgotPasswordLabel="Forgot Password?"
 * />
 * ```
 */
export function SecondaryAuthLinks({
  showForgotPassword = false,
  forgotPasswordLabel = 'Forgot Password?',
  showCrossLinksHint = false,
  className,
}: SecondaryAuthLinksProps): React.ReactElement {
  return (
    <nav className={className ?? 'auth-links'}>
      {showForgotPassword && (
        <Link
          href="/auth/forgot-password"
          className="link link--tertiary"
          data-testid="link-forgot-password"
        >
          {forgotPasswordLabel}
        </Link>
      )}
      {showCrossLinksHint && (
        <p className="auth-hint">
          Can&apos;t remember your password? Click &quot;Forgot Password?&quot; on the
          Sign In page.
        </p>
      )}
    </nav>
  );
}
