import { POST } from '@/app/api/ideas/[id]/evaluate/route';

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

jest.mock('@/lib/services/evaluation-service', () => ({
  evaluateIdea: jest.fn(),
}));

describe('POST /api/ideas/[id]/evaluate', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;
  const getServerSession = jest.requireMock('next-auth').getServerSession;
  const getUserRole = jest.requireMock('@/lib/auth/roles').getUserRole;
  const evaluateIdea = jest.requireMock('@/lib/services/evaluation-service')
    .evaluateIdea;

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue({ user: { id: 'admin-123' } });
    getUserRole.mockResolvedValue('admin');
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      status: 'SUBMITTED',
    });
  });

  const makeRequest = (ideaId: string, body: object) =>
    new Request(`http://localhost:3000/api/ideas/${ideaId}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('should return 401 when not authenticated', async () => {
    getServerSession.mockResolvedValue(null);

    const response = await POST(makeRequest('idea-1', { decision: 'ACCEPTED', comments: 'Good' }), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 when user is submitter', async () => {
    getUserRole.mockResolvedValue('submitter');

    const response = await POST(makeRequest('idea-1', { decision: 'ACCEPTED', comments: 'Good' }), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should return 404 when idea not found', async () => {
    prisma.idea.findUnique.mockResolvedValue(null);

    const response = await POST(makeRequest('nonexistent', { decision: 'ACCEPTED', comments: 'Good' }), {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Idea not found');
  });

  it('should return 400 when body invalid (empty comments)', async () => {
    const response = await POST(makeRequest('idea-1', { decision: 'ACCEPTED', comments: '' }), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(evaluateIdea).not.toHaveBeenCalled();
  });

  it('should return 400 when decision invalid', async () => {
    const response = await POST(
      makeRequest('idea-1', { decision: 'PENDING', comments: 'Some comments' }),
      { params: Promise.resolve({ id: 'idea-1' }) },
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(evaluateIdea).not.toHaveBeenCalled();
  });

  it('should return 409 when idea already evaluated', async () => {
    evaluateIdea.mockResolvedValue(null);

    const response = await POST(makeRequest('idea-1', { decision: 'ACCEPTED', comments: 'Great!' }), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('This idea has already been evaluated');
  });

  it('should return 200 on successful accept', async () => {
    const result = {
      id: 'idea-1',
      status: 'ACCEPTED' as const,
      evaluation: {
        decision: 'ACCEPTED',
        comments: 'Great idea!',
        evaluatedAt: new Date('2026-02-25T12:00:00Z'),
        evaluatorDisplayName: 'Admin User',
      },
    };
    evaluateIdea.mockResolvedValue(result);

    const response = await POST(makeRequest('idea-1', { decision: 'ACCEPTED', comments: 'Great idea!' }), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.idea.status).toBe('ACCEPTED');
    expect(data.idea.evaluation.decision).toBe('ACCEPTED');
    expect(data.idea.evaluation.comments).toBe('Great idea!');
  });

  it('should return 200 on successful reject', async () => {
    const result = {
      id: 'idea-1',
      status: 'REJECTED' as const,
      evaluation: {
        decision: 'REJECTED',
        comments: 'Does not fit priorities.',
        evaluatedAt: new Date('2026-02-25T12:00:00Z'),
        evaluatorDisplayName: 'Admin User',
      },
    };
    evaluateIdea.mockResolvedValue(result);

    const response = await POST(
      makeRequest('idea-1', { decision: 'REJECTED', comments: 'Does not fit priorities.' }),
      { params: Promise.resolve({ id: 'idea-1' }) },
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.idea.status).toBe('REJECTED');
    expect(data.idea.evaluation.decision).toBe('REJECTED');
  });
});
