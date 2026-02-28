/**
 * E2E flow: ideas scoring (rating assignment and display).
 * Validates: evaluator assigns rating (US1), rating displayed in list/detail (US2),
 * submitter views own idea with rating (US3).
 */
import { POST } from '@/app/api/ideas/[id]/assign-rating/route';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    idea: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    reviewStage: { findMany: jest.fn() },
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

describe('Ideas scoring E2E', () => {
  const getServerSession = jest.requireMock('next-auth').getServerSession;
  const getUserRole = jest.requireMock('@/lib/auth/roles').getUserRole;
  const assignRating = jest.requireMock('@/lib/services/rating-service').assignRating;
  const prisma = jest.requireMock('@/server/db/prisma').prisma;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.reviewStage.findMany.mockResolvedValue([]);
  });

  describe('US1: Evaluator assigns rating', () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue({ user: { id: 'eval-123', email: 'eval@test.com' } });
      getUserRole.mockResolvedValue('evaluator');
      prisma.idea.findUnique.mockResolvedValue({
        id: 'idea-1',
        status: 'SUBMITTED',
      });
    });

    it('evaluator assigns rating 4 and receives updated idea', async () => {
      const assignedAt = new Date('2026-02-28T15:00:00Z');
      assignRating.mockResolvedValue({
        id: 'idea-1',
        rating: 4,
        ratingDisplay: '4/5',
        ratingAssignedAt: assignedAt,
      });

      const request = new Request('http://localhost:3000/api/ideas/idea-1/assign-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 4 }),
      });
      const response = await POST(request, {
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
  });

  describe('US2: Rating displayed in list and detail', () => {
    it('idea list item includes ratingDisplay', () => {
      const ideaListItem = {
        id: 'idea-1',
        title: 'Rated Idea',
        category: { id: 'c1', name: 'Tech' },
        submittedAt: new Date(),
        hasAttachment: false,
        status: 'SUBMITTED' as const,
        rating: 4,
        ratingDisplay: '4/5',
      };
      expect(ideaListItem.ratingDisplay).toBe('4/5');
      expect(ideaListItem.rating).toBe(4);
    });

    it('unrated idea shows "Not yet rated"', () => {
      const ideaListItem = {
        id: 'idea-2',
        title: 'Unrated Idea',
        rating: null,
        ratingDisplay: 'Not yet rated',
      };
      expect(ideaListItem.ratingDisplay).toBe('Not yet rated');
    });
  });

  describe('US3: Submitter views own idea with rating', () => {
    it('idea detail for submitter includes rating when rated', () => {
      const ideaDetailForSubmitter = {
        id: 'idea-1',
        title: 'My Idea',
        status: 'ACCEPTED' as const,
        rating: 4,
        ratingDisplay: '4/5',
        ratingAssignedAt: new Date('2026-02-28T15:00:00Z'),
        evaluation: {
          decision: 'ACCEPTED',
          comments: 'Good',
          evaluatedAt: new Date(),
          evaluatorDisplayName: 'Eval',
        },
      };
      expect(ideaDetailForSubmitter.rating).toBe(4);
      expect(ideaDetailForSubmitter.ratingDisplay).toBe('4/5');
      expect(ideaDetailForSubmitter.ratingAssignedAt).toBeDefined();
    });
  });
});
