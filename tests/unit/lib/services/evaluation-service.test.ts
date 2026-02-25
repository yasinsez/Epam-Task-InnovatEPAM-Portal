import { evaluateIdea } from '@/lib/services/evaluation-service';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    idea: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('evaluation-service', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;

  beforeEach(() => {
    jest.clearAllMocks();
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
});
