import { GET } from '@/app/api/admin/users/route';
import { PATCH } from '@/app/api/admin/users/[userId]/role/route';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth/roles', () => ({
  getUserRole: jest.fn(),
}));

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('admin user role APIs', () => {
  const { getServerSession } = jest.requireMock('next-auth');
  const { getUserRole } = jest.requireMock('@/lib/auth/roles');
  const { prisma } = jest.requireMock('@/server/db/prisma');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/admin/users returns list for admin', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'admin-1' } });
    getUserRole.mockResolvedValue('admin');
    prisma.user.findMany.mockResolvedValue([
      { id: 'user-1', email: 'u1@epam.com', name: 'U1', role: 'SUBMITTER' },
    ]);

    const response = await GET(
      new Request('http://localhost/api/admin/users'),
      { params: {} },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.users[0].role).toBe('submitter');
  });

  it('GET /api/admin/users returns 403 for non-admin', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    getUserRole.mockResolvedValue('submitter');

    const response = await GET(
      new Request('http://localhost/api/admin/users'),
      { params: {} },
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });

  it('PATCH /api/admin/users/:userId/role updates role for admin', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'admin-1' } });
    getUserRole.mockResolvedValue('admin');
    prisma.user.findUnique.mockResolvedValue({ id: 'user-2' });
    prisma.user.update.mockResolvedValue({ id: 'user-2', role: 'EVALUATOR' });

    const request = new Request('http://localhost/api/admin/users/user-2/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'evaluator' }),
    });

    const response = await PATCH(request, { params: { userId: 'user-2' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user.role).toBe('evaluator');
  });

  it('PATCH /api/admin/users/:userId/role rejects invalid role', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'admin-1' } });
    getUserRole.mockResolvedValue('admin');

    const request = new Request('http://localhost/api/admin/users/user-2/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'invalid' }),
    });

    const response = await PATCH(request, { params: { userId: 'user-2' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid role');
  });

  it('PATCH /api/admin/users/:userId/role returns 404 when user missing', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'admin-1' } });
    getUserRole.mockResolvedValue('admin');
    prisma.user.findUnique.mockResolvedValue(null);

    const request = new Request('http://localhost/api/admin/users/missing/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'evaluator' }),
    });

    const response = await PATCH(request, { params: { userId: 'missing' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('User not found');
  });

  it('PATCH /api/admin/users/:userId/role blocks self-demotion', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'admin-1' } });
    getUserRole.mockResolvedValue('admin');

    const request = new Request('http://localhost/api/admin/users/admin-1/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'submitter' }),
    });

    const response = await PATCH(request, { params: { userId: 'admin-1' } });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });

  it('PATCH /api/admin/users/:userId/role returns 403 for non-admin', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    getUserRole.mockResolvedValue('submitter');

    const request = new Request('http://localhost/api/admin/users/user-2/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'evaluator' }),
    });

    const response = await PATCH(request, { params: { userId: 'user-2' } });

    expect(response.status).toBe(403);
  });
});
