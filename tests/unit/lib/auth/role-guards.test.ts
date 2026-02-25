jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth/roles', () => ({
  getUserRole: jest.fn(),
}));

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

describe('requireRole', () => {
  const { getServerSession } = jest.requireMock('next-auth');
  const { getUserRole } = jest.requireMock('@/lib/auth/roles');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no session', async () => {
    getServerSession.mockResolvedValue(null);

    const { requireRole } = require('@/lib/auth/role-guards');
    const handler = requireRole('admin')(async () => new Response('ok'));
    const response = await handler(new Request('http://localhost'), { params: {} });

    expect(response.status).toBe(401);
  });

  it('returns 403 when role is not allowed', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    getUserRole.mockResolvedValue('submitter');

    const { requireRole } = require('@/lib/auth/role-guards');
    const handler = requireRole('admin')(async () => new Response('ok'));
    const response = await handler(new Request('http://localhost'), { params: {} });

    expect(response.status).toBe(403);
  });

  it('calls handler when role is allowed', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    getUserRole.mockResolvedValue('admin');

    const { requireRole } = require('@/lib/auth/role-guards');
    const handler = requireRole('admin')(async () => new Response('ok'));
    const response = await handler(new Request('http://localhost'), { params: {} });

    expect(response.status).toBe(200);
  });
});
