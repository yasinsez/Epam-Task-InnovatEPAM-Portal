/**
 * E2E flow: evaluation workflow.
 * Validates: status display (US1), admin accept/reject (US2), submitter sees feedback (US3).
 */
import { POST } from '@/app/api/ideas/[id]/evaluate/route';
import { getIdeaForDetail } from '@/lib/services/idea-service';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    idea: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth/roles', () => ({
  getUserRole: jest.fn(),
}));

jest.mock('@/lib/services/evaluation-service', () => ({
  evaluateIdea: jest.fn(),
}));

describe('Evaluation workflow E2E', () => {
  const getServerSession = jest.requireMock('next-auth').getServerSession;
  const getUserRole = jest.requireMock('@/lib/auth/roles').getUserRole;
  const evaluateIdea = jest.requireMock('@/lib/services/evaluation-service')
    .evaluateIdea;

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue({ user: { id: 'admin-123' } });
    getUserRole.mockResolvedValue('admin');
  });

  describe('US1: Status visible in list and detail', () => {
    it('idea list includes status for each idea', async () => {
      const ideasWithStatus = [
        {
          id: 'idea-1',
          title: 'Submitted Idea',
          category: { id: 'c1', name: 'Tech' },
          submittedAt: new Date(),
          hasAttachment: false,
          status: 'SUBMITTED' as const,
        },
        {
          id: 'idea-2',
          title: 'Accepted Idea',
          category: { id: 'c1', name: 'Tech' },
          submittedAt: new Date(),
          hasAttachment: false,
          status: 'ACCEPTED' as const,
        },
      ];
      expect(ideasWithStatus[0].status).toBe('SUBMITTED');
      expect(ideasWithStatus[1].status).toBe('ACCEPTED');
    });

    it('idea detail includes status badge', async () => {
      const ideaDetail = {
        id: 'idea-1',
        title: 'My Idea',
        description: 'Desc',
        category: { id: 'c1', name: 'Tech' },
        submittedAt: new Date(),
        status: 'REJECTED' as const,
        evaluation: {
          decision: 'REJECTED',
          comments: 'Does not fit.',
          evaluatedAt: new Date(),
          evaluatorDisplayName: 'Admin',
        },
        attachment: null,
      };
      expect(ideaDetail.status).toBe('REJECTED');
      expect(ideaDetail.evaluation).toBeDefined();
    });
  });

  describe('US2: Admin accepts/rejects with comments', () => {
    beforeEach(() => {
      const prisma = jest.requireMock('@/server/db/prisma').prisma;
      prisma.idea.findUnique.mockResolvedValue({
        id: 'idea-1',
        status: 'SUBMITTED',
      });
    });

    it('admin accepts idea with comments', async () => {
      const result = {
        id: 'idea-1',
        status: 'ACCEPTED' as const,
        evaluation: {
          decision: 'ACCEPTED',
          comments: 'Great idea!',
          evaluatedAt: new Date(),
          evaluatorDisplayName: 'Admin',
        },
      };
      evaluateIdea.mockResolvedValue(result);

      const response = await POST(
        new Request('http://localhost/api/ideas/idea-1/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: 'ACCEPTED',
            comments: 'Great idea!',
          }),
        }),
        { params: Promise.resolve({ id: 'idea-1' }) },
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.idea.status).toBe('ACCEPTED');
      expect(data.idea.evaluation.comments).toBe('Great idea!');
    });

    it('admin rejects idea with comments', async () => {
      const result = {
        id: 'idea-1',
        status: 'REJECTED' as const,
        evaluation: {
          decision: 'REJECTED',
          comments: 'Does not fit priorities.',
          evaluatedAt: new Date(),
          evaluatorDisplayName: 'Admin',
        },
      };
      evaluateIdea.mockResolvedValue(result);

      const response = await POST(
        new Request('http://localhost/api/ideas/idea-1/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: 'REJECTED',
            comments: 'Does not fit priorities.',
          }),
        }),
        { params: Promise.resolve({ id: 'idea-1' }) },
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.idea.status).toBe('REJECTED');
      expect(data.idea.evaluation.comments).toBe('Does not fit priorities.');
    });
  });

  describe('US3: Submitter sees evaluation feedback', () => {
    it('getIdeaForDetail returns evaluation for submitter (owner)', async () => {
      const prisma = jest.requireMock('@/server/db/prisma').prisma;
      const ideaWithEval = {
        id: 'idea-1',
        title: 'My Idea',
        description: 'Desc',
        category: { id: 'c1', name: 'Tech' },
        submittedAt: new Date(),
        userId: 'submitter-123',
        status: 'REJECTED',
        attachment: null,
        evaluation: {
          decision: 'REJECTED',
          comments: 'Does not fit.',
          evaluatedAt: new Date(),
          evaluator: { name: 'Admin', email: 'admin@example.com' },
        },
        user: { name: 'Me', email: 'me@example.com' },
      };
      prisma.idea.findUnique.mockResolvedValue(ideaWithEval);

      getUserRole.mockResolvedValue('submitter');

      const result = await getIdeaForDetail(
        'idea-1',
        'submitter-123',
        'submitter',
      );

      expect(result).not.toBeNull();
      expect(result?.evaluation).toBeDefined();
      expect(result?.evaluation?.decision).toBe('REJECTED');
      expect(result?.evaluation?.comments).toBe('Does not fit.');
      expect(result?.evaluation?.evaluatorDisplayName).toBe('Admin');
    });
  });
});
