import {
  evaluateIdea,
  startReviewIdea,
} from '@/lib/services/evaluation-service';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    idea: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/config/blind-review', () => ({
  getBlindReviewConfig: jest.fn(),
}));

describe('evaluation-service', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;
  const getBlindReviewConfig = jest.requireMock('@/lib/config/blind-review').getBlindReviewConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    getBlindReviewConfig.mockReturnValue({ enabled: false, adminAuditEnabled: false });
  });

  it('should return null when idea not found', async () => {
    prisma.idea.findUnique.mockResolvedValue(null);

    const result = await evaluateIdea(
      'nonexistent',
      'eval-123',
      'ACCEPTED',
      'Great idea!',
    );

    expect(result).toBeNull();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should return null when idea already evaluated (ACCEPTED)', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      status: 'ACCEPTED',
      evaluation: { id: 'ev-1' },
    });

    const result = await evaluateIdea(
      'idea-1',
      'eval-123',
      'ACCEPTED',
      'Great idea!',
    );

    expect(result).toBeNull();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should return null when idea already evaluated (REJECTED)', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      status: 'REJECTED',
      evaluation: { id: 'ev-1' },
    });

    const result = await evaluateIdea(
      'idea-1',
      'eval-123',
      'REJECTED',
      'Does not fit.',
    );

    expect(result).toBeNull();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should evaluate idea successfully (ACCEPTED)', async () => {
    const updatedIdea = {
      id: 'idea-1',
      status: 'ACCEPTED' as const,
      evaluation: {
        decision: 'ACCEPTED',
        comments: 'Great idea!',
        evaluatedAt: new Date('2026-02-25T12:00:00Z'),
        evaluator: { name: 'Admin User', email: 'admin@example.com' },
      },
    };

    prisma.idea.findUnique
      .mockResolvedValueOnce({
        id: 'idea-1',
        status: 'SUBMITTED',
        evaluation: null,
      })
      .mockResolvedValue(updatedIdea);

    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        evaluation: { create: jest.fn().mockResolvedValue({}) },
        idea: {
          update: jest.fn().mockResolvedValue({}),
          findUnique: jest.fn().mockResolvedValue(updatedIdea),
        },
      };
      return fn(tx);
    });

    const result = await evaluateIdea(
      'idea-1',
      'eval-123',
      'ACCEPTED',
      'Great idea!',
    );

    expect(result).not.toBeNull();
    expect(result?.id).toBe('idea-1');
    expect(result?.status).toBe('ACCEPTED');
    expect(result?.evaluation.decision).toBe('ACCEPTED');
    expect(result?.evaluation.comments).toBe('Great idea!');
    expect(result?.evaluation.evaluatorDisplayName).toBe('Admin User');
  });

  it('should return null on unique constraint violation (first-wins 409)', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      status: 'SUBMITTED',
      evaluation: null,
    });

    const p2002Error = new Error('Unique constraint') as Error & { code: string };
    p2002Error.code = 'P2002';

    prisma.$transaction.mockRejectedValue(p2002Error);

    const result = await evaluateIdea(
      'idea-1',
      'eval-123',
      'ACCEPTED',
      'Great idea!',
    );

    expect(result).toBeNull();
  });

  it('should use Administrator when evaluator is null (mock user)', async () => {
    const updatedIdea = {
      id: 'idea-1',
      status: 'ACCEPTED' as const,
      evaluation: {
        decision: 'ACCEPTED',
        comments: 'Approved',
        evaluatedAt: new Date('2026-02-25T12:00:00Z'),
        evaluator: null,
      },
    };

    prisma.idea.findUnique
      .mockResolvedValueOnce({
        id: 'idea-1',
        status: 'SUBMITTED',
        evaluation: null,
      })
      .mockResolvedValue(updatedIdea);

    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        evaluation: { create: jest.fn().mockResolvedValue({}) },
        idea: {
          update: jest.fn().mockResolvedValue({}),
          findUnique: jest.fn().mockResolvedValue(updatedIdea),
        },
      };
      return fn(tx);
    });

    const result = await evaluateIdea(
      'idea-1',
      'mock-admin',
      'ACCEPTED',
      'Approved',
    );

    expect(result?.evaluation.evaluatorDisplayName).toBe('Administrator');
  });

  it('should use email when evaluator has no name', async () => {
    const updatedIdea = {
      id: 'idea-1',
      status: 'ACCEPTED' as const,
      evaluation: {
        decision: 'ACCEPTED',
        comments: 'OK',
        evaluatedAt: new Date('2026-02-25T12:00:00Z'),
        evaluator: { name: null, email: 'eval@epam.com' },
      },
    };

    prisma.idea.findUnique
      .mockResolvedValueOnce({
        id: 'idea-1',
        status: 'SUBMITTED',
        evaluation: null,
      })
      .mockResolvedValue(updatedIdea);

    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        evaluation: { create: jest.fn().mockResolvedValue({}) },
        idea: {
          update: jest.fn().mockResolvedValue({}),
          findUnique: jest.fn().mockResolvedValue(updatedIdea),
        },
      };
      return fn(tx);
    });

    const result = await evaluateIdea(
      'idea-1',
      'eval-123',
      'REJECTED',
      'Does not fit.',
    );

    expect(result?.evaluation.evaluatorDisplayName).toBe('eval@epam.com');
  });

  it('should set evaluatedUnderBlindReview when blind review enabled', async () => {
    const { getBlindReviewConfig } = jest.requireMock('@/lib/config/blind-review');
    getBlindReviewConfig.mockReturnValue({ enabled: true, adminAuditEnabled: false });

    const updatedIdea = {
      id: 'idea-1',
      status: 'ACCEPTED' as const,
      evaluation: {
        decision: 'ACCEPTED',
        comments: 'Approved',
        evaluatedAt: new Date('2026-02-25T12:00:00Z'),
        evaluator: { name: 'Admin', email: 'admin@example.com' },
      },
    };

    prisma.idea.findUnique
      .mockResolvedValueOnce({
        id: 'idea-1',
        status: 'SUBMITTED',
        evaluation: null,
      })
      .mockResolvedValue(updatedIdea);

    const createSpy = jest.fn().mockResolvedValue({});
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        evaluation: { create: createSpy },
        idea: {
          update: jest.fn().mockResolvedValue({}),
          findUnique: jest.fn().mockResolvedValue(updatedIdea),
        },
      };
      return fn(tx);
    });

    const result = await evaluateIdea('idea-1', 'eval-123', 'ACCEPTED', 'Great!');

    expect(result).not.toBeNull();
    expect(createSpy).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ideaId: 'idea-1',
        decision: 'ACCEPTED',
        comments: 'Great!',
        evaluatorId: 'eval-123',
        evaluatedUnderBlindReview: true,
      }),
    });
  });

  it('should set evaluatedUnderBlindReview false when blind review disabled', async () => {
    const { getBlindReviewConfig } = jest.requireMock('@/lib/config/blind-review');
    getBlindReviewConfig.mockReturnValue({ enabled: false, adminAuditEnabled: false });

    const updatedIdea = {
      id: 'idea-1',
      status: 'REJECTED' as const,
      evaluation: {
        decision: 'REJECTED',
        comments: 'No',
        evaluatedAt: new Date('2026-02-25T12:00:00Z'),
        evaluator: { name: 'Eval', email: 'eval@example.com' },
      },
    };

    prisma.idea.findUnique
      .mockResolvedValueOnce({
        id: 'idea-1',
        status: 'SUBMITTED',
        evaluation: null,
      })
      .mockResolvedValue(updatedIdea);

    const createSpy = jest.fn().mockResolvedValue({});
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        evaluation: { create: createSpy },
        idea: {
          update: jest.fn().mockResolvedValue({}),
          findUnique: jest.fn().mockResolvedValue(updatedIdea),
        },
      };
      return fn(tx);
    });

    await evaluateIdea('idea-1', 'eval-123', 'REJECTED', 'No.');

    expect(createSpy).toHaveBeenCalledWith({
      data: expect.objectContaining({
        evaluatedUnderBlindReview: false,
      }),
    });
  });
});

describe('startReviewIdea', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should transition SUBMITTED to UNDER_REVIEW', async () => {
    prisma.idea.updateMany.mockResolvedValue({ count: 1 });

    const result = await startReviewIdea('idea-1', 'eval-123');

    expect(result).toEqual({ id: 'idea-1', status: 'UNDER_REVIEW' });
    expect(prisma.idea.updateMany).toHaveBeenCalledWith({
      where: { id: 'idea-1', status: 'SUBMITTED' },
      data: { status: 'UNDER_REVIEW' },
    });
  });

  it('should return null when idea not found or not SUBMITTED', async () => {
    prisma.idea.updateMany.mockResolvedValue({ count: 0 });

    const result = await startReviewIdea('idea-999', 'eval-123');

    expect(result).toBeNull();
  });
});
