/**
 * Jest Test Setup Configuration
 *
 * Sets up testing utilities and polyfills for React component testing.
 * Configures jest-axe for accessibility testing and React Testing Library.
 *
 * @module jest.setup
 */

// Import testing library matchers
import '@testing-library/jest-dom';

// Import jest-axe matchers
import { toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers with jest-axe
expect.extend(toHaveNoViolations);

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

// Mock next-auth (server) - required when API routes import authOptions from auth route
jest.mock('next-auth', () => ({
  __esModule: true,
  default: () => () => Promise.resolve({ status: 200 }),
  getServerSession: jest.fn(),
}));

// Mock auth route to avoid loading NextAuth - tests that import role-guards or API routes need this
jest.mock('@/server/auth/route', () => ({
  authOptions: {},
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    const { src, alt, ...rest } = props;
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return require('react').createElement('img', { src, alt, ...rest });
  },
}));

// Suppress console errors during tests (optional)
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// };
