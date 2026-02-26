# Data Model: Authentication Landing Page

**Phase 1 Output** | **Feature**: [008-auth-landing-page](spec.md) | **Date**: February 25, 2026

---

## 1. Page-Level Entities

### 1.1 AuthLandingPage Structure

**Purpose**: Root component for `/auth` route  
**Location**: `src/app/auth/page.tsx`  
**Component Type**: Client Component (uses `'use client'` directive)

**Properties**:
```typescript
interface AuthLandingPageProps {
  // Client Component - no props required (uses NextAuth hooks)
}
```

**Child Components**:
- `<AuthLandingHeader>` — Main heading + description
- `<PrimaryAuthButtons>` — "Sign In" and "Create Account" CTAs  
- `<SecondaryAuthLinks>` — "Forgot Password?" optional link

**State & Hooks**:
- `useSession()` → Check if user is authenticated
- `useRouter()` → Redirect authenticated users to `/dashboard`

---

## 2. Component Entities

### 2.1 AuthLandingHeader

**Purpose**: Display page title and welcoming description  
**Location**: TBD: `src/app/components/auth/AuthLandingHeader.tsx` or inline

```typescript
interface AuthLandingHeaderProps {
  /**
   * Main heading text (e.g., "InnovatEPAM Portal")
   * @example "InnovatEPAM Portal"
   */
  title: string;

  /**
   * Subtitle describing the platform (1-2 sentences max)
   * @example "Share your innovation ideas and collaborate with your team"
   */
  subtitle: string;

  /**
   * Optional branding logo URL
   * @default undefined
   * @example "/images/logo.svg"
   */
  logoUrl?: string;
}
```

**Rendering**:
- `<h1>` for title (semantic, SEO-friendly)
- `<p>` for subtitle (max 2 sentences)
- `<img>` for logo if provided

**Accessibility**:
- Heading hierarchy preserved (h1 for page title)
- No redundant ARIA labels

---

### 2.2 PrimaryAuthButtons

**Purpose**: Two main CTAs for Sign In and Create Account  
**Location**: TBD: `src/app/components/auth/PrimaryAuthButtons.tsx` or inline

```typescript
interface PrimaryAuthButtonsProps {
  /**
   * Text for Sign In button
   * @default "Sign In"
   */
  signInLabel?: string;

  /**
   * Text for Create Account button
   * @default "Create Account"
   */
  createAccountLabel?: string;

  /**
   * Callback when Sign In clicked (optional for testing)
   * In production, uses native <a> navigation
   * @default undefined (uses native link)
   */
  onSignInClick?: () => void;

  /**
   * Callback when Create Account clicked (optional for testing)
   * In production, uses native <a> navigation
   * @default undefined (uses native link)
   */
  onCreateAccountClick?: () => void;

  /**
   * CSS class name for styling
   * @default undefined
   */
  className?: string;
}
```

**Structure**:
```typescript
interface AuthButton {
  /**
   * Button text
   * @example "Sign In"
   */
  label: string;

  /**
   * Navigation URL
   * @example "/auth/login"
   */
  href: string;

  /**
   * ARIA label (used for accessibility)
   * @example "Sign in to your account"
   */
  ariaLabel: string;

  /**
   * Button variant (determines styling)
   * "primary" = main CTA, "secondary" = alternative action
   * @default "primary"
   */
  variant?: 'primary' | 'secondary';

  /**
   * Optional data-testid for testing
   * @example "btn-sign-in"
   */
  testId?: string;
}
```

**Button Specifications**:

| Button | Label | href | ariaLabel | Variant |
|--------|-------|------|-----------|---------|
| Sign In | "Sign In" | `/auth/login` | "Sign in to your account" | secondary |
| Create Account | "Create Account" | `/auth/register` | "Create a new account" | primary |

**Rendering**:
- Use `<Link>` from Next.js (or `<a>` with href)
- Buttons display as `<a href>` or `<button>` — prefer `<button>` for form submission; `<a>` for navigation (use `<a>`)
- Button sizes: 44×44px minimum (touch target)
- Spacing: 16px minimum between buttons

**Accessibility**:
- Meaningful button text (not "Click Here")
- High contrast (4.5:1 minimum)
- Visible focus indicator
- Keyboard navigable (Tab + Enter/Space)

---

### 2.3 SecondaryAuthLinks

**Purpose**: Optional "Forgot Password?" link for discovering password reset flow  
**Location**: TBD: `src/app/components/auth/SecondaryAuthLinks.tsx` or inline

```typescript
interface SecondaryAuthLinksProps {
  /**
   * Whether to show the "Forgot Password?" link
   * @default false (P3 feature)
   */
  showForgotPassword?: boolean;

  /**
   * Text for Forgot Password link
   * @default "Forgot Password?"
   */
  forgotPasswordLabel?: string;

  /**
   * Whether to show cross-links on sign-in/register pages
   * (Controls visibility of "Already have account? Sign in" on register page)
   * @default true (P2 feature)
   */
  showCrossLinks?: boolean;

  /**
   * CSS class name for styling
   * @default undefined
   */
  className?: string;
}
```

**Link Structure**:
```typescript
interface AuthLink {
  /**
   * Link text
   * @example "Forgot Password?"
   */
  label: string;

  /**
   * Navigation URL
   * @example "/auth/forgot-password"
   */
  href: string;

  /**
   * Link priority: "primary" | "secondary" | "tertiary"
   * Affects styling (color, weight)
   * @default "secondary"
   */
  priority?: 'primary' | 'secondary' | 'tertiary';

  /**
   * Optional data-testid for testing
   * @example "link-forgot-password"
   */
  testId?: string;
}
```

**Link Specifications**:

| Link | Label | href | Priority |
|------|-------|------|----------|
| Forgot Password | "Forgot Password?" | `/auth/forgot-password` | tertiary |

**Rendering**:
- Use semantic `<a>` tag
- Place below buttons (visual hierarchy)
- Subtle styling (lower contrast acceptable for tertiary links if primary contrast maintained)

**Accessibility**:
- Meaningful link text ("Forgot Password?" not "Here")
- Sufficient contrast (3:1 minimum for links)
- Keyboard accessible

---

## 3. Page-Level Metadata Entity

### 3.1 PageMetadata

**Purpose**: SEO, Open Graph, and Next.js metadata  
**Location**: `src/app/auth/page.tsx` via Metadata API

```typescript
interface PageMetadata {
  /**
   * Page title for browser tab and SEO
   * @example "Sign In - InnovatEPAM Portal"
   */
  title: string;

  /**
   * Meta description for search results
   * @example "Sign in to InnovatEPAM Portal to manage innovation ideas"
   */
  description: string;

  /**
   * Open Graph title (social sharing)
   * @example "InnovatEPAM Portal - Innovation Management"
   */
  openGraph?: {
    title: string;
    description: string;
    url: string;
  };

  /**
   * Robots meta tag for search indexing
   * @default "index, follow"
   */
  robots?: string;

  /**
   * Canonical URL
   * @default "https://innovatepam.com/auth"
   */
  canonical?: string;
}
```

**Metadata Specification**:

| Field | Value |
|-------|-------|
| **title** | "Sign In or Create Account - InnovatEPAM Portal" |
| **description** | "Sign in to your account or create a new one to access InnovatEPAM Portal's innovation management features" |
| **og:title** | "InnovatEPAM Portal" |
| **og:description** | "Manage and evaluate innovation ideas across your organization" |
| **robots** | "index, follow" |
| **canonical** | `/auth` |

---

## 4. Authentication State Entity

### 4.1 UserSession

**Purpose**: NextAuth session state checked on page load  
**Source**: NextAuth.js via `useSession()` hook

```typescript
interface UserSession {
  /**
   * Authenticated user data (null if unauthenticated)
   * @example { email: "user@example.com", name: "John Doe", image: "..." }
   */
  user?: {
    email: string;
    name: string;
    image?: string;
  };

  /**
   * Session status: loading, authenticated, unauthenticated
   * "loading" = checking session from server
   * "authenticated" = user logged in → trigger redirect
   * "unauthenticated" = user not logged in → show landing page
   * @example "authenticated" | "unauthenticated" | "loading"
   */
  status: 'loading' | 'authenticated' | 'unauthenticated';

  /**
   * Timestamp of session expiration (optional)
   * @example "2026-02-25T23:59:59Z"
   */
  expires?: string;
}
```

**Usage**:
```typescript
export default function AuthLandingPage() {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard'); // Redirect to dashboard
    }
  }, [status]);
  
  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'authenticated') return null; // Redirecting
  
  return <AuthLandingContent />; // Render landing page
}
```

---

## 5. Styling & Theme Entity

### 5.1 AuthPageStyles

**Purpose**: CSS classes and design tokens for the landing page  
**Location**: `src/app/globals.css` (global) or `src/app/auth/auth.module.css` (scoped)

```typescript
interface AuthPageStyles {
  /**
   * Page container class
   * Centers content, applies padding
   * @default "authPage"
   */
  pageClass: string;

  /**
   * Card container class
   * Wraps heading + buttons
   * @default "authCard"
   */
  cardClass: string;

  /**
   * Header section class
   * Contains h1 + subtitle
   * @default "authHeader"
   */
  headerClass: string;

  /**
   * Button container class
   * Flexbox row/column for responsive layout
   * @default "authButtons"
   */
  buttonsClass: string;

  /**
   * Links container class
   * Contains "Forgot Password?" link
   * @default "authLinks"
   */
  linksClass: string;

  /**
   * Primary button class
   * Styling for main CTA
   * @default "btn btn--primary"
   */
  primaryButtonClass: string;

  /**
   * Secondary button class
   * Styling for secondary CTA
   * @default "btn btn--secondary"
   */
  secondaryButtonClass: string;

  /**
   * Link class
   * Styling for text links
   * @default "link link--secondary"
   */
  linkClass: string;
}
```

**CSS Tokens** (from `globals.css`):

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#003da5` | Primary button background |
| `--color-primary-text` | `#ffffff` | Primary button text |
| `--color-secondary` | `#f0f0f0` | Secondary button background |
| `--color-secondary-text` | `#333333` | Secondary button text |
| `--color-link` | `#0066cc` | Link color |
| `--color-focus` | `#003da5` | Focus outline color |
| `--focus-outline` | `3px solid var(--color-focus)` | Focus indicator |
| `--padding-base` | `1rem` (16px) | Base padding |
| `--padding-large` | `2rem` (32px) | Card padding on desktop |
| `--gap-buttons` | `1rem` (16px) | Button spacing |
| `--min-touch-target` | `44px` | Minimum button size |

**Breakpoints**:
- **Mobile**: 320px–620px
- **Tablet**: 621px–1024px  
- **Desktop**: 1025px+

---

## 6. Navigation Flow Entity

### 6.1 AuthFlowRoutes

**Purpose**: Define navigation paths from landing page  
**Type**: Enum/Configuration

```typescript
enum AuthFlowRoutes {
  /**
   * Landing page route
   * @value "/auth"
   */
  LANDING = '/auth',

  /**
   * Sign in route
   * @value "/auth/login"
   */
  SIGN_IN = '/auth/login',

  /**
   * Create account route
   * @value "/auth/register"
   */
  CREATE_ACCOUNT = '/auth/register',

  /**
   * Forgot password route
   * @value "/auth/forgot-password"
   */
  FORGOT_PASSWORD = '/auth/forgot-password',

  /**
   * Dashboard route (for authenticated redirect)
   * @value "/dashboard"
   */
  DASHBOARD = '/dashboard',
}
```

**Navigation Graph**:
```
/auth (Landing Page)
  ├─→ /auth/login (Click "Sign In")
  ├─→ /auth/register (Click "Create Account")
  └─→ /auth/forgot-password (Click "Forgot Password?")

[If authenticated] → /dashboard
```

---

## 7. Error States

### 7.1 DisplayStates

**Purpose**: Handle different page states  
**Type**: Union type

```typescript
type AuthLandingPageState =
  | { status: 'loading'; message: 'Loading session...' }
  | { status: 'unauthenticated'; content: AuthLandingPageProps }
  | { status: 'authenticated'; redirecting: true; destination: '/dashboard' }
  | { status: 'error'; message: string; recoveryAction?: () => void };
```

**State Specifications**:

| State | Rendering | User Action |
|-------|-----------|------------|
| **loading** | Skeleton/spinner | Wait for session check |
| **unauthenticated** | Full landing page | Click Sign In / Create Account |
| **authenticated** | Redirect animation (optional) / null | Redirecting to dashboard |
| **error** | Error message + retry button | Report issue or retry |

---

## Relationships & Interactions

```
AuthLandingPage (root)
├── AuthLandingHeader
│   └── title: "InnovatEPAM Portal"
│   └── subtitle: "Share your innovation ideas"
│
├── PrimaryAuthButtons
│   ├── SignInButton → href="/auth/login"
│   └── CreateAccountButton → href="/auth/register"
│
├── SecondaryAuthLinks
│   └── ForgotPasswordLink → href="/auth/forgot-password"
│
└── Redirect Logic
    └── useSession() → if authenticated → router.replace('/dashboard')
```

---

## Validation Rules

### Button/Link Navigation
- ✅ All links must resolve to existing routes (`/auth/login`, `/auth/register`, `/auth/forgot-password`)
- ✅ All links must be working (no 404s)
- ❌ No broken links

### Accessibility
- ✅ All interactive elements keyboard-accessible (Tab + Enter/Space)
- ✅ Focus indicator visible (3px outline minimum)
- ✅ Color contrast 4.5:1 minimum for text
- ✅ Touch targets 44×44px minimum

### Responsiveness
- ✅ Layout readable at 320px (mobile)
- ✅ Layout readable at 768px (tablet)
- ✅ Layout readable at 1200px (desktop)
- ✅ Works at 200% zoom without horizontal scroll

### Session/Auth
- ✅ Unauthenticated users see landing page
- ✅ Authenticated users redirected to `/dashboard`
- ✅ Session check non-blocking (shows loading state)
- ✅ No sensitive data exposed in DOM

---

## Next Steps (Phase 1 → Phase 2)

1. **Contracts** — Define TypeScript interfaces and React component signatures
2. **Quickstart** — Provide developer guide with implementation examples
3. **Agent Context Update** — Update Copilot context with these data structures
4. **Tasks** (Phase 2) — Translate data model into development tasks (component creation, tests, styling, etc.)
