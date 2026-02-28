import { getUploadConfig, updateUploadConfig } from '@/lib/services/upload-config-service';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    uploadConfiguration: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('upload-config-service [US1]', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return defaults when no config in DB', async () => {
    prisma.uploadConfiguration.findFirst.mockResolvedValue(null);

    const config = await getUploadConfig();

    expect(config.maxFileCount).toBe(10);
    expect(config.maxFileSizeBytes).toBe(10 * 1024 * 1024);
    expect(config.maxTotalSizeBytes).toBe(50 * 1024 * 1024);
    expect(config.allowedExtensions).toContain('.pdf');
    expect(config.mimeByExtension['.pdf']).toBe('application/pdf');
  });

  it('should return DB config when exists', async () => {
    prisma.uploadConfiguration.findFirst.mockResolvedValue({
      id: 'config-1',
      maxFileCount: 5,
      maxFileSizeBytes: 5 * 1024 * 1024,
      maxTotalSizeBytes: 20 * 1024 * 1024,
      allowedExtensions: ['.pdf', '.doc'],
      mimeByExtension: { '.pdf': 'application/pdf', '.doc': 'application/msword' },
      updatedAt: new Date(),
      updatedById: null,
    });

    const config = await getUploadConfig();

    expect(config.maxFileCount).toBe(5);
    expect(config.maxFileSizeBytes).toBe(5 * 1024 * 1024);
    expect(config.allowedExtensions).toEqual(['.pdf', '.doc']);
  });

  it('should update config when row exists', async () => {
    prisma.uploadConfiguration.findFirst.mockResolvedValue({
      id: 'config-1',
      maxFileCount: 10,
      maxFileSizeBytes: 10485760,
      maxTotalSizeBytes: 52428800,
      allowedExtensions: ['.pdf'],
      mimeByExtension: { '.pdf': 'application/pdf' },
      updatedAt: new Date(),
      updatedById: null,
    });
    prisma.uploadConfiguration.update.mockResolvedValue({
      id: 'config-1',
      maxFileCount: 3,
      maxFileSizeBytes: 2 * 1024 * 1024,
      maxTotalSizeBytes: 10 * 1024 * 1024,
      allowedExtensions: ['.pdf', '.png'],
      mimeByExtension: { '.pdf': 'application/pdf', '.png': 'image/png' },
      updatedAt: new Date(),
      updatedById: 'user-1',
    });

    const result = await updateUploadConfig(
      {
        maxFileCount: 3,
        maxFileSizeBytes: 2 * 1024 * 1024,
        maxTotalSizeBytes: 10 * 1024 * 1024,
        allowedExtensions: ['.pdf', '.png'],
        mimeByExtension: { '.pdf': 'application/pdf', '.png': 'image/png' },
      },
      'user-1',
    );

    expect(result.maxFileCount).toBe(3);
    expect(prisma.uploadConfiguration.update).toHaveBeenCalled();
  });
});
