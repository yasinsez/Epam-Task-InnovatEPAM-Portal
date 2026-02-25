import { GET } from '@/app/api/ideas/[id]/attachment/route';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    idea: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth/roles', () => ({
  getUserRole: jest.fn(),
}));

jest.mock('@/lib/services/attachment-service', () => ({
  readAttachmentFile: jest.fn(),
}));

describe('GET /api/ideas/[id]/attachment', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;
  const getServerSession = jest.requireMock('next-auth').getServerSession;
  const getUserRole = jest.requireMock('@/lib/auth/roles').getUserRole;
  const readAttachmentFile = jest.requireMock('@/lib/services/attachment-service')
    .readAttachmentFile;

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue({ user: { id: 'user-123' } });
    getUserRole.mockResolvedValue('submitter');
  });

  it('should return 401 when not authenticated', async () => {
    getServerSession.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost:3000/api/ideas/idea-1/attachment'), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should return 404 when idea not found', async () => {
    prisma.idea.findUnique.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost:3000/api/ideas/idea-1/attachment'), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Idea not found');
  });

  it('should return 404 when idea has no attachment', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      userId: 'user-123',
      user: { id: 'user-123' },
      attachment: null,
    });

    const response = await GET(new Request('http://localhost:3000/api/ideas/idea-1/attachment'), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('This idea has no attachment');
  });

  it('should return 403 when user cannot access idea', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      userId: 'other-user',
      user: { id: 'other-user' },
      attachment: {
        id: 'att-1',
        storedPath: 'ideas/idea-1/uuid.pdf',
        mimeType: 'application/pdf',
        originalFileName: 'doc.pdf',
        fileSizeBytes: 100,
      },
    });
    getUserRole.mockResolvedValue('submitter');

    const response = await GET(new Request('http://localhost:3000/api/ideas/idea-1/attachment'), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Access denied');
  });

  it('should return 200 with file when user owns idea', async () => {
    const ideaWithAttachment = {
      id: 'idea-1',
      userId: 'user-123',
      user: { id: 'user-123' },
      attachment: {
        id: 'att-1',
        storedPath: 'ideas/idea-1/uuid.pdf',
        mimeType: 'application/pdf',
        originalFileName: 'document.pdf',
        fileSizeBytes: 100,
      },
    };
    prisma.idea.findUnique.mockResolvedValue(ideaWithAttachment);
    readAttachmentFile.mockResolvedValue(Buffer.from('pdf content'));

    const response = await GET(new Request('http://localhost:3000/api/ideas/idea-1/attachment'), {
      params: Promise.resolve({ id: 'idea-1' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('document.pdf');
    const body = await response.arrayBuffer();
    expect(Buffer.from(body).toString()).toBe('pdf content');
  });

  it('should return 500 when file not found on disk', async () => {
    prisma.idea.findUnique.mockResolvedValue({
      id: 'idea-1',
      userId: 'user-123',
      user: { id: 'user-123' },
      attachment: {
        id: 'att-1',
        storedPath: 'ideas/idea-1/uuid.pdf',
        mimeType: 'application/pdf',
        originalFileName: 'doc.pdf',
        fileSizeBytes: 100,
      },
    });
    readAttachmentFile.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost:3000/api/ideas/idea-1/attachment'), {
      params: Promise.resolve({ id: 'idea-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Attachment unavailable');
  });
});
