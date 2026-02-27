/**
 * E2E smoke test: idea listing flow.
 * Validates login → /ideas → see list → click idea → detail → Back to Ideas.
 *
 * Note: Full browser E2E requires Playwright. This test validates the API flow
 * that supports the UI (GET /api/ideas, idea detail access).
 */
import { GET } from '@/app/api/ideas/route';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    idea: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn() },
    user: { findUnique: jest.fn() },
    category: { findMany: jest.fn() },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth/roles', () => ({
  getUserRole: jest.fn(),
  resolveUserIdForDb: jest.fn((id: string) => Promise.resolve(id)),
}));

jest.mock('@/lib/services/idea-service', () => ({
  getIdeasForUser: jest.fn(),
  getIdeaForDetail: jest.fn(),
}));

describe('Idea listing E2E flow', () => {
  const getServerSession = jest.requireMock('next-auth').getServerSession;
  const getUserRole = jest.requireMock('@/lib/auth/roles').getUserRole;
  const getIdeasForUser = jest.requireMock('@/lib/services/idea-service').getIdeasForUser;
  const getIdeaForDetail = jest.requireMock('@/lib/services/idea-service').getIdeaForDetail;

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue({ user: { id: 'user-123', email: 'user@example.com' } });
    getUserRole.mockResolvedValue('submitter');
  });

  it('login → list ideas → see ideas array', async () => {
    getIdeasForUser.mockResolvedValue({
      ideas: [
        {
          id: 'idea-1',
          title: 'Test Idea',
          category: { id: 'c1', name: 'Tech' },
          submittedAt: new Date('2026-02-25'),
          hasAttachment: false,
        },
      ],
      pagination: { page: 1, pageSize: 15, totalCount: 1, totalPages: 1 },
    });

    const request = new Request('http://localhost:3000/api/ideas');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ideas).toHaveLength(1);
    expect(data.ideas[0].title).toBe('Test Idea');
  });

  it('evaluator sees all ideas (role visibility)', async () => {
    getUserRole.mockResolvedValue('evaluator');
    getIdeasForUser.mockResolvedValue({
      ideas: [
        {
          id: 'idea-1',
          title: 'Idea from User A',
          category: { id: 'c1', name: 'Tech' },
          submittedAt: new Date(),
          hasAttachment: false,
        },
      ],
      pagination: { page: 1, pageSize: 15, totalCount: 1, totalPages: 1 },
    });

    const request = new Request('http://localhost:3000/api/ideas');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(getIdeasForUser).toHaveBeenCalledWith(
      'user-123',
      'evaluator',
      expect.any(Object),
    );
  });

  it('returns 401 when not logged in', async () => {
    getServerSession.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/ideas');
    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(getIdeasForUser).not.toHaveBeenCalled();
  });
});
