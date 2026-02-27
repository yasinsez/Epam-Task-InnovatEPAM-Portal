/**
 * Integration Tests: Auth Landing Page Redirect
 *
 * Validates that authenticated users are redirected from /auth to /dashboard.
 * This test uses mocked NextAuth session data and Next.js router behavior.
 *
 * @module tests/integration/auth/landing-page
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AuthLandingPage from '@/app/auth/page';

describe('Auth Landing Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects authenticated users to /dashboard', async () => {
    const mockRouter = { replace: jest.fn(), push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    (useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com', name: 'Test User' } },
      status: 'authenticated',
    });

    render(<AuthLandingPage />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
    });
  });
});
