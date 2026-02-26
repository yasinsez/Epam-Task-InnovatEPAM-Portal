# Quickstart: Auth Landing Page Implementation

**Get up and running in 30 minutes** | **Feature**: [008-auth-landing-page](spec.md)

---

## Overview

This quickstart provides **copy-paste code snippets** to implement the authentication landing page at `/auth`. The implementation is broken into manageable steps following Next.js App Router patterns.

**Estimated Time**: 30-45 minutes for basic implementation  
**Difficulty**: Beginner to Intermediate  
**Prerequisites**: Familiarity with Next.js 14, React, TypeScript, NextAuth.js

---

## 1. Project Setup (5 minutes)

### Prerequisites Check

Verify your project has:
- ✅ Next.js 14+ (already installed)
- ✅ TypeScript with `strict: true` (already configured)
- ✅ NextAuth.js 4+ (already installed)
- ✅ React 18+ (already installed)
- ✅ Jest + React Testing Library (already configured in dev dependencies)

### Verify Testing Setup

```bash
# Check that test scripts exist
npm run test:unit --help

# Should output Jest help (proves setup is ready)
```

If any dependency is missing, install it via:
```bash
npm install [package-name]
```

---

## 2. Create Component Files (10 minutes)

### Step 2.1: Create Type Definitions

**File**: `src/types/auth-landing.types.ts`

Copy the contents from: [`specs/008-auth-landing-page/contracts/component-interfaces.ts`](contracts/component-interfaces.ts)

```bash
# Or create file and manually copy the interfaces
touch src/types/auth-landing.types.ts
```

### Step 2.2: Create Components Directory

```bash
mkdir -p src/app/components/auth
```

### Step 2.3: AuthLandingHeader Component

**File**: `src/app/components/auth/AuthLandingHeader.tsx`

```tsx
import React from 'react';

/**
 * Auth Landing Page Header Component
 *
 * Displays welcoming heading and introductory description text.
 * Uses semantic HTML for accessibility.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Main heading text
 * @param {string} props.subtitle - Descriptive subtitle
 * @param {string} [props.logoUrl] - Optional brand logo URL
 * @param {string} [props.className] - Optional CSS class name
 * @returns {React.ReactNode} Rendered header section
 */
export function AuthLandingHeader({
  title,
  subtitle,
  logoUrl,
  className,
}: {
  title: string;
  subtitle: string;
  logoUrl?: string;
  className?: string;
}): React.ReactNode {
  return (
    <header className={className ?? 'auth-header'}>
      {logoUrl && (
        <img
          src={logoUrl}
          alt="InnovatEPAM Portal Logo"
          className="auth-logo"
        />
      )}
      <h1 className="auth-title">{title}</h1>
      <p className="auth-subtitle">{subtitle}</p>
    </header>
  );
}
```

### Step 2.4: PrimaryAuthButtons Component

**File**: `src/app/components/auth/PrimaryAuthButtons.tsx`

```tsx
'use client';

import Link from 'next/link';
import React from 'react';

/**
 * Primary Authentication Buttons Component
 *
 * Renders Sign In and Create Account CTAs with responsive layout.
 * Uses Next.js Link for client-side navigation.
 *
 * @param {Object} props - Component props
 * @param {string} [props.signInLabel="Sign In"] - Sign In button text
 * @param {string} [props.createAccountLabel="Create Account"] - Create Account button text
 * @param {() => void} [props.onSignInClick] - Optional Sign In callback (for testing)
 * @param {() => void} [props.onCreateAccountClick] - Optional Create Account callback (for testing)
 * @param {string} [props.className] - Optional container CSS class
 * @returns {React.ReactNode} Rendered buttons
 */
export function PrimaryAuthButtons({
  signInLabel = 'Sign In',
  createAccountLabel = 'Create Account',
  onSignInClick,
  onCreateAccountClick,
  className,
}: {
  signInLabel?: string;
  createAccountLabel?: string;
  onSignInClick?: () => void;
  onCreateAccountClick?: () => void;
  className?: string;
}): React.ReactNode {
  const handleSignInClick = (e: React.MouseEvent) => {
    onSignInClick?.();
  };

  const handleCreateAccountClick = (e: React.MouseEvent) => {
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
```

### Step 2.5: SecondaryAuthLinks Component

**File**: `src/app/components/auth/SecondaryAuthLinks.tsx`

```tsx
import Link from 'next/link';
import React from 'react';

/**
 * Secondary Authentication Links Component
 *
 * Renders optional secondary links like "Forgot Password?"
 * and cross-link hints for auth form navigation.
 *
 * @param {Object} props - Component props
 * @param {boolean} [props.showForgotPassword=false] - Show "Forgot Password?" link
 * @param {string} [props.forgotPasswordLabel="Forgot Password?"] - Link text
 * @param {boolean} [props.showCrossLinksHint=false] - Show hints about switching between forms
 * @param {string} [props.className] - Optional container CSS class
 * @returns {React.ReactNode} Rendered links
 */
export function SecondaryAuthLinks({
  showForgotPassword = false,
  forgotPasswordLabel = 'Forgot Password?',
  showCrossLinksHint = false,
  className,
}: {
  showForgotPassword?: boolean;
  forgotPasswordLabel?: string;
  showCrossLinksHint?: boolean;
  className?: string;
}): React.ReactNode {
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
          Can't remember your password? Click &quot;Forgot Password?&quot; on the
          Sign In page.
        </p>
      )}
    </nav>
  );
}
```

---

## 3. Create Landing Page (10 minutes)

### Step 3.1: Create Page Component

**File**: `src/app/auth/page.tsx`

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { AuthLandingHeader } from '@/app/components/auth/AuthLandingHeader';
import { PrimaryAuthButtons } from '@/app/components/auth/PrimaryAuthButtons';
import { SecondaryAuthLinks } from '@/app/components/auth/SecondaryAuthLinks';

/**
 * Authentication Landing Page
 *
 * Entry point for unauthenticated users. Displays Sign In and Create Account CTAs.
 * Automatically redirects authenticated users to the dashboard.
 *
 * **Features:**
 * - NextAuth session checking with redirect for authenticated users
 * - Mobile-first responsive design
 * - WCAG 2.1 AA accessibility compliance
 * - Optional "Forgot Password?" link
 *
 * @returns {React.ReactNode} Rendered landing page or loading state
 */
export default function AuthLandingPage(): React.ReactNode {
  const { data: session, status } = useSession();
  const router = useRouter();

  /**
   * Check authentication status and redirect if needed
   */
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Redirect authenticated users to dashboard
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  /**
   * Show loading state while session is being checked
   */
  if (status === 'loading') {
    return (
      <div className="auth-loading">
        <p>Loading...</p>
      </div>
    );
  }

  /**
   * Show nothing while redirecting (client-side navigation in progress)
   */
  if (status === 'authenticated') {
    return null;
  }

  /**
   * Render landing page for unauthenticated users
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
        />
      </div>
    </main>
  );
}
```

### Step 3.2: Add Metadata

**File**: `src/app/auth/page.tsx` (add at top, before component)

```tsx
import type { Metadata } from 'next';

/**
 * Page metadata for SEO and browser presentation
 */
export const metadata: Metadata = {
  title: 'Sign In or Create Account - InnovatEPAM Portal',
  description:
    'Sign in to your InnovatEPAM Portal account or create a new one to access innovation management features.',
  openGraph: {
    title: 'InnovatEPAM Portal',
    description:
      'Manage and evaluate innovation ideas across your organization',
    url: '/auth',
  },
  robots: 'index, follow',
};
```

---

## 4. Add Styling (10 minutes)

### Step 4.1: Add CSS to globals.css

**File**: `src/app/globals.css` (add to bottom)

```css
/* Auth Landing Page Styles */

.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem; /* 16px */
  background-color: #f5f5f5;
}

.auth-card {
  width: 100%;
  max-width: 100%;
  padding: 1.5rem; /* 24px */
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.auth-header {
  margin-bottom: 2rem; /* 32px */
}

.auth-logo {
  max-width: 80px;
  height: auto;
  margin-bottom: 1rem;
}

.auth-title {
  font-size: 1.75rem; /* 28px */
  font-weight: 700;
  color: #333333;
  margin: 0 0 0.5rem 0;
}

.auth-subtitle {
  font-size: 1rem; /* 16px */
  color: #666666;
  margin: 0;
  line-height: 1.5;
}

/* Buttons */

.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* 16px */
  margin-bottom: 1.5rem; /* 24px */
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem; /* 12px 24px */
  min-height: 44px; /* Touch target */
  font-size: 1rem; /* 16px - prevent iOS zoom */
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-family: inherit;
}

.btn--primary {
  background-color: #003da5;
  color: #ffffff;
}

.btn--primary:hover {
  background-color: #002d7a;
}

.btn--primary:focus {
  outline: 3px solid #003da5;
  outline-offset: 2px;
}

.btn--primary:active {
  background-color: #001e52;
}

.btn--secondary {
  background-color: #f0f0f0;
  color: #333333;
  border: 1px solid #d0d0d0;
}

.btn--secondary:hover {
  background-color: #e6e6e6;
}

.btn--secondary:focus {
  outline: 3px solid #003da5;
  outline-offset: 2px;
}

.btn--secondary:active {
  background-color: #d6d6d6;
}

/* Links */

.auth-links {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.link {
  color: #0066cc;
  text-decoration: none;
  font-size: 0.875rem; /* 14px */
  transition: color 0.2s ease-in-out;
}

.link:hover {
  text-decoration: underline;
}

.link:focus {
  outline: 3px solid #003da5;
  outline-offset: 2px;
}

.link--tertiary {
  color: #666666;
  font-size: 0.875rem;
}

.link--tertiary:hover {
  color: #0066cc;
}

/* Loading State */

.auth-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-size: 1rem;
  color: #666666;
}

/* Hint Text */

.auth-hint {
  font-size: 0.875rem; /* 14px */
  color: #666666;
  margin: 0;
  padding-top: 1rem;
}

/* Tablet (621px and up) */
@media (min-width: 621px) {
  .auth-card {
    max-width: 480px;
    padding: 2rem; /* 32px */
  }

  .auth-buttons {
    flex-direction: row;
  }

  .btn {
    flex: 1;
  }
}

/* Desktop (1025px and up) */
@media (min-width: 1025px) {
  .auth-card {
    max-width: 500px;
    padding: 2.5rem; /* 40px */
  }

  .auth-title {
    font-size: 2rem; /* 32px */
  }
}
```

---

## 5. Testing Setup (5 minutes)

### Step 5.1: Create Unit Tests

**File**: `tests/unit/app/auth/page.test.tsx`

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AuthLandingPage from '@/app/auth/page';

// Mock NextAuth
jest.mock('next-auth/react');

// Mock Next.js router
jest.mock('next/navigation');

describe('AuthLandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render Sign In button', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<AuthLandingPage />);

    expect(
      screen.getByRole('link', { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it('should render Create Account button', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<AuthLandingPage />);

    expect(
      screen.getByRole('link', { name: /create account/i })
    ).toBeInTheDocument();
  });

  it('should redirect authenticated user to dashboard', async () => {
    const mockRouter = { replace: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    (useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    });

    render(<AuthLandingPage />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show loading state while session is checking', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(<AuthLandingPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### Step 5.2: Run Tests

```bash
# Run all unit tests
npm run test:unit

# Run only auth landing page tests
npm run test:unit -- tests/unit/app/auth/page.test.tsx

# Run with coverage
npm run test:coverage
```

---

## 6. Verify Implementation (5 minutes)

### Checklist

- [ ] `/auth/page.tsx` created with sign in/create account buttons
- [ ] Auth components created in `src/app/components/auth/`
- [ ] Metadata added for SEO
- [ ] CSS styling applied to `globals.css`
- [ ] Unit tests written and passing
- [ ] Responsive design verified (test in browser at 320px, 768px, 1200px)
- [ ] Accessibility verified (keyboard navigation, focus indicators)
- [ ] Links navigate correctly (/auth/login, /auth/register, /auth/forgot-password)
- [ ] Authenticated users redirect to /dashboard
- [ ] Page loads in <2 seconds

### Test in Browser

```bash
# Start development server
npm run dev

# Visit in browser
# Desktop: http://localhost:3000/auth
# Mobile simulation: DevTools → Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)

# Test keyboard navigation
# 1. Press Tab to focus each button
# 2. Press Enter to click (or visit link)
# 3. Verify focus indicator visible on each element

# Test responsive design
# Resize browser: 320px, 480px, 768px, 1024px, 1200px
# Verify buttons stack on mobile, side-by-side on desktop
```

### Lighthouse Audit

```bash
# Use Chrome DevTools
# 1. Open DevTools (F12 / Cmd+Option+I)
# 2. Click "Lighthouse" tab
# 3. Check "Mobile" radio button
# 4. Click "Analyze page load"
# 5. Verify:
#    - Accessibility score: 90+
#    - Performance score: 80+
#    - Best Practices score: 80+
```

---

## 7. Next Steps

### Phase 2 Tasks (from `tasks.md`)

1. **Add E2E Tests** — Playwright tests for user navigation flows
2. **Cross-Link Integration** — Add "Already have account? Sign in" links on /auth/register
3. **Polish & Refinement** — Additional styling, animations, error handling
4. **Accessibility Testing** — Manual screen reader testing (VoiceOver, NVDA)
5. **Performance Optimization** — Image optimization, lazy loading if needed

### Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [NextAuth.js Session Docs](https://next-auth.js.org/getting-started/example)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Accessibility Testing Tools](https://www.w3.org/WAI/test-evaluate/tools/)

---

## Troubleshooting

### Issue: "useSession is not a function"

**Solution**: Ensure NextAuth middleware is configured and session provider is in layout.

```tsx
// src/app/layout.tsx
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
```

### Issue: Buttons not styled correctly

**Solution**: Verify CSS classes match. Check:
- CSS class name: `.btn`
- Button variant classes: `.btn--primary`, `.btn--secondary`
- Make sure `globals.css` is imported in `layout.tsx`

```tsx
// src/app/layout.tsx
import './globals.css';
```

### Issue: Links navigate but page doesn't change

**Solution**: Verify route exists. Check:
- `/auth/login` exists (`src/app/auth/login/page.tsx`)
- `/auth/register` exists (`src/app/auth/register/page.tsx`)
- `/auth/forgot-password` exists (`src/app/auth/forgot-password/page.tsx`)

---

## Summary

✅ **Implementation Complete!**

Your auth landing page is ready for:
- ✅ User registration flows
- ✅ User login flows
- ✅ Password reset flows
- ✅ Automated testing
- ✅ Accessibility compliance
- ✅ SEO optimization
- ✅ Mobile responsiveness

Total time invested: ~30-45 minutes for working, tested implementation.

Next: Move to Phase 2 tasks in `tasks.md` (E2E tests, refinement, optimization).
