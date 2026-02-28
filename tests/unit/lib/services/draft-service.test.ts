import {
  getDraftsForUser,
  createDraft,
  getDraftById,
  updateDraft,
  discardDraft,
  submitDraft,
} from '@/lib/services/draft-service';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    idea: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    attachment: {
      create: jest.fn(),
      count: jest.fn(),
    },
    reviewStage: {
      findFirst: jest.fn().mockResolvedValue({ id: 'stage-1', name: 'Initial', displayOrder: 0 }),
    },
  },
}));

jest.mock('@/lib/services/attachment-service', () => ({
  saveAttachmentFile: jest.fn().mockResolvedValue('ideas/draft-1/uuid.pdf'),
}));

jest.mock('@/lib/services/idea-service', () => ({
  deleteIdeaWithCleanup: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/services/form-config-service', () => ({
  getActiveConfig: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/services/upload-config-service', () => ({
  getUploadConfig: jest.fn().mockResolvedValue({
    maxFileCount: 10,
    maxFileSizeBytes: 10 * 1024 * 1024,
    maxTotalSizeBytes: 50 * 1024 * 1024,
    allowedExtensions: ['.pdf', '.png'],
    mimeByExtension: { '.pdf': 'application/pdf', '.png': 'image/png' },
  }),
}));

describe('draft-service', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;
  const deleteIdeaWithCleanup = jest.requireMock('@/lib/services/idea-service')
    .deleteIdeaWithCleanup;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDraftsForUser', () => {
    it('should return paginated drafts', async () => {
      prisma.idea.count.mockResolvedValue(2);
      prisma.idea.findMany.mockResolvedValue([
        {
          id: 'draft-1',
          title: 'Untitled draft',
          updatedAt: new Date('2026-02-28T10:00:00Z'),
          createdAt: new Date('2026-02-28T09:00:00Z'),
          attachments: [{ id: 'att1' }],
        },
        {
          id: 'draft-2',
          title: 'My draft',
          updatedAt: new Date('2026-02-28T11:00:00Z'),
          createdAt: new Date('2026-02-28T10:00:00Z'),
          attachments: [],
        },
      ]);

      const result = await getDraftsForUser('user-123', { page: 1, pageSize: 15 });

      expect(prisma.idea.count).toHaveBeenCalledWith({
        where: { userId: 'user-123', status: 'DRAFT' },
      });
      expect(result.drafts).toHaveLength(2);
      expect(result.drafts[0].id).toBe('draft-1');
      expect(result.drafts[0].attachmentCount).toBe(1);
      expect(result.drafts[1].title).toBe('My draft');
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalCount).toBe(2);
    });
  });

  describe('createDraft', () => {
    it('should create draft with partial data', async () => {
      prisma.idea.count.mockResolvedValue(2);
      prisma.idea.create.mockResolvedValue({
        id: 'draft-new',
        title: 'My draft',
        description: 'WIP',
        categoryId: null,
        category: null,
        dynamicFieldValues: {},
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
        attachments: [],
      });
      prisma.idea.findUnique.mockResolvedValue({
        id: 'draft-new',
        title: 'My draft',
        description: 'WIP',
        categoryId: null,
        category: null,
        dynamicFieldValues: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        attachments: [],
      });

      const result = await createDraft('user-123', {
        title: 'My draft',
        description: 'WIP',
        categoryId: null,
        dynamicFieldValues: {},
      });

      expect(prisma.idea.count).toHaveBeenCalledWith({
        where: { userId: 'user-123', status: 'DRAFT' },
      });
      expect(prisma.idea.create).toHaveBeenCalled();
      expect(result.id).toBe('draft-new');
      expect(result.title).toBe('My draft');
      expect(result.status).toBe('DRAFT');
    });

    it('should throw when draft limit (10) reached', async () => {
      prisma.idea.count.mockResolvedValue(10);

      await expect(
        createDraft('user-123', {
          title: 'New draft',
          description: '',
          categoryId: null,
          dynamicFieldValues: {},
        }),
      ).rejects.toThrow('Draft limit reached');
      expect(prisma.idea.create).not.toHaveBeenCalled();
    });
  });

  describe('getDraftById', () => {
    it('should return draft when owner', async () => {
      prisma.idea.findUnique.mockResolvedValue({
        id: 'draft-1',
        title: 'My draft',
        description: 'Desc',
        categoryId: 'cat-1',
        category: { id: 'cat-1', name: 'Tech' },
        dynamicFieldValues: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        attachments: [],
      });

      const result = await getDraftById('draft-1', 'user-123');

      expect(prisma.idea.findUnique).toHaveBeenCalledWith({
        where: { id: 'draft-1', userId: 'user-123', status: 'DRAFT' },
        include: expect.anything(),
      });
      expect(result).not.toBeNull();
      expect(result!.id).toBe('draft-1');
    });

    it('should return null when not found', async () => {
      prisma.idea.findUnique.mockResolvedValue(null);

      const result = await getDraftById('nonexistent', 'user-123');

      expect(result).toBeNull();
    });
  });

  describe('updateDraft', () => {
    it('should update draft', async () => {
      prisma.idea.findUnique.mockResolvedValue({
        id: 'draft-1',
        title: 'Old',
        description: 'Old desc',
        categoryId: null,
        dynamicFieldValues: {},
      });
      prisma.idea.update.mockResolvedValue({});
      prisma.attachment.count.mockResolvedValue(0);
      prisma.idea.findUnique
        .mockResolvedValueOnce({
          id: 'draft-1',
          title: 'Old',
          description: 'Old desc',
          categoryId: null,
          dynamicFieldValues: {},
        })
        .mockResolvedValueOnce({
          id: 'draft-1',
          title: 'Updated',
          description: 'New desc',
          categoryId: null,
          category: null,
          dynamicFieldValues: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          attachments: [],
        });

      const result = await updateDraft('draft-1', 'user-123', {
        title: 'Updated',
        description: 'New desc',
        categoryId: null,
        dynamicFieldValues: {},
      });

      expect(prisma.idea.update).toHaveBeenCalled();
      expect(result.title).toBe('Updated');
    });

    it('should throw when draft not found', async () => {
      prisma.idea.findUnique.mockResolvedValue(null);

      await expect(
        updateDraft('nonexistent', 'user-123', {
          title: 'Updated',
          description: '',
          categoryId: null,
          dynamicFieldValues: {},
        }),
      ).rejects.toThrow('Draft not found');
    });
  });

  describe('discardDraft', () => {
    it('should call deleteIdeaWithCleanup', async () => {
      prisma.idea.findUnique.mockResolvedValue({
        id: 'draft-1',
        userId: 'user-123',
        status: 'DRAFT',
      });

      await discardDraft('draft-1', 'user-123');

      expect(deleteIdeaWithCleanup).toHaveBeenCalledWith('draft-1');
    });

    it('should throw when draft not found', async () => {
      prisma.idea.findUnique.mockResolvedValue(null);

      await expect(discardDraft('nonexistent', 'user-123')).rejects.toThrow('Draft not found');
      expect(deleteIdeaWithCleanup).not.toHaveBeenCalled();
    });
  });

  describe('submitDraft', () => {
    it('should submit draft with valid data', async () => {
      const draft = {
        id: 'draft-1',
        title: 'Valid Title',
        description: 'This is a valid description with enough characters',
        categoryId: 'cat-1',
        category: { id: 'cat-1', name: 'Tech' },
        dynamicFieldValues: {},
      };
      prisma.idea.findUnique
        .mockResolvedValueOnce({
          ...draft,
          createdAt: new Date(),
          updatedAt: new Date(),
          attachments: [],
        })
        .mockResolvedValueOnce(null);
      prisma.idea.update.mockResolvedValue({
        id: 'draft-1',
        title: 'Valid Title',
        status: 'SUBMITTED',
        submittedAt: new Date(),
        categoryId: 'cat-1',
        category: { id: 'cat-1', name: 'Tech' },
        description: draft.description,
        dynamicFieldValues: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await submitDraft('draft-1', 'user-123', {
        title: 'Valid Title',
        description: 'This is a valid description with enough characters',
        categoryId: 'cat-1',
      });

      expect(result.status).toBe('SUBMITTED');
      expect(prisma.idea.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'draft-1' },
          data: expect.objectContaining({
            status: 'SUBMITTED',
            categoryId: 'cat-1',
          }),
        }),
      );
    });

    it('should throw when draft not found', async () => {
      prisma.idea.findUnique.mockResolvedValue(null);

      await expect(
        submitDraft('nonexistent', 'user-123', {
          title: 'Title',
          description: 'Valid description with enough characters',
          categoryId: 'cat-1',
        }),
      ).rejects.toThrow('Draft not found');
    });

    it('should throw validation error when required fields missing', async () => {
      prisma.idea.findUnique.mockResolvedValue({
        id: 'draft-1',
        title: 'Short',
        description: 'Short',
        categoryId: null,
        category: null,
        dynamicFieldValues: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        attachments: [],
      });

      await expect(
        submitDraft('draft-1', 'user-123', {
          title: 'Short',
          description: 'Short',
          categoryId: null,
        }),
      ).rejects.toThrow();
    });
  });
});
