import { renderToString } from 'react-dom/server';

import { AuthProvider } from '@/app/components/AuthContext';
import { RoleGuard } from '@/app/components/RoleGuard';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

describe('RoleGuard', () => {
  const { useSession } = jest.requireMock('next-auth/react');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children for allowed role', () => {
    useSession.mockReturnValue({ data: { user: { role: 'submitter' } } });

    const markup = renderToString(
      <AuthProvider>
        <RoleGuard allowedRoles={['submitter']}>
          <span>Allowed</span>
        </RoleGuard>
      </AuthProvider>,
    );

    expect(markup).toContain('Allowed');
  });

  it('hides children for disallowed role', () => {
    useSession.mockReturnValue({ data: { user: { role: 'submitter' } } });

    const markup = renderToString(
      <AuthProvider>
        <RoleGuard allowedRoles={['admin']}>
          <span>Denied</span>
        </RoleGuard>
      </AuthProvider>,
    );

    expect(markup).not.toContain('Denied');
  });
});
