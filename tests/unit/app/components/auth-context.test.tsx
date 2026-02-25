import { renderToString } from 'react-dom/server';

import { AuthProvider, useAuthContext } from '@/app/components/AuthContext';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

describe('AuthContext', () => {
  const { useSession } = jest.requireMock('next-auth/react');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes role from session', () => {
    useSession.mockReturnValue({ data: { user: { role: 'admin' } } });

    const RoleDisplay = () => {
      const { role } = useAuthContext();
      return <span>{role}</span>;
    };

    const markup = renderToString(
      <AuthProvider>
        <RoleDisplay />
      </AuthProvider>,
    );

    expect(markup).toContain('admin');
  });
});
