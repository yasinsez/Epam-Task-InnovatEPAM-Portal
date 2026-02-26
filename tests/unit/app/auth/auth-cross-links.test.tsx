/**
 * Unit Tests for Auth Cross-Links
 *
 * Verifies that login and registration pages contain
 * cross-navigation links between forms.
 *
 * @module tests/unit/app/auth/auth-cross-links
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPage from '@/app/auth/login/page';
import RegisterPage from '@/app/auth/register/page';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Auth Cross-Links', () => {
  it('renders Register link on Login page', () => {
    render(<LoginPage />);

    const registerLink = screen.getByRole('link', { name: /register/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/auth/register');
  });

  it('renders Sign in link on Register page', () => {
    render(<RegisterPage />);

    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/auth/login');
  });
});
