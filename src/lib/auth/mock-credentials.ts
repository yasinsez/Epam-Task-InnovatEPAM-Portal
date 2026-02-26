/**
 * Mock Credentials for Development
 *
 * Provides test user credentials for local development and testing.
 * These credentials should NOT be used in production.
 *
 * @module lib/auth/mock-credentials
 */

/**
 * Mock user credentials for development/testing
 */
export const MOCK_CREDENTIALS = {
  admin: {
    email: 'admin@epam.com',
    password: 'Admin@12345',
    role: 'admin',
    name: 'Admin User',
    description: 'Full system access',
  },
  submitter: {
    email: 'submitter@epam.com',
    password: 'Submitter@12345',
    role: 'submitter',
    name: 'Submitter User',
    description: 'Can submit and view ideas',
  },
  evaluator: {
    email: 'evaluator@epam.com',
    password: 'Evaluator@12345',
    role: 'evaluator',
    name: 'Evaluator User',
    description: 'Can evaluate ideas',
  },
} as const;

/**
 * Environment check for development credentials
 *
 * Returns true if mock credentials should be displayed
 * (only in development mode)
 */
export function shouldShowMockCredentials(): boolean {
  return process.env.NODE_ENV === 'development';
}
