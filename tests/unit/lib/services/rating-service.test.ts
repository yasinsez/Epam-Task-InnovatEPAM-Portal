import { assignRating } from '@/lib/services/rating-service';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    idea: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('rating-service', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when idea not found', async () => {
    prisma.idea.findUnique.mockResolvedValue(null);

    const result = await assignRating('nonexistent', 'eval-123', 4);

    expect(result).toBeNull();
    expect(prisma.idea.update).not.toHaveBeenCalled();
  });

  it('should return null when idea status is ACCEPTED', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      status: 'ACCEPTED',
    });

    const result = await assignRating('idea-1', 'eval-123', 4);

    expect(result).toBeNull();
    expect(prisma.idea.update).not.toHaveBeenCalled();
  });

  it('should return null when idea status is REJECTED', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      status: 'REJECTED',
    });

    const result = await assignRating('idea-1', 'eval-123', 4);

    expect(result).toBeNull();
    expect(prisma.idea.update).not.toHaveBeenCalled();
  });

  it('should return null when idea status is DRAFT', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      status: 'DRAFT',
    });

    const result = await assignRating('idea-1', 'eval-123', 4);

    expect(result).toBeNull();
    expect(prisma.idea.update).not.toHaveBeenCalled();
  });

  it('should assign rating successfully when idea is SUBMITTED', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      status: 'SUBMITTED',
    });
    prisma.idea.update.mockResolvedValue({
      id: 'idea-1',
      rating: 4,
      ratingAssignedAt: new Date('2026-02-28T15:00:00Z'),
    });

    const result = await assignRating('idea-1', 'eval-123', 4);

    expect(result).toEqual({
      id: 'idea-1',
      rating: 4,
      ratingDisplay: '4/5',
      ratingAssignedAt: expect.any(Date),
    });
    expect(prisma.idea.update).toHaveBeenCalledWith({
      where: { id: 'idea-1' },
      data: {
        rating: 4,
        ratingEvaluatorId: 'eval-123',
        ratingAssignedAt: expect.any(Date),
      },
    });
  });

  it('should assign rating successfully when idea is UNDER_REVIEW', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      status: 'UNDER_REVIEW',
    });
    prisma.idea.update.mockResolvedValue({
      id: 'idea-1',
      rating: 5,
      ratingAssignedAt: new Date(),
    });

    const result = await assignRating('idea-1', 'eval-456', 5);

    expect(result).toEqual({
      id: 'idea-1',
      rating: 5,
      ratingDisplay: '5/5',
      ratingAssignedAt: expect.any(Date),
    });
    expect(prisma.idea.update).toHaveBeenCalledWith({
      where: { id: 'idea-1' },
      data: expect.objectContaining({
        rating: 5,
        ratingEvaluatorId: 'eval-456',
      }),
    });
  });

  it('should allow rating 1 (minimum)', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      status: 'SUBMITTED',
    });
    prisma.idea.update.mockResolvedValue({ id: 'idea-1', rating: 1 });

    const result = await assignRating('idea-1', 'eval-123', 1);

    expect(result?.rating).toBe(1);
    expect(result?.ratingDisplay).toBe('1/5');
  });

  it('should allow rating 5 (maximum)', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      status: 'SUBMITTED',
    });
    prisma.idea.update.mockResolvedValue({ id: 'idea-1', rating: 5 });

    const result = await assignRating('idea-1', 'eval-123', 5);

    expect(result?.rating).toBe(5);
    expect(result?.ratingDisplay).toBe('5/5');
  });
});
