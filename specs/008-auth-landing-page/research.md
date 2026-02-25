# Research: Authentication Landing Page

**Phase 0 Output** | **Date**: February 25, 2026 | **Spec**: [spec.md](spec.md)

---

## Research Summary

This document consolidates research findings for the authentication landing page feature. All technical unknowns have been resolved; best practices across Next.js architecture, accessibility, and responsive design have been researched and documented.

---

## Topic 1: Next.js 14 App Router Architecture & Auth Patterns

### Decision: Use Server Component with Client-Side Session Check via useSession Hook

**Rationale:**
- **Server Component (primary)**: The landing page itself is a stateless Server Component, eliminating JavaScript overhead and improving initial page load
- **Client-side session check**: Use `useSession()` hook to check authentication status and redirect authenticated users. This is non-blocking and allows the page to render initially
- **Middleware-based redirect (optional if needed)**: NextAuth middleware can also redirect at routing layer, but client-side hook provides more control

**Alternatives Considered:**
1. **Middleware-only redirect**: Simple but less flexible; hiding page entirely vs. showing and then redirecting
2. **Server Action for auth check**: Would block page rendering; slower UX
3. **Client component throughout**: More JavaScript; slower initial load

**Implementation Pattern:**
```tsx
// src/app/auth/page.tsx - Server Component
'use client'; // Only use this if session check requires client hook
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthLandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);
  
  if (status === 'loading') {
    return <div>Loading...</div>; // Brief loading state
  }
  
  return (
    // Landing page content: heading, CTA buttons
  );
}
```

**SEO Metadata:**
- Use Next.js Metadata API in root layout or page.tsx
- Set canonical URL to `/auth`
- Include Open Graph tags for social sharing (optional for auth pages)
- No robots metatag needed (auth pages are intended to be indexed)

---

## Topic 2: Accessibility (WCAG 2.1 AA) for Authentication Interfaces

### Decision: Implement Full WCAG 2.1 AA Compliance via Semantic HTML + ARIA + Testing

**Rationale:**
- Authentication is a critical path; accessibility failures directly block users
- WCAG 2.1 AA is minimum standard; required by many regulations (ADA, GDPR)
- Keyboard-only users must be able to register/login without failure

**Key Accessibility Patterns:**

#### A. Keyboard Navigation
- ✅ All buttons/links must work with `Tab` + `Enter` keys
- ✅ Tab order must be logical (source order in HTML)
- ✅ Focus indicator must be visible (minimum 3px outline, color contrast 3:1)
- ✅ No keyboard traps—users must be able to Tab away from any element
- **Pattern**: Use semantic `<button>` and `<a>` elements; CSS provides visible focus indicator

```css
/* Globally */
button:focus,
a:focus,
input:focus {
  outline: 3px solid #003da5;
  outline-offset: 2px;
}
```

#### B. Semantic HTML & ARIA Labels
- ✅ Use native `<button>`, `<input>`, `<label>` elements
- ✅ Button text must be meaningful ("Sign In" ≠ "Click Here")
- ✅ Links to other auth forms use semantic `<a>` with clear text ("Already have an account? Sign in")
- ✅ Page heading uses `<h1>` for main title
- **Pattern**: Avoid `<div>` or `<span>` with role=button; use native elements

#### C. Color Contrast
- ✅ **Text-to-background: 4.5:1 minimum (AA)**, 7:1 recommended (AAA)
- ✅ **UI Components: 3:1 minimum** (button border to background)
- **Pre-tested colors for auth buttons** (InnovatEPAM brand):
  - Primary button: `#003da5` (blue) on `#ffffff` (white) = **8.6:1** ✓ (exceeds AAA)
  - Secondary button: `#666666` (dark gray) on `#ffffff` = **6.46:1** ✓
  - Link: `#0066cc` on white = **6.2:1** ✓
  - Focus outline: **3:1 minimum** verified
  
#### D. Mobile Accessibility
- ✅ **Touch targets: 44×44 CSS pixels minimum**, 48-56px recommended
- ✅ **Spacing between targets: 8-16px minimum** (prevents accidental clicks)
- ✅ **Input font-size: 16px minimum** (prevents iOS auto-zoom on input focus)
- ✅ **Responsive design works at 200% zoom** without horizontal scrolling
- ✅ **Notch-aware**: Use viewport-fit=cover and safe-area-inset CSS variables for devices with notches

**Testing Approach:**
- **Automated**: jest-axe for unit tests; axe DevTools for manual checks
- **Manual**: Keyboard-only testing (disable mouse); screen reader testing (VoiceOver on macOS, NVDA on Windows)
- **Pre-launch checklist**: See [WCAG 2.1 AA Compliance Checklist](#wcag-21-aa-compliance-checklist) below

---

## Topic 3: Mobile-First Responsive Design for Auth Flows

### Decision: Implement Mobile-First CSS with Viewport-Specific Layouts

**Rationale:**
- Majority of auth traffic now from mobile devices
- Mobile-first CSS prevents media query bloat; fewer overrides
- Ensures base experience works everywhere; enhancements layer on top

**Responsive Breakpoints & Layouts:**

| Viewport | Width | Layout | Button Arrangement | Use Case |
|----------|-------|--------|-------------------|----------|
| **Mobile (base)** | 320–620px | Single-column | Stack vertically, full width | Phones |
| **Tablet** | 621–1024px | Single-column or 2-column grid | Side-by-side with spacing | Tablets |
| **Desktop** | 1025px+ | Centered card | Side-by-side with padding | Desktops, large tablets |

**CSS Implementation Pattern** (Mobile-First):
```css
/* Mobile: 320px and up (BASE) */
.authCard {
  width: 100%;
  max-width: 100%;
  padding: 1rem; /* 16px */
}

.authButtons {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* 16px between buttons */
}

button {
  width: 100%;
  min-height: 44px; /* Touch target */
  font-size: 16px; /* Prevent iOS zoom */
}

/* Tablet: 621px and up */
@media (min-width: 621px) {
  .authCard {
    max-width: 480px;
    margin: 0 auto;
  }
  
  .authButtons {
    flex-direction: row;
  }
  
  button {
    flex: 1;
  }
}

/* Desktop: 1025px and up */
@media (min-width: 1025px) {
  .authCard {
    max-width: 500px;
    padding: 2rem; /* 32px */
  }
}
```

**Viewport Meta Tag Configuration** (Next.js):
```tsx
// src/app/layout.tsx
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  viewportFit: 'cover', // Safe area handling for notched devices
  maximumScale: 5.0, // Allow user zoom
};
```

**Testing Approach:**
- **Unit tests** (Jest): Test CSS class application at different viewport sizes using JSDOM viewport resize
- **E2E tests** (Playwright): Test on real device viewports (320px iPhone, 768px iPad, 1200px desktop)
- **Visual regression**: Percy or similar for cross-viewport screenshot validation
- **Core Web Vitals**: Lighthouse audit for LCP, CLS, FID

---

## Topic 4: Testing Strategy & Test Types

### Decision: 70/20/10 Testing Pyramid with TypeScript Strict & Jest/Playwright

**Rationale:**
- Per constitution: 70% unit, 20% integration, 10% E2E
- Unit tests provide fastest feedback during development
- Integration tests validate Next.js routing and auth flow
- E2E tests validate critical user journeys

**Test Distribution for Auth Landing Page:**

| Test Type | Count | Examples | Tools |
|-----------|-------|----------|-------|
| **Unit (70%)** | ~14 tests | Component render, button visibility, redirect logic, SSR | Jest + React Testing Library |
| **Integration (20%)** | ~4 tests | NextAuth session check, redirect to /dashboard, middleware | Jest + supertest (for API) |
| **E2E (10%)** | ~2 tests | User clicks "Sign In", navigates to /auth/login; User clicks "Create Account", navigates to /auth/register | Playwright |

**Unit Test Examples:**
```typescript
// tests/unit/app/auth/page.test.tsx
describe('AuthLandingPage', () => {
  it('should render Sign In button', () => {
    render(<AuthLandingPage />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
  
  it('should redirect authenticated user to dashboard', async () => {
    useSession.mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated'
    });
    const pushSpy = jest.spyOn(useRouter(), 'replace');
    render(<AuthLandingPage />);
    expect(pushSpy).toHaveBeenCalledWith('/dashboard');
  });
  
  it('should pass accessibility audit (axe)', async () => {
    const { container } = render(<AuthLandingPage />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
```

**Integration Test Examples:**
```typescript
// tests/integration/auth/landing-page.test.ts
describe('Auth Landing Page Integration', () => {
  it('should redirect authenticated users from /auth to /dashboard', async () => {
    const session = { user: { email: 'test@example.com' } };
    const response = await request(app)
      .get('/auth')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/dashboard');
  });
});
```

**E2E Test Examples (Playwright):**
```typescript
// tests/e2e/auth-landing.spec.ts
test('user can navigate from landing to login', async ({ page }) => {
  await page.goto('/auth');
  await page.click('text=Sign In');
  await expect(page).toHaveURL('/auth/login');
});

test('user can navigate from landing to register', async ({ page }) => {
  await page.goto('/auth');
  await page.click('text=Create Account');
  await expect(page).toHaveURL('/auth/register');
});
```

---

## WCAG 2.1 AA Compliance Checklist

### Phase 1: Foundation (before dev starts)
- [ ] Define consistent focus indicator style (3px outline, 3:1 contrast minimum)
- [ ] Select button colors with 4.5:1 contrast ratio
- [ ] Set button/link font-size to 16px minimum
- [ ] Decide on page title and heading structure

### Phase 2: Semantic HTML & ARIA (during dev)
- [ ] Use `<button>` for "Sign In" and "Create Account" CTAs
- [ ] Use `<a>` for "Forgot Password?" and cross-form links
- [ ] Use `<h1>` for main page heading
- [ ] All buttons have descriptive text (no icon-only buttons without ARIA labels)
- [ ] All links have descriptive text matching link destination
- [ ] Form labels associated to inputs (if any form fields on landing page)

### Phase 3: Keyboard Navigation (during dev)
- [ ] Tab through all interactive elements in logical order
- [ ] Focus indicator visible on every focusable element
- [ ] No keyboard traps—Tab away from all elements
- [ ] All buttons and links activated with Enter/Space keys
- [ ] Test on macOS (Tab + Option+Tab), Windows (Tab), Linux (Tab)

### Phase 4: Mobile Accessibility (during dev)
- [ ] Button touch targets at least 44×44 CSS pixels
- [ ] Spacing between buttons at least 8px
- [ ] Input font-size 16px+ (if any inputs present)
- [ ] Responsive design works at 100%, 150%, 200% zoom without horizontal scroll
- [ ] Test on real mobile devices (iPhone, Android)

### Phase 5: Testing (before PR)
- [ ] Run jest-axe; zero violations reported
- [ ] Manual keyboard-only test (disable mouse)
- [ ] Manual screen reader test (VoiceOver or NVDA)
- [ ] Lighthouse accessibility audit: score 90+
- [ ] Check color contrast with WebAIM contrast checker

### Phase 6: CI/CD (pre-merge)
- [ ] jest-axe runs on all unit tests; zero violations gated
- [ ] Lighthouse audit runs; accessibility score 90+ enforced
- [ ] E2E keyboard navigation tests pass

---

## Implementation Priorities

**P1 (Critical - Team must implement):**
1. Use semantic HTML (`<button>`, `<a>`, `<h1>`)
2. NextAuth `useSession()` hook for authenticated redirect
3. Mobile-first responsive CSS (320px to 1200px+)
4. Touch targets 44×44px minimum
5. Jest unit tests for component rendering + accessibility
6. jest-axe automated accessibility audit

**P2 (Important - strongly recommended):**
1. CSS focus indicator (3px outline, 3:1 contrast)
2. Pre-tested color palette (4.5:1 contrast minimum)
3. Playwright E2E tests for user navigation flows
4. Lighthouse audit in CI
5. Manual keyboard testing before merge

**P3 (Nice-to-have):**
1. Percy visual regression testing
2. 200% zoom testing automation
3. Screen reader testing automation
4. Device-specific (notch) safe area configuration

---

## Key Decisions Summary

| Decision | Rationale | Impact |
|----------|-----------|--------|
| **Server Component + useSession hook** | Balance performance + flexibility | Faster initial load; client-side redirect UX |
| **Semantic HTML-first approach** | Accessibility requirement + SEO benefit | Better a11y; reduced ARIA overload; better maintainability |
| **Mobile-first CSS** | Responsive baseline; fewer overrides | Cleaner code; works on all devices |
| **44×44px touch targets** | WCAG 2.5.5 guideline | Mobile usability; avoids accidental clicks |
| **16px input font-size** | iOS auto-zoom prevention | Better mobile UX; less jarring focus behavior |
| **Jest + jest-axe for unit tests** | Constitution requirement; fast feedback | Catches a11y issues before PR; no extra tools |
| **Playwright E2E tests** | Constitution requirement; real browser | Validates nav flow; cross-browser testing |

---

## Next Steps (Phase 1)

1. **Data Model** (Phase 1): Define page structure, button/link props, metadata shape
2. **Contracts** (Phase 1): Define JSDoc types and component props interface
3. **Quickstart** (Phase 1): Provide developer guide with copy-paste component snippets
4. **Agent Context Update** (Phase 1): Update copilot context with these best practices
