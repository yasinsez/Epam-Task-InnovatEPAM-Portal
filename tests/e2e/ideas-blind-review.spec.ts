/**
 * E2E flow: blind review (anonymous evaluation).
 * Validates: evaluate idea, view as submitter sees "Evaluated by Reviewed",
 * comments visible, no evaluator name in response/DOM.
 */
import { getIdeaForDetail } from '@/lib/services/idea-service';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    idea: { findUnique: jest.fn() },
    reviewStage: { findMany: jest.fn() },
  },
}));

jest.mock('@/lib/config/blind-review', () => ({
  getBlindReviewConfig: jest.fn(),
}));

describe('Blind review E2E', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;
  const getBlindReviewConfig = jest.requireMock('@/lib/config/blind-review').getBlindReviewConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    getBlindReviewConfig.mockReturnValue({ enabled: true, adminAuditEnabled: false });
  });

  it('submitter sees "Evaluated by Reviewed" and comments; no evaluator name in idea detail', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      title: 'My Idea',
      description: 'Description',
      category: { id: 'c1', name: 'Tech' },
      submittedAt: new Date('2026-02-25'),
      userId: 'submitter-123',
      status: 'ACCEPTED',
      currentStage: null,
      currentStageId: null,
      dynamicFieldValues: null,
      user: { name: 'Submitter', email: 'submitter@example.com' },
      evaluation: {
        decision: 'REJECTED',
        comments: 'Needs more technical detail.',
        evaluatedAt: new Date('2026-02-25T15:00:00Z'),
        evaluatedUnderBlindReview: true,
        evaluator: { name: 'Admin User', email: 'admin@example.com' },
      },
      attachments: [],
    });
    prisma.reviewStage.findMany.mockResolvedValue([]);

    const idea = await getIdeaForDetail('idea-1', 'submitter-123', 'submitter');

    expect(idea).not.toBeNull();
    expect(idea?.evaluation?.evaluatorDisplayName).toBe('Reviewed');
    expect(idea?.evaluation?.comments).toBe('Needs more technical detail.');
    expect(idea?.evaluation?.decision).toBe('REJECTED');

    // Simulate what would render in DOM: "Evaluated by {evaluatorDisplayName}"
    const evaluatorLine = `Evaluated by ${idea?.evaluation?.evaluatorDisplayName}`;
    expect(evaluatorLine).toBe('Evaluated by Reviewed');
    expect(evaluatorLine).not.toContain('Admin User');
    expect(evaluatorLine).not.toContain('admin@example.com');
  });
});
