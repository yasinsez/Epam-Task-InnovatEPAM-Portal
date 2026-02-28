import { POST } from '@/app/api/ideas/[id]/assign-rating/route';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    idea: { findUnique: jest.fn() },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth/roles', () => ({
  getUserRole: jest.fn(),
  resolveUserIdForDb: jest.fn((id: string) => Promise.resolve(id)),
}));

jest.mock('@/lib/services/rating-service', () => ({
  assignRating: jest.fn(),
}));

describe('POST /api/ideas/[id]/assign-rating', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;
  const getServerSession = jest.requireMock('next-auth').getServerSession;
  const getUserRole = jest.requireMock('@/lib/auth/roles').getUserRole;
  const assignRating = jest.requireMock('@/lib/services/rating-service').assignRating;

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue({ user: { id: 'admin-123', email: 'admin@test.com' } });
    getUserRole.mockResolvedValue('admin');
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      status: 'SUBMITTED',
    });
  });

  const makeRequest = (ideaId: string, body: object) =>
    new Request(`http://localhost:3000/api/ideas/${ideaId}/assign-rating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('should return 401 when not authenticated', async () => {
    getServerSession.mockResolvedValue(null);

    const response = await POST(makeRequest('idea-1', { rating: 4 }), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 when user is submitter', async () => {
    getUserRole.mockResolvedValue('submitter');

    const response = await POST(makeRequest('idea-1', { rating: 4 }), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should return 404 when idea not found', async () => {
    prisma.idea.findUnique.mockResolvedValue(null);

    const response = await POST(makeRequest('nonexistent', { rating: 4 }), {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Idea not found');
  });

  it('should return 400 when rating is missing', async () => {
    const response = await POST(makeRequest('idea-1', {}), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should return 400 when rating is out of range (0)', async () => {
    const response = await POST(makeRequest('idea-1', { rating: 0 }), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 400 when rating is out of range (6)', async () => {
    const response = await POST(makeRequest('idea-1', { rating: 6 }), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 409 when idea already accepted and rating cannot be changed', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      status: 'ACCEPTED',
    });
    assignRating.mockResolvedValue(null);

    const response = await POST(makeRequest('idea-1', { rating: 4 }), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toContain('accepted or rejected');
  });

  it('should return 200 and updated idea when assign rating succeeds', async () => {
    const assignedAt = new Date('2026-02-28T15:00:00Z');
    assignRating.mockResolvedValue({
      id: 'idea-1',
      rating: 4,
      ratingDisplay: '4/5',
      ratingAssignedAt: assignedAt,
    });

    const response = await POST(makeRequest('idea-1', { rating: 4 }), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.idea).toEqual({
      id: 'idea-1',
      rating: 4,
      ratingDisplay: '4/5',
      ratingAssignedAt: assignedAt.toISOString(),
    });
  });

  it('should allow evaluator role to assign rating', async () => {
    getUserRole.mockResolvedValue('evaluator');
    assignRating.mockResolvedValue({
      id: 'idea-1',
      rating: 3,
      ratingDisplay: '3/5',
      ratingAssignedAt: new Date(),
    });

    const response = await POST(makeRequest('idea-1', { rating: 3 }), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.idea.rating).toBe(3);
  });
});
