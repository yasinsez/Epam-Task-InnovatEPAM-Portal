/**
 * Component Interfaces for Authentication Landing Page
 *
 * This file defines all TypeScript interfaces for components used in the
 * authentication landing page (/auth). These contracts ensure type safety
 * and serve as documentation for component behavior.
 *
 * @module types/auth-landing
 */

/**
 * Props for the main AuthLandingPage component
 *
 * This component serves as the entry point for unauthenticated users.
 * It checks authentication status and redirects authenticated users to the dashboard.
 *
 * @typedef {Object} AuthLandingPageProps
 * @property {boolean} [showForgotPassword=true] - Whether to display the "Forgot Password?" link (P3 feature)
 * @property {boolean} [showCrossLinksHint=false] - Whether to show hints about cross-links on auth forms (informational)
 *
 * @example
 * // Basic usage
 * export default function AuthLandingPage(props: AuthLandingPageProps) {
 *   const { data: session, status } = useSession();
 *   // Redirect if authenticated
 * }
 */
export interface AuthLandingPageProps {
  /**
   * Whether to display the optional "Forgot Password?" link
   * @default true
   */
  showForgotPassword?: boolean;

  /**
   * Whether to display informational hints about cross-links
   * (Links to switch between login/register forms)
   * @default false
   */
  showCrossLinksHint?: boolean;
}

/**
 * Props for the AuthLandingHeader component
 *
 * Displays the welcoming heading and optional logo.
 * Rendered as Server Component with semantic HTML.
 *
 * @typedef {Object} AuthLandingHeaderProps
 * @property {string} title - Main heading text
 * @property {string} subtitle - Descriptive subtitle (1-2 sentences)
 * @property {string} [logoUrl] - Optional URL to brand logo image
 * @property {string} [className] - Optional CSS class for styling
 *
 * @example
 * // Component usage
 * <AuthLandingHeader
 *   title="InnovatEPAM Portal"
 *   subtitle="Share your innovation ideas and collaborate with your team"
 *   logoUrl="/images/logo.svg"
 * />
 */
export interface AuthLandingHeaderProps {
  /**
   * Main heading text (e.g., "InnovatEPAM Portal")
   */
  title: string;

  /**
   * Descriptive subtitle text
   * Should be 1-2 sentences maximum
   */
  subtitle: string;

  /**
   * Optional URL to brand logo image
   * If provided, renders as <img> above the heading
   */
  logoUrl?: string;

  /**
   * Optional CSS class name for styling
   */
  className?: string;
}

/**
 * Props for the PrimaryAuthButtons component
 *
 * Renders the two main CTAs: "Sign In" and "Create Account"
 * Buttons navigate to /auth/login and /auth/register respectively.
 *
 * @typedef {Object} PrimaryAuthButtonsProps
 * @property {string} [signInLabel="Sign In"] - Text for Sign In button
 * @property {string} [createAccountLabel="Create Account"] - Text for Create Account button
 * @property {() => void} [onSignInClick] - Optional callback (for testing)
 * @property {() => void} [onCreateAccountClick] - Optional callback (for testing)
 * @property {string} [className] - Optional CSS class name
 *
 * @example
 * // Component usage
 * <PrimaryAuthButtons
 *   signInLabel="Sign In"
 *   createAccountLabel="Create Account"
 *   onSignInClick={() => router.push('/auth/login')}
 * />
 */
export interface PrimaryAuthButtonsProps {
  /**
   * Text label for Sign In button
   * @default "Sign In"
   */
  signInLabel?: string;

  /**
   * Text label for Create Account button
   * @default "Create Account"
   */
  createAccountLabel?: string;

  /**
   * Optional callback when Sign In button is clicked
   * Used primarily for testing. In production, native link navigation is used.
   */
  onSignInClick?: () => void;

  /**
   * Optional callback when Create Account button is clicked
   * Used primarily for testing. In production, native link navigation is used.
   */
  onCreateAccountClick?: () => void;

  /**
   * Optional CSS class name for styling the button container
   */
  className?: string;
}

/**
 * Individual button entry in PrimaryAuthButtons
 *
 * @typedef {Object} AuthButton
 * @property {string} label - Button text
 * @property {string} href - Navigation URL
 * @property {'primary' | 'secondary'} [variant="primary"] - Button styling variant
 * @property {string} [ariaLabel] - ARIA label for accessibility
 * @property {string} [testId] - Optional data-testid for testing
 */
export interface AuthButton {
  /**
   * Button text (displayed to user)
   */
  label: string;

  /**
   * Navigation URL when button is clicked
   */
  href: string;

  /**
   * Visual variant: primary (main action) or secondary (alternative)
   * @default "primary"
   */
  variant?: 'primary' | 'secondary';

  /**
   * ARIA label for screen readers
   * Should describe the action (e.g., "Sign in to your account")
   */
  ariaLabel?: string;

  /**
   * Optional data-testid attribute for testing
   */
  testId?: string;
}

/**
 * Props for the SecondaryAuthLinks component
 *
 * Renders optional secondary links like "Forgot Password?"
 * and informational hints about cross-links on auth forms.
 *
 * @typedef {Object} SecondaryAuthLinksProps
 * @property {boolean} [showForgotPassword=false] - Whether to display "Forgot Password?" link
 * @property {string} [forgotPasswordLabel="Forgot Password?"] - Text for forgot password link
 * @property {boolean} [showCrossLinksHint=false] - Whether to display hints about auth form cross-links
 * @property {string} [className] - Optional CSS class name
 *
 * @example
 * // Component usage
 * <SecondaryAuthLinks
 *   showForgotPassword={true}
 *   forgotPasswordLabel="Forgot Password?"
 * />
 */
export interface SecondaryAuthLinksProps {
  /**
   * Whether to display the "Forgot Password?" link (P3 feature)
   * @default false
   */
  showForgotPassword?: boolean;

  /**
   * Text label for Forgot Password link
   * @default "Forgot Password?"
   */
  forgotPasswordLabel?: string;

  /**
   * Whether to display hints about switching between login/register forms
   * @default false
   */
  showCrossLinksHint?: boolean;

  /**
   * Optional CSS class name for styling
   */
  className?: string;
}

/**
 * Individual link entry in SecondaryAuthLinks
 *
 * @typedef {Object} AuthLink
 * @property {string} label - Link text
 * @property {string} href - Navigation URL
 * @property {'primary' | 'secondary' | 'tertiary'} [priority="secondary"] - Link styling priority
 * @property {string} [testId] - Optional data-testid for testing
 */
export interface AuthLink {
  /**
   * Link text (displayed to user)
   */
  label: string;

  /**
   * Navigation URL when link is clicked
   */
  href: string;

  /**
   * Visual priority: primary, secondary, or tertiary
   * Affects color and styling prominence
   * @default "secondary"
   */
  priority?: 'primary' | 'secondary' | 'tertiary';

  /**
   * Optional data-testid attribute for testing
   */
  testId?: string;
}

/**
 * Page metadata for SEO and Next.js Metadata API
 *
 * @typedef {Object} AuthLandingPageMetadata
 * @property {string} title - Page title for <title> tag and browser tab
 * @property {string} description - Meta description for search results
 * @property {Object} [openGraph] - Open Graph metadata for social sharing
 * @property {string} [robots] - Robots meta tag for search indexing
 * @property {string} [canonical] - Canonical URL
 *
 * @example
 * export const metadata: Metadata = {
 *   title: 'Sign In or Create Account - InnovatEPAM Portal',
 *   description: 'Sign in to your account or create a new one...',
 * }
 */
export interface AuthLandingPageMetadata {
  /**
   * Page title (appears in browser tab and search results)
   */
  title: string;

  /**
   * Meta description (appears in search results snippet)
   */
  description: string;

  /**
   * Open Graph metadata for social sharing
   */
  openGraph?: {
    /**
     * OG title for social sharing
     */
    title: string;

    /**
     * OG description for social sharing
     */
    description: string;

    /**
     * OG URL for social sharing
     */
    url: string;

    /**
     * OG image URL (optional)
     */
    image?: string;
  };

  /**
   * Robots meta tag for search engines
   * @default "index, follow"
   */
  robots?: string;

  /**
   * Canonical URL to prevent duplicate content issues
   */
  canonical?: string;
}

/**
 * NextAuth session object retrieved via useSession() hook
 *
 * @typedef {Object} UserSession
 * @property {Object} [user] - Authenticated user data (undefined if unauthenticated)
 * @property {'loading' | 'authenticated' | 'unauthenticated'} status - Session status
 * @property {string} [expires] - Session expiration timestamp
 *
 * @example
 * const { data: session, status } = useSession();
 * if (status === 'authenticated') {
 *   // User is logged in
 * }
 */
export interface UserSession {
  /**
   * Authenticated user data (null/undefined if unauthenticated)
   */
  user?: {
    /**
     * User email address
     */
    email: string;

    /**
     * User display name
     */
    name: string;

    /**
     * Optional user avatar image URL
     */
    image?: string;
  };

  /**
   * Session status: loading (checking), authenticated, or unauthenticated
   * Determines which content to render
   */
  status: 'loading' | 'authenticated' | 'unauthenticated';

  /**
   * Session expiration timestamp (ISO 8601 string)
   */
  expires?: string;
}

/**
 * Authentication flow routes enum
 *
 * Centralized definition of all auth-related routes.
 * Used for navigation and route configuration.
 *
 * @example
 * // Use in components
 * <a href={AuthFlowRoutes.SIGN_IN}>Sign In</a>
 *
 * // Use in routing logic
 * if (status === 'authenticated') {
 *   router.push(AuthFlowRoutes.DASHBOARD);
 * }
 */
export enum AuthFlowRoutes {
  /**
   * Authentication landing page
   */
  LANDING = '/auth',

  /**
   * Sign in / login page
   */
  SIGN_IN = '/auth/login',

  /**
   * Create account / registration page
   */
  CREATE_ACCOUNT = '/auth/register',

  /**
   * Forgot password / password reset request page
   */
  FORGOT_PASSWORD = '/auth/forgot-password',

  /**
   * Reset password with token page
   */
  RESET_PASSWORD = '/auth/reset-password',

  /**
   * User dashboard (post-authentication destination)
   */
  DASHBOARD = '/dashboard',
}

/**
 * Styling configuration object for the Auth Landing Page
 *
 * @typedef {Object} AuthPageStylesConfig
 * @property {string} pageContainerClass - CSS class for page container
 * @property {string} cardContainerClass - CSS class for card wrapper
 * @property {string} headerContainerClass - CSS class for header section
 * @property {string} buttonContainerClass - CSS class for buttons wrapper
 * @property {string} linksContainerClass - CSS class for links wrapper
 * @property {string} primaryButtonClass - CSS class for primary button
 * @property {string} secondaryButtonClass - CSS class for secondary button
 * @property {string} linkClass - CSS class for links
 * @property {Record<string, string>} cssVariables - CSS custom properties (tokens)
 */
export interface AuthPageStylesConfig {
  /**
   * CSS class for outermost page container
   * Typically handles centering and padding
   */
  pageContainerClass: string;

  /**
   * CSS class for card/form wrapper
   * Typically handles max-width and shadow
   */
  cardContainerClass: string;

  /**
   * CSS class for header section (title + subtitle)
   */
  headerContainerClass: string;

  /**
   * CSS class for buttons container
   * Handles flex layout for responsive arrangement
   */
  buttonContainerClass: string;

  /**
   * CSS class for links container
   * Holds secondary links like "Forgot Password?"
   */
  linksContainerClass: string;

  /**
   * CSS class for primary action button
   */
  primaryButtonClass: string;

  /**
   * CSS class for secondary action button
   */
  secondaryButtonClass: string;

  /**
   * CSS class for text links
   */
  linkClass: string;

  /**
   * CSS custom properties (design tokens)
   * Key: variable name (without --)
   * Value: CSS value
   */
  cssVariables: Record<string, string>;
}

/**
 * Possible display states for the Auth Landing Page
 *
 * Union type representing all possible states the page can be in:
 * - loading: Session check in progress
 * - unauthenticated: User not logged in, show landing page
 * - authenticated: User logged in, redirect to dashboard
 * - error: Error occurred (session check failed, redirect failed, etc.)
 *
 * @typedef {'loading' | 'unauthenticated' | 'authenticated' | 'error'} AuthPageState
 */
export type AuthPageState =
  | 'loading'
  | 'unauthenticated'
  | 'authenticated'
  | 'error';

/**
 * Extended state object with additional context
 *
 * @typedef {Object} AuthPageStateContext
 * @property {AuthPageState} state - Current page state
 * @property {string} [message] - State-specific message (for loading, error states)
 * @property {() => void} [retry] - Retry function (for error state)
 */
export interface AuthPageStateContext {
  /**
   * Current page state
   */
  state: AuthPageState;

  /**
   * Optional message for user (e.g., "Loading session...", error details)
   */
  message?: string;

  /**
   * Optional retry function (displayed as button in error state)
   */
  retry?: () => void;
}
