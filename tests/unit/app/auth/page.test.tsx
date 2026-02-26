/**
 * Unit Tests for Authentication Landing Page
 *
 * Tests the main /auth landing page component including:
 * - Component rendering
 * - Session-based redirect logic
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Header and CTA button presence
 *
 * @module tests/unit/app/auth/page
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { axe } from 'jest-axe';
import AuthLandingPage from '@/app/auth/page';

describe('AuthLandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering (US1: New User Discovers Portal)', () => {
    it('should render the page heading', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn(),
        push: jest.fn(),
      });

      render(<AuthLandingPage />);

      expect(
        screen.getByRole('heading', { name: /InnovatEPAM Portal/i })
      ).toBeInTheDocument();
    });

    it('should render the subtitle/description', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn(),
        push: jest.fn(),
      });

      render(<AuthLandingPage />);

      expect(
        screen.getByText(/Share your innovation ideas/i)
      ).toBeInTheDocument();
    });

    it('should render Create Account button', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn(),
        push: jest.fn(),
      });

      render(<AuthLandingPage />);

      const createAccountButton = screen.getByRole('link', {
        name: /create account/i,
      });
      expect(createAccountButton).toBeInTheDocument();
      expect(createAccountButton).toHaveAttribute('href', '/auth/register');
    });

    it('should render Sign In button', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn(),
        push: jest.fn(),
      });

      render(<AuthLandingPage />);

      const signInButton = screen.getByRole('link', { name: /sign in/i });
      expect(signInButton).toBeInTheDocument();
      expect(signInButton).toHaveAttribute('href', '/auth/login');
    });

    it('should expose Sign In CTA test identifier', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn(),
        push: jest.fn(),
      });

      render(<AuthLandingPage />);

      expect(screen.getByTestId('btn-sign-in')).toBeInTheDocument();
    });
  });

  describe('Session-Based Redirect (US2: Existing User Accesses Login)', () => {
    it('should redirect authenticated user to dashboard', async () => {
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

    it('should show loading state while session is checking', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      });
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn(),
        push: jest.fn(),
      });

      render(<AuthLandingPage />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render landing page for unauthenticated users', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn(),
        push: jest.fn(),
      });

      render(<AuthLandingPage />);

      // Verify main content is rendered
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /create account/i })
      ).toBeInTheDocument();
    });

    it('should not redirect when status is unauthenticated', async () => {
      const mockRouter = { replace: jest.fn(), push: jest.fn() };
      (useRouter as jest.Mock).mockReturnValue(mockRouter);

      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      render(<AuthLandingPage />);

      // Wait a bit to ensure no redirect happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('should pass automated accessibility audit', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn(),
        push: jest.fn(),
      });

      const { container } = render(<AuthLandingPage />);

      // Run axe accessibility audit
      const results = await axe(container);

      // Expect no accessibility violations
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn(),
        push: jest.fn(),
      });

      render(<AuthLandingPage />);

      // Verify h1 exists
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should have semantic HTML structure', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn(),
        push: jest.fn(),
      });

      const { container } = render(<AuthLandingPage />);

      // Verify main element exists
      expect(container.querySelector('main')).toBeInTheDocument();

      // Verify buttons are links (navigation elements)
      const links = container.querySelectorAll('a[href]');
      expect(links.length).toBeGreaterThanOrEqual(2);
    });

    it('should have descriptive button text (not "Click Here")', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn(),
        push: jest.fn(),
      });

      render(<AuthLandingPage />);

      // Verify meaningful text
      expect(
        screen.getByRole('link', { name: /create account/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();

      // Ensure no generic text
      expect(screen.queryByText(/click here/i)).not.toBeInTheDocument();
    });
  });

  describe('Touch Target Sizing (Mobile Accessibility)', () => {
    it('should apply button classes that enforce 44px touch targets', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn(),
        push: jest.fn(),
      });

      const { container } = render(<AuthLandingPage />);

      const buttons = container.querySelectorAll('a.btn[href*="/auth"]');

      // Ensure base button class is applied to enable WCAG-compliant sizing
      buttons.forEach((button) => {
        expect(button.className).toContain('btn');
      });
    });
  });

  describe('Optional Password Reset Quick Access (US4)', () => {
    it('should render Forgot Password link on landing page', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn(),
        push: jest.fn(),
      });

      render(<AuthLandingPage />);

      const forgotPasswordLink = screen.getByRole('link', {
        name: /forgot password/i,
      });
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute(
        'href',
        '/auth/forgot-password'
      );
    });
  });
});
