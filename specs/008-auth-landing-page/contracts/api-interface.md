# Public API Interface: Auth Landing Page

**Specification** | **Feature**: [008-auth-landing-page](../spec.md)

---

## 1. React Component Exports

### 1.1 AuthLandingPage (Main Component)

**Type**: Next.js Server Component  
**Location**: `src/app/auth/page.tsx`  
**Export**: Default export

```tsx
/**
 * Authentication Landing Page Component
 *
 * This is the main entry point for unauthenticated users accessing /auth route.
 * It displays a welcoming interface with options to Sign In or Create Account.
 *
 * **Features:**
 * - NextAuth session check with automatic redirect for authenticated users
 * - Responsive mobile-first design (320px - 1200px+)
 * - WCAG 2.1 AA accessibility compliance
 * - SEO-optimized with Metadata API
 * - Optional "Forgot Password?" link (P3 feature)
 *
 * **Server Component Benefits:**
 * - No JavaScript overhead for rendering page structure
 * - Direct server access for session validation
 * - Better SEO and performance metrics
 *
 * **Client-Side Interactivity:**
 * - useSession() hook for session checking
 * - useRouter() hook for authenticated user redirects
 *
 * @component
 * @returns {React.ReactNode} Rendered auth landing page or loading/redirect state
 *
 * @example
 * // Automatic routing via Next.js App Router
 * // User visits /auth → Component renders
 * // If authenticated → useEffect redirects to /dashboard
 * // If unauthenticated → Landing page displays with Sign In / Create Account CTAs
 *
 * @throws {undefined} No explicit errors thrown
 * @async
 */
export default function AuthLandingPage(): React.ReactNode
```

---

### 1.2 AuthLandingHeader (Sub-Component)

**Type**: React Server Component  
**Suggested Location**: `src/app/components/auth/AuthLandingHeader.tsx`  
**Export**: Named export

```tsx
/**
 * Auth Landing Page Header Component
 *
 * Displays welcoming heading and introductory description text.
 * Renders semantic HTML with h1 for accessibility and SEO.
 *
 * **Responsibilities:**
 * - Render page title in <h1> tag
 * - Display optional logo image
 * - Display descriptive subtitle
 * - Maintain proper heading hierarchy
 * - Ensure sufficient color contrast for accessibility
 *
 * **Accessibility Features:**
 * - Semantic <h1> for screen readers
 * - No redundant ARIA labels (native semantics sufficient)
 * - Proper heading hierarchy (no skipped levels)
 *
 * **Responsive Behavior:**
 * - Font sizes adjust for mobile/tablet/desktop
 * - Logo size responsive
 * - No horizontal overflow on any viewport
 *
 * @component
 * @param {AuthLandingHeaderProps} props - Component props
 * @param {string} props.title - Main heading text (e.g., "InnovatEPAM Portal")
 * @param {string} props.subtitle - Descriptive subtitle (1-2 sentences)
 * @param {string} [props.logoUrl] - Optional URL to brand logo
 * @param {string} [props.className] - Optional CSS class for styling
 * @returns {React.ReactNode} Rendered header section
 *
 * @example
 * <AuthLandingHeader
 *   title="InnovatEPAM Portal"
 *   subtitle="Share your innovation ideas and collaborate with your team"
 *   logoUrl="/images/logo.svg"
 *   className="auth-header"
 * />
 *
 * @throws {undefined} No runtime errors thrown
 */
export function AuthLandingHeader(props: AuthLandingHeaderProps): React.ReactNode
```

**Type Definition**:
See [component-interfaces.ts](./component-interfaces.ts) → `AuthLandingHeaderProps`

---

### 1.3 PrimaryAuthButtons (Sub-Component)

**Type**: React Client Component (with button handlers)  
**Suggested Location**: `src/app/components/auth/PrimaryAuthButtons.tsx`  
**Export**: Named export

```tsx
/**
 * Primary Authentication Buttons Component
 *
 * Renders the two main CTAs: "Sign In" and "Create Account" buttons.
 * Buttons navigate to /auth/login and /auth/register respectively.
 *
 * **Responsibilities:**
 * - Render "Sign In" button linking to /auth/login
 * - Render "Create Account" button linking to /auth/register
 * - Apply responsive layout (stack on mobile, side-by-side on desktop)
 * - Handle button styling (primary vs. secondary variants)
 * - Ensure WCAG accessibility (44x44px touch targets, keyboard nav, focus indicators)
 *
 * **Accessibility Features:**
 * - Semantic <button> or <a> elements
 * - Meaningful button text (not "Click Here")
 * - Visible focus indicator (3px outline, 3:1 contrast minimum)
 * - Keyboard-navigable (Tab + Enter/Space)
 * - ARIA labels for screen readers (if icon-only buttons used)
 * - Touch targets 44×44px minimum with 8px spacing
 *
 * **Responsive Behavior:**
 * - Mobile (320-620px): Buttons stack vertically, 100% width
 * - Tablet (621-1024px): Buttons side-by-side, adjusted spacing
 * - Desktop (1025px+): Buttons side-by-side, centered in card
 *
 * @component
 * @param {PrimaryAuthButtonsProps} props - Component props
 * @param {string} [props.signInLabel="Sign In"] - Text for Sign In button
 * @param {string} [props.createAccountLabel="Create Account"] - Text for Create Account button
 * @param {() => void} [props.onSignInClick] - Callback on Sign In click (testing)
 * @param {() => void} [props.onCreateAccountClick] - Callback on Create Account click (testing)
 * @param {string} [props.className] - Optional CSS class name for button container
 * @returns {React.ReactNode} Rendered buttons
 *
 * @example
 * // Basic usage (navigation via Next.js Link)
 * <PrimaryAuthButtons
 *   signInLabel="Sign In"
 *   createAccountLabel="Create Account"
 * />
 *
 * @example
 * // With testing callbacks
 * <PrimaryAuthButtons
 *   onSignInClick={() => navigate('/auth/login')}
 *   onCreateAccountClick={() => navigate('/auth/register')}
 * />
 *
 * @throws {undefined} No runtime errors thrown
 */
export function PrimaryAuthButtons(props: PrimaryAuthButtonsProps): React.ReactNode
```

**Type Definition**:
See [component-interfaces.ts](./component-interfaces.ts) → `PrimaryAuthButtonsProps`, `AuthButton`

---

### 1.4 SecondaryAuthLinks (Sub-Component)

**Type**: React Server Component  
**Suggested Location**: `src/app/components/auth/SecondaryAuthLinks.tsx`  
**Export**: Named export

```tsx
/**
 * Secondary Authentication Links Component
 *
 * Renders optional secondary links like "Forgot Password?" and informational
 * hints about cross-links between auth forms (login/register).
 *
 * **Responsibilities:**
 * - Render optional "Forgot Password?" link
 * - Display hints about switching between login/register forms
 * - Apply subtle styling (lower visual priority than primary buttons)
 * - Maintain WCAG accessibility for links
 *
 * **Accessibility Features:**
 * - Semantic <a> elements
 * - Meaningful link text ("Forgot Password?" not "Here")
 * - Sufficient color contrast (3:1 minimum for links)
 * - Keyboard-navigable (Tab key)
 * - Visible focus indicator
 *
 * **Responsive Behavior:**
 * - Responsive text sizing
 * - No horizontal overflow
 * - Adequate spacing from other elements
 *
 * @component
 * @param {SecondaryAuthLinksProps} props - Component props
 * @param {boolean} [props.showForgotPassword=false] - Show "Forgot Password?" link (P3 feature)
 * @param {string} [props.forgotPasswordLabel="Forgot Password?"] - Text for forgot password link
 * @param {boolean} [props.showCrossLinksHint=false] - Show hints about auth form cross-links
 * @param {string} [props.className] - Optional CSS class name
 * @returns {React.ReactNode} Rendered links section
 *
 * @example
 * // Display only "Forgot Password?" link
 * <SecondaryAuthLinks
 *   showForgotPassword={true}
 *   forgotPasswordLabel="Forgot Password?"
 * />
 *
 * @example
 * // Display hints about cross-links (on login/register pages)
 * <SecondaryAuthLinks
 *   showCrossLinksHint={true}
 * />
 *
 * @throws {undefined} No runtime errors thrown
 */
export function SecondaryAuthLinks(props: SecondaryAuthLinksProps): React.ReactNode
```

**Type Definition**:
See [component-interfaces.ts](./component-interfaces.ts) → `SecondaryAuthLinksProps`, `AuthLink`

---

## 2. Type Definitions & Enums

All type definitions exported from this module:

```tsx
// Main component props
export interface AuthLandingPageProps { /* ... */ }
export interface AuthLandingHeaderProps { /* ... */ }
export interface PrimaryAuthButtonsProps { /* ... */ }
export interface SecondaryAuthLinksProps { /* ... */ }

// Sub-types
export interface AuthButton { /* ... */ }
export interface AuthLink { /* ... */ }
export interface UserSession { /* ... */ }
export interface AuthPageMetadata { /* ... */ }
export interface AuthPageStylesConfig { /* ... */ }
export interface AuthPageStateContext { /* ... */ }

// Enums & Unions
export enum AuthFlowRoutes { /* ... */ }
export type AuthPageState = 'loading' | 'unauthenticated' | 'authenticated' | 'error'
```

**Import Location**: `src/types/auth-landing.types.ts` (or `specs/008-auth-landing-page/contracts/component-interfaces.ts`)

**Usage Example**:
```tsx
import {
  AuthLandingPageProps,
  AuthButton,
  AuthFlowRoutes,
  UserSession,
} from '@/types/auth-landing.types';
```

---

## 3. Page Metadata Export

**Location**: `src/app/auth/page.tsx`  
**Export**: `metadata` constant (Next.js Metadata API)

```tsx
/**
 * Page metadata for SEO and browser presentation
 *
 * Uses Next.js Metadata API for type-safe SEO configuration.
 *
 * **Includes:**
 * - Page title for browser tab and search results
 * - Meta description for SERP snippet
 * - Open Graph data for social media sharing
 * - Robots instructions for search indexing
 *
 * @type {Metadata}
 * @constant
 *
 * @example
 * export const metadata: Metadata = {
 *   title: 'Sign In or Create Account - InnovatEPAM Portal',
 *   description: 'Sign in to your existing account or create a new one...',
 * }
 */
export const metadata: Metadata = { /* ... */ }
```

**Type Definition**:
See [component-interfaces.ts](./component-interfaces.ts) → `AuthLandingPageMetadata`

---

## 4. Utility Functions (Optional)

### 4.1 Navigation Utilities

**Suggested Location**: `src/lib/auth/navigation.ts`

```tsx
/**
 * Utility functions for auth-related navigation
 */

/**
 * Determine the appropriate redirect destination based on auth status
 * @param {UserSession} session - User session object
 * @param {string} [defaultRoute] - Default route if no preference
 * @returns {string} Route to redirect to
 */
export function getAuthRedirectRoute(
  session: UserSession,
  defaultRoute?: string
): string

/**
 * Check if a route is protected (requires authentication)
 * @param {string} route - Route path to check
 * @returns {boolean} True if route is protected
 */
export function isProtectedRoute(route: string): boolean

/**
 * Get the public/unauthenticated routes
 * @returns {string[]} Array of public route paths
 */
export function getPublicRoutes(): string[]
```

---

## 5. Accessibility Compliance

All exported components MUST comply with **WCAG 2.1 AA** standards:

✅ **Keyboard Navigation**: All components keyboard-navigable (Tab + Enter/Space)  
✅ **Focus Management**: Visible focus indicators (3px outline minimum)  
✅ **Color Contrast**: 4.5:1 minimum for text; 3:1 for UI components  
✅ **Touch Targets**: 44×44px minimum with 8px spacing  
✅ **Semantic HTML**: Native elements (`<button>`, `<a>`, `<h1>`) not divs with roles  
✅ **ARIA Labels**: Provided only where semantic HTML insufficient  
✅ **Screen Readers**: Tested with VoiceOver (macOS) and NVDA (Windows)  

---

## 6. Performance Requirements

All components MUST meet these performance targets:

⚡ **Page Load**: <2 seconds on standard 4G networks  
⚡ **Interactive**: <1 second on desktop  
⚡ **Server Component**: Zero client-side JavaScript overhead for page structure  
⚡ **Bundle Size**: <50KB gzipped for component JavaScript  

---

## 7. Browser & Device Support

Minimum supported:

- **Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 12+, Android Chrome 90+
- **Operating Systems**: Windows 10+, macOS 10.14+, iOS 12+, Android 7+
- **Assistive Tech**: VoiceOver (macOS/iOS), NVDA (Windows), Jaws (Windows)

---

## 8. API Stability

**Version**: 1.0.0  
**Semver Breaking Changes**:
- Removing props from component interfaces
- Changing prop type (e.g., `string` → `number`)
- Removing exported types or enums
- Changing AuthFlowRoutes enum values

**Non-Breaking Changes** (minor/patch):
- Adding new optional props
- Adding new types/interfaces
- Expanding AuthFlowRoutes with new routes
- Improving documentation

---

## 9. Testing Integration Points

All exported components MUST be testable via these methods:

```tsx
// Unit testing with React Testing Library
import { render, screen } from '@testing-library/react';

test('renders sign in button', () => {
  render(<PrimaryAuthButtons />);
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});

// E2E testing with Playwright
test('user can click sign in button', async ({ page }) => {
  await page.goto('/auth');
  await page.click('text=Sign In');
  await expect(page).toHaveURL('/auth/login');
});

// Accessibility testing with jest-axe
import { axe } from 'jest-axe';

test('should not have accessibility violations', async () => {
  const { container } = render(<AuthLandingPage />);
  const results = await axe(container);
  expect(results.violations).toHaveLength(0);
});
```

---

## 10. Development Checklist

Before marking component complete:

- [ ] All props documented with JSDoc
- [ ] Metadata export configured
- [ ] Responsive design tested (320px, 768px, 1200px+)
- [ ] Accessibility audit passed (jest-axe, Lighthouse 90+)
- [ ] Keyboard navigation tested (Tab, Enter, Space)
- [ ] Screen reader tested (VoiceOver/NVDA)
- [ ] Unit tests written (70% coverage target)
- [ ] Integration tests written (routing, session)
- [ ] E2E tests written (user flows)
- [ ] Performance audit passed (<2s load time)
- [ ] Browser compatibility verified
- [ ] Code review approved
- [ ] Branch merged to main

