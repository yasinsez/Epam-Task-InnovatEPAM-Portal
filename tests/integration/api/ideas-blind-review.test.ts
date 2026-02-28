/**
 * Integration tests for blind review behavior in idea detail.
 * GET /api/ideas/[id] returns evaluatorDisplayName masked per role and config.
 */

import { GET } from '@/app/api/ideas/[id]/route';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    idea: { findUnique: jest.fn() },
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

jest.mock('@/lib/services/form-config-service', () => ({
  getActiveConfig: jest.fn(),
}));

jest.mock('@/lib/config/blind-review', () => ({
  getBlindReviewConfig: jest.fn(),
}));

describe('GET /api/ideas/[id] blind review', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;
  const getServerSession = jest.requireMock('next-auth').getServerSession;
  const getUserRole = jest.requireMock('@/lib/auth/roles').getUserRole;
  const getBlindReviewConfig = jest.requireMock('@/lib/config/blind-review').getBlindReviewConfig;
  const getActiveConfig = jest.requireMock('@/lib/services/form-config-service').getActiveConfig;

  const ideaWithEvaluation = {
    id: 'idea-1',
    title: 'Test Idea',
    description: 'Desc',
    category: { id: 'c1', name: 'Tech' },
    submittedAt: new Date('2026-02-25'),
    userId: 'submitter-123',
    status: 'ACCEPTED',
    currentStage: null,
    currentStageId: null,
    dynamicFieldValues: null,
    user: { name: 'Submitter', email: 'submitter@example.com' },
    evaluation: {
      decision: 'ACCEPTED',
      comments: 'Good idea',
      evaluatedAt: new Date('2026-02-25T12:00:00Z'),
      evaluatedUnderBlindReview: true,
      evaluator: { name: 'Admin User', email: 'admin@example.com' },
    },
    attachments: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue({ user: { id: 'submitter-123', email: 'submitter@example.com' } });
    getUserRole.mockResolvedValue('submitter');
    getActiveConfig.mockResolvedValue(null);
    prisma.idea.findUnique.mockResolvedValue(ideaWithEvaluation);
    prisma.reviewStage.findMany.mockResolvedValue([]);
    getBlindReviewConfig.mockReturnValue({ enabled: true, adminAuditEnabled: false });
  });

  it('should return evaluatorDisplayName "Reviewed" for submitter when blind review ON', async () => {
    getBlindReviewConfig.mockReturnValue({ enabled: true, adminAuditEnabled: false });
    getUserRole.mockResolvedValue('submitter');

    const response = await GET(
      new Request('http://localhost:3000/api/ideas/idea-1'),
      { params: Promise.resolve({ id: 'idea-1' }) },
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.idea.evaluation.evaluatorDisplayName).toBe('Reviewed');
  });

  it('should return real evaluator name for admin when adminAuditEnabled ON', async () => {
    getBlindReviewConfig.mockReturnValue({ enabled: true, adminAuditEnabled: true });
    getUserRole.mockResolvedValue('admin');
    getServerSession.mockResolvedValue({ user: { id: 'admin-123', email: 'admin@example.com' } });
    // evaluatedUnderBlindReview false: admin with audit can see name
    prisma.idea.findUnique.mockResolvedValue({
      ...ideaWithEvaluation,
      evaluation: {
        ...ideaWithEvaluation.evaluation,
        evaluatedUnderBlindReview: false,
      },
      userId: 'submitter-123',
    });

    const response = await GET(
      new Request('http://localhost:3000/api/ideas/idea-1'),
      { params: Promise.resolve({ id: 'idea-1' }) },
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.idea.evaluation.evaluatorDisplayName).toBe('Admin User');
  });
});
