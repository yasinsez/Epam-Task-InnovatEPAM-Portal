/**
 * Authentication Landing Page Header Component
 *
 * Displays the portal title, subtitle, and optional logo
 * for the authentication landing page at /auth.
 *
 * @module components/auth/AuthLandingHeader
 */

'use client';

import Image from 'next/image';
import React from 'react';

/**
 * Props interface for AuthLandingHeader component
 *
 * @interface AuthLandingHeaderProps
 * @property {string} title - Main heading text (e.g., "InnovatEPAM Portal")
 * @property {string} subtitle - Subtitle/description text
 * @property {string} [logoUrl] - Optional logo image URL
 * @property {string} [className] - Optional CSS class for header element
 */
export interface AuthLandingHeaderProps {
  title: string;
  subtitle: string;
  logoUrl?: string;
  className?: string;
}

/**
 * Authentication Landing Page Header
 *
 * Renders the main header section with title, subtitle, and optional logo.
 * Uses semantic HTML (h1 for title) for accessibility and SEO.
 *
 * @param {AuthLandingHeaderProps} props - Component props
 * @returns {React.ReactElement} Rendered header element
 *
 * @example
 * ```tsx
 * <AuthLandingHeader
 *   title="InnovatEPAM Portal"
 *   subtitle="Share your innovation ideas with the team"
 *   logoUrl="/images/logo.png"
 * />
 * ```
 */
export function AuthLandingHeader({
  title,
  subtitle,
  logoUrl,
  className,
}: AuthLandingHeaderProps): React.ReactElement {
  return (
    <header className={className ?? 'auth-header'}>
      {logoUrl && (
        <Image
          src={logoUrl}
          alt={`${title} logo`}
          width={120}
          height={120}
          className="auth-logo"
        />
      )}
      <h1 className="auth-title">{title}</h1>
      <p className="auth-subtitle">{subtitle}</p>
    </header>
  );
}
