import { renderToString } from 'react-dom/server';

import AdminDashboardPage from '@/app/admin/page';
import EvaluatorDashboardPage from '@/app/dashboard/evaluator/page';
import SubmitterDashboardPage from '@/app/dashboard/submitter/page';
import { AuthProvider } from '@/app/components/AuthContext';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

describe('Dashboard pages', () => {
  const { useSession } = jest.requireMock('next-auth/react');

  beforeEach(() => {
    jest.clearAllMocks();
    useSession.mockReturnValue({ data: { user: { role: 'admin' } } });
  });

  it('renders submitter dashboard content', () => {
    const markup = renderToString(
      <AuthProvider>
        <SubmitterDashboardPage />
      </AuthProvider>,
    );
    expect(markup).toContain('Submitter dashboard');
  });

  it('renders evaluator dashboard content', () => {
    const markup = renderToString(
      <AuthProvider>
        <EvaluatorDashboardPage />
      </AuthProvider>,
    );
    expect(markup).toContain('Evaluator dashboard');
  });

  it('renders admin dashboard content', () => {
    const markup = renderToString(
      <AuthProvider>
        <AdminDashboardPage />
      </AuthProvider>,
    );
    expect(markup).toContain('Admin dashboard');
  });
});
