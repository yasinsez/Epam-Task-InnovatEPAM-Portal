import {
  deleteIdeaWithCleanup,
  getIdeasForUser,
  getIdeaForDetail,
} from '@/lib/services/idea-service';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    idea: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    reviewStage: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/services/attachment-service', () => ({
  deleteAttachmentFile: jest.fn(),
}));

describe('idea-service', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;
  const deleteAttachmentFile = jest.requireMock('@/lib/services/attachment-service')
    .deleteAttachmentFile;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete idea and attachment file when idea has attachment', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-123',
      attachments: [{ storedPath: 'ideas/idea-123/uuid.pdf' }],
    });
    prisma.idea.delete.mockResolvedValue({});

    await deleteIdeaWithCleanup('idea-123');

    expect(deleteAttachmentFile).toHaveBeenCalledWith('ideas/idea-123/uuid.pdf');
    expect(prisma.idea.delete).toHaveBeenCalledWith({ where: { id: 'idea-123' } });
  });

  it('should delete idea without calling deleteAttachmentFile when no attachment', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-123',
      attachments: [],
    });
    prisma.idea.delete.mockResolvedValue({});

    await deleteIdeaWithCleanup('idea-123');

    expect(deleteAttachmentFile).not.toHaveBeenCalled();
    expect(prisma.idea.delete).toHaveBeenCalledWith({ where: { id: 'idea-123' } });
  });

  it('should throw when idea not found', async () => {
    prisma.idea.findUnique.mockResolvedValue(null);

    await expect(deleteIdeaWithCleanup('nonexistent')).rejects.toThrow('Idea not found');
    expect(prisma.idea.delete).not.toHaveBeenCalled();
  });
});

describe('getIdeasForUser', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.reviewStage.findMany.mockResolvedValue([]);
  });

  it('should filter by userId for submitter role', async () => {
    prisma.idea.count.mockResolvedValue(2);
    prisma.idea.findMany.mockResolvedValue([
      {
        id: 'idea-1',
        title: 'Idea One',
        category: { id: 'c1', name: 'Tech' },
        submittedAt: new Date(),
        attachments: [{ id: 'att1' }],
        status: 'SUBMITTED',
      },
      {
        id: 'idea-2',
        title: 'Idea Two',
        category: { id: 'c1', name: 'Tech' },
        submittedAt: new Date(),
        attachments: [],
        status: 'ACCEPTED',
      },
    ]);

    const result = await getIdeasForUser('user-123', 'submitter', { page: 1 });

    expect(prisma.idea.count).toHaveBeenCalledWith({
      where: { userId: 'user-123', status: { not: 'DRAFT' } },
    });
    expect(prisma.idea.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-123', status: { not: 'DRAFT' } },
        orderBy: { submittedAt: 'desc' },
        skip: 0,
        take: 15,
      }),
    );
    expect(result.ideas).toHaveLength(2);
    expect(result.ideas[0].hasAttachment).toBe(true);
    expect(result.ideas[1].hasAttachment).toBe(false);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.totalCount).toBe(2);
  });

  it('should not filter by userId for evaluator role', async () => {
    prisma.idea.count.mockResolvedValue(1);
    prisma.idea.findMany.mockResolvedValue([
      {
        id: 'idea-1',
        title: 'Any Idea',
        category: { id: 'c1', name: 'Tech' },
        submittedAt: new Date(),
        attachments: [],
        status: 'SUBMITTED',
      },
    ]);

    await getIdeasForUser('user-123', 'evaluator', { page: 1 });

    expect(prisma.idea.count).toHaveBeenCalledWith({
      where: { status: { not: 'DRAFT' } },
    });
    expect(prisma.idea.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { not: 'DRAFT' } },
      }),
    );
  });

  it('should not filter by userId for admin role', async () => {
    prisma.idea.count.mockResolvedValue(0);
    prisma.idea.findMany.mockResolvedValue([]);

    await getIdeasForUser('user-123', 'admin', { page: 1 });

    expect(prisma.idea.count).toHaveBeenCalledWith({
      where: { status: { not: 'DRAFT' } },
    });
  });

  it('should apply categoryId filter when provided', async () => {
    prisma.idea.count.mockResolvedValue(1);
    prisma.idea.findMany.mockResolvedValue([
      {
        id: 'idea-1',
        title: 'Filtered',
        category: { id: 'cat-1', name: 'Process' },
        submittedAt: new Date(),
        attachments: [],
        status: 'SUBMITTED',
      },
    ]);

    await getIdeasForUser('user-123', 'evaluator', {
      page: 1,
      categoryId: 'cat-1',
    });

    expect(prisma.idea.count).toHaveBeenCalledWith({
      where: { status: { not: 'DRAFT' }, categoryId: 'cat-1' },
    });
  });

  it('should normalize page 0 to 1', async () => {
    prisma.idea.count.mockResolvedValue(20);
    prisma.idea.findMany.mockResolvedValue([]);

    const result = await getIdeasForUser('user-123', 'submitter', { page: 0 });

    expect(result.pagination.page).toBe(1);
    expect(prisma.idea.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 15,
      }),
    );
  });

  it('should normalize page beyond last to last page', async () => {
    prisma.idea.count.mockResolvedValue(25); // 2 pages of 15
    prisma.idea.findMany.mockResolvedValue([
      {
        id: 'idea-1',
        title: 'Last',
        category: { id: 'c1', name: 'Tech' },
        submittedAt: new Date(),
        attachments: [],
        status: 'SUBMITTED',
      },
    ]);

    const result = await getIdeasForUser('user-123', 'submitter', { page: 99 });

    expect(result.pagination.page).toBe(2);
    expect(prisma.idea.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 15,
        take: 15,
      }),
    );
  });
});

describe('getIdeaForDetail', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when idea not found', async () => {
    prisma.idea.findUnique.mockResolvedValue(null);

    const result = await getIdeaForDetail('nonexistent', 'user-123', 'submitter');

    expect(result).toBeNull();
  });

  it('should return null when submitter accesses other user idea', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      title: 'Other Idea',
      description: 'Desc',
      category: { id: 'c1', name: 'Tech' },
      submittedAt: new Date(),
      userId: 'other-user',
      status: 'SUBMITTED',
      attachment: null,
      evaluation: null,
      user: { name: 'Other', email: 'other@example.com' },
    });

    const result = await getIdeaForDetail('idea-1', 'user-123', 'submitter');

    expect(result).toBeNull();
  });

  it('should return idea for owner (submitter)', async () => {
    const idea = {
      id: 'idea-1',
      title: 'My Idea',
      description: 'My desc',
      category: { id: 'c1', name: 'Tech' },
      submittedAt: new Date('2026-02-25'),
      userId: 'user-123',
      status: 'SUBMITTED',
      currentStageId: null,
      currentStage: null,
      dynamicFieldValues: null,
      evaluation: null,
      attachments: [],
      user: { name: 'Me', email: 'me@example.com' },
    };
    prisma.idea.findUnique.mockResolvedValue(idea);
    prisma.reviewStage = { findMany: jest.fn().mockResolvedValue([]) };

    const result = await getIdeaForDetail('idea-1', 'user-123', 'submitter');

    expect(result).not.toBeNull();
    expect(result?.title).toBe('My Idea');
    expect(result?.submitter).toBeUndefined(); // submitters don't see submitter
  });

  it('should include rating for submitter viewing own rated idea', async () => {
    const idea = {
      id: 'idea-1',
      title: 'My Rated Idea',
      description: 'Desc',
      category: { id: 'c1', name: 'Tech' },
      submittedAt: new Date(),
      userId: 'user-123',
      status: 'ACCEPTED',
      currentStageId: null,
      currentStage: null,
      dynamicFieldValues: null,
      evaluation: { decision: 'ACCEPTED', comments: 'Good', evaluatedAt: new Date(), evaluatorId: 'e1', evaluator: { name: 'Eval', email: 'e@x.com' }, evaluatedUnderBlindReview: false },
      attachments: [],
      rating: 4,
      ratingAssignedAt: new Date('2026-02-28T15:00:00Z'),
      user: { name: 'Me', email: 'me@example.com' },
    };
    prisma.idea.findUnique.mockResolvedValue(idea);
    prisma.reviewStage = { findMany: jest.fn().mockResolvedValue([]) };

    const result = await getIdeaForDetail('idea-1', 'user-123', 'submitter');

    expect(result).not.toBeNull();
    expect(result?.rating).toBe(4);
    expect(result?.ratingDisplay).toBe('4/5');
    expect(result?.ratingAssignedAt).toBeInstanceOf(Date);
  });

  it('should include submitter for evaluator', async () => {
    const idea = {
      id: 'idea-1',
      title: 'Any Idea',
      description: 'Desc',
      category: { id: 'c1', name: 'Tech' },
      submittedAt: new Date(),
      userId: 'other-user',
      status: 'SUBMITTED',
      attachment: null,
      evaluation: null,
      user: { name: 'Jane', email: 'jane@example.com' },
    };
    prisma.idea.findUnique.mockResolvedValue(idea);

    const result = await getIdeaForDetail('idea-1', 'eval-123', 'evaluator');

    expect(result).not.toBeNull();
    expect(result?.submitter).toBe('Jane');
  });

  it('should fall back to email when name is null for evaluator', async () => {
    const idea = {
      id: 'idea-1',
      title: 'Idea',
      description: 'Desc',
      category: { id: 'c1', name: 'Tech' },
      submittedAt: new Date(),
      userId: 'other-user',
      status: 'SUBMITTED',
      attachment: null,
      evaluation: null,
      user: { name: null, email: 'jane@example.com' },
    };
    prisma.idea.findUnique.mockResolvedValue(idea);

    const result = await getIdeaForDetail('idea-1', 'eval-123', 'evaluator');

    expect(result?.submitter).toBe('jane@example.com');
  });
});
