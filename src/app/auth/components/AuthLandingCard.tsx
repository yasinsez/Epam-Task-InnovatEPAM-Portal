/**
 * Production-Ready Mobile-First Authentication Component
 * 
 * Usage: Copy this component and CSS module to your src/app/auth/ directory
 * Supports: 320px-1200px+ responsive design, WCAG 2.1 AA accessibility
 */

// src/app/auth/components/AuthLandingCard.tsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth-landing.module.css';

interface AuthLandingCardProps {
  showForgotPassword?: boolean;
}

export default function AuthLandingCard({
  showForgotPassword = true,
}: AuthLandingCardProps) {
  const router = useRouter();

  const handleCreateAccount = () => {
    router.push('/auth/register');
  };

  const handleSignIn = () => {
    router.push('/auth/login');
  };

  return (
    <div className={styles.authContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <h1 className={styles.mainTitle}>InnovatEPAM Portal</h1>
        <p className={styles.subtitle}>
          Enterprise innovation management platform for collaborative idea development
        </p>
      </section>

      {/* Primary CTA Buttons */}
      <div className={styles.buttonGroup} data-testid="button-group">
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={handleCreateAccount}
          aria-label="Create a new account"
          type="button"
        >
          Create Account
        </button>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={handleSignIn}
          aria-label="Sign in to existing account"
          type="button"
        >
          Sign In
        </button>
      </div>

      {/* Secondary Actions */}
      {showForgotPassword && (
        <nav className={styles.secondaryNav}>
          <Link href="/auth/forgot-password" className={styles.secondaryLink}>
            Forgot Password?
          </Link>
        </nav>
      )}

      {/* Accessibility: Skip to main content */}
      <span className={styles.srOnly}>
        End of authentication options. Use the buttons above to proceed with login or registration.
      </span>
    </div>
  );
}
