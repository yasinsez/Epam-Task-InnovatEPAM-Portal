import { renderToString } from 'react-dom/server';

import { AuthProvider } from '@/app/components/AuthContext';
import { Navigation } from '@/app/components/Navigation';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

describe('Navigation', () => {
  const { useSession } = jest.requireMock('next-auth/react');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows admin items for admin role', () => {
    useSession.mockReturnValue({ data: { user: { role: 'admin' } } });

    const markup = renderToString(
      <AuthProvider>
        <Navigation />
      </AuthProvider>,
    );

    expect(markup).toContain('Admin Panel');
    expect(markup).toContain('User Management');
  });

  it('hides admin items for submitter role', () => {
    useSession.mockReturnValue({ data: { user: { role: 'submitter' } } });

    const markup = renderToString(
      <AuthProvider>
        <Navigation />
      </AuthProvider>,
    );

    expect(markup).not.toContain('Admin Panel');
    expect(markup).toContain('Submit Idea');
  });
});
