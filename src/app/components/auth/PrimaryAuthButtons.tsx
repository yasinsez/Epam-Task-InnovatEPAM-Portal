/**
 * Primary Authentication Buttons Component
 *
 * Renders the main Call-to-Action buttons (Sign In and Create Account)
 * for the authentication landing page. Uses Next.js Link for client-side
 * navigation and follows WCAG 2.1 AA touch target guidelines (44×44px).
 *
 * @module components/auth/PrimaryAuthButtons
 */

'use client';

import Link from 'next/link';
import React from 'react';

/**
 * Props interface for PrimaryAuthButtons component
 *
 * @interface PrimaryAuthButtonsProps
 * @property {string} [signInLabel="Sign In"] - Text for Sign In button
 * @property {string} [createAccountLabel="Create Account"] - Text for Create Account button
 * @property {() => void} [onSignInClick] - Optional callback for Sign In click (testing)
 * @property {() => void} [onCreateAccountClick] - Optional callback for Create Account click (testing)
 * @property {string} [className] - Optional CSS class for container
 */
export interface PrimaryAuthButtonsProps {
  signInLabel?: string;
  createAccountLabel?: string;
  onSignInClick?: () => void;
  onCreateAccountClick?: () => void;
  className?: string;
}

/**
 * Primary Authentication Buttons
 *
 * Renders Sign In and Create Account CTAs with responsive layout.
 * - Mobile: Stacked vertically
 * - Tablet/Desktop: Displayed in a row
 *
 * Uses Next.js Link for fast client-side navigation and applies
 * global button styles (.btn, .btn--primary, .btn--secondary).
 *
 * @param {PrimaryAuthButtonsProps} props - Component props
 * @returns {React.ReactElement} Rendered button container
 *
 * @example
 * ```tsx
 * <PrimaryAuthButtons
 *   signInLabel="Sign In"
 *   createAccountLabel="Create Account"
 * />
 * ```
 */
export function PrimaryAuthButtons({
  signInLabel = 'Sign In',
  createAccountLabel = 'Create Account',
  onSignInClick,
  onCreateAccountClick,
  className,
}: PrimaryAuthButtonsProps): React.ReactElement {
  /**
   * Handles Sign In button click.
   * Calls optional callback while allowing Link navigation.
   */
  const handleSignInClick = () => {
    onSignInClick?.();
  };

  /**
   * Handles Create Account button click.
   * Calls optional callback while allowing Link navigation.
   */
  const handleCreateAccountClick = () => {
    onCreateAccountClick?.();
  };

  return (
    <div className={className ?? 'auth-buttons'}>
      <Link
        href="/auth/login"
        className="btn btn--secondary"
        onClick={handleSignInClick}
        data-testid="btn-sign-in"
      >
        {signInLabel}
      </Link>
      <Link
        href="/auth/register"
        className="btn btn--primary"
        onClick={handleCreateAccountClick}
        data-testid="btn-create-account"
      >
        {createAccountLabel}
      </Link>
    </div>
  );
}
