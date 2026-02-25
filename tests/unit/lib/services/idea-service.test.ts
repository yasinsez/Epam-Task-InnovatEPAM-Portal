import { deleteIdeaWithCleanup } from '@/lib/services/idea-service';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    idea: {
      findUnique: jest.fn(),
      delete: jest.fn(),
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
      attachment: {
        storedPath: 'ideas/idea-123/uuid.pdf',
      },
    });
    prisma.idea.delete.mockResolvedValue({});

    await deleteIdeaWithCleanup('idea-123');

    expect(deleteAttachmentFile).toHaveBeenCalledWith('ideas/idea-123/uuid.pdf');
    expect(prisma.idea.delete).toHaveBeenCalledWith({ where: { id: 'idea-123' } });
  });

  it('should delete idea without calling deleteAttachmentFile when no attachment', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-123',
      attachment: null,
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
