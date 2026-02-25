// Integration tests for POST /api/ideas endpoint

import { POST } from '@/app/api/ideas/route';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    category: { findUnique: jest.fn() },
    idea: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    attachment: { create: jest.fn() },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/services/attachment-service', () => ({
  saveAttachmentFile: jest.fn(),
}));

describe('POST /api/ideas', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;
  const getServerSession = jest.requireMock('next-auth').getServerSession;
  const saveAttachmentFile = jest.requireMock('@/lib/services/attachment-service').saveAttachmentFile;

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue({ user: { id: 'user-123', email: 'user@example.com' } });
  });

  it('should successfully submit an idea with valid JSON data', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: 'cat_001',
      name: 'Process Improvement',
      isActive: true,
    });

    const createdIdea = {
      id: 'idea-123',
      title: 'Improve Code Review',
      description: 'Implement an automated code review system for better code quality.',
      sanitizedTitle: 'Improve Code Review',
      sanitizedDescription: 'Implement an automated code review system for better code quality.',
      categoryId: 'cat_001',
      userId: 'user-123',
      status: 'SUBMITTED',
      submittedAt: new Date('2026-02-25T10:00:00.000Z'),
      createdAt: new Date('2026-02-25T10:00:00.000Z'),
      updatedAt: new Date('2026-02-25T10:00:00.000Z'),
      category: { id: 'cat_001', name: 'Process Improvement' },
    };
    prisma.idea.create.mockResolvedValue(createdIdea);

    const request = new Request('http://localhost:3000/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Improve Code Review',
        description: 'Implement an automated code review system for better code quality.',
        categoryId: 'cat_001',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.idea.id).toBe('idea-123');
    expect(data.idea.attachment).toBeNull();
  });

  it('should successfully submit an idea with multipart attachment', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: 'cat_001',
      name: 'Process Improvement',
      isActive: true,
    });

    const createdIdea = {
      id: 'idea-123',
      title: 'Design Mockup',
      description: 'A detailed design mockup for the new feature.',
      sanitizedTitle: 'Design Mockup',
      sanitizedDescription: 'A detailed design mockup for the new feature.',
      categoryId: 'cat_001',
      userId: 'user-123',
      status: 'SUBMITTED',
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      category: { id: 'cat_001', name: 'Process Improvement' },
    };
    prisma.idea.create.mockResolvedValue(createdIdea);
    saveAttachmentFile.mockResolvedValue('ideas/idea-123/uuid.pdf');
    prisma.attachment.create.mockResolvedValue({
      id: 'att-1',
      ideaId: 'idea-123',
      originalFileName: 'mock.pdf',
      storedPath: 'ideas/idea-123/uuid.pdf',
      fileSizeBytes: 100,
      mimeType: 'application/pdf',
    });
    prisma.idea.findUnique.mockResolvedValue({
      ...createdIdea,
      attachment: {
        id: 'att-1',
        originalFileName: 'mock.pdf',
        fileSizeBytes: 100,
        mimeType: 'application/pdf',
      },
    });

    const file = new File(['pdf content'], 'mock.pdf', { type: 'application/pdf' });
    const fd = new FormData();
    fd.append('title', 'Design Mockup');
    fd.append('description', 'A detailed design mockup for the new feature.');
    fd.append('categoryId', 'cat_001');
    fd.append('attachment', file);

    const request = new Request('http://localhost:3000/api/ideas', {
      method: 'POST',
      body: fd,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.idea.attachment).toBeTruthy();
    expect(data.idea.attachment.originalFileName).toBe('mock.pdf');
    expect(saveAttachmentFile).toHaveBeenCalledWith('idea-123', expect.any(File));
  });

  it('should return 401 if user is not authenticated', async () => {
    getServerSession.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Improve Code Review',
        description: 'Implement an automated code review system for better code quality.',
        categoryId: 'cat_001',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 with validation errors for invalid data', async () => {
    const request = new Request('http://localhost:3000/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Bad',
        description: 'Too short',
        categoryId: '',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.details).toBeDefined();
  });

  it('should sanitize title and description before saving', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: 'cat_001',
      name: 'Technology',
      isActive: true,
    });

    prisma.idea.create.mockImplementation((args: { data: Record<string, unknown> }) => {
      expect(args.data.sanitizedTitle).toBeDefined();
      expect(args.data.sanitizedDescription).toBeDefined();
      return Promise.resolve({
        id: 'idea-1',
        ...args.data,
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    const request = new Request('http://localhost:3000/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '<script>Alert("xss")</script> Real Title',
        description: 'This description has <b>HTML</b> and special chars.',
        categoryId: 'cat_001',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(prisma.idea.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sanitizedTitle: expect.any(String),
          sanitizedDescription: expect.any(String),
        }),
      }),
    );
  });

  it('should return 400 if category does not exist', async () => {
    prisma.category.findUnique.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Valid Title Here',
        description: 'This is a valid description with enough characters.',
        categoryId: 'nonexistent_cat',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.details?.categoryId).toContain('Category not found');
  });

  it('should return 400 if category is inactive', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: 'cat_inactive',
      name: 'Inactive Category',
      isActive: false,
    });

    const request = new Request('http://localhost:3000/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Valid Title Here',
        description: 'This is a valid description with enough characters.',
        categoryId: 'cat_inactive',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.details?.categoryId).toContain('This category is no longer accepting submissions');
  });

  it('should return 400 for oversized attachment', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: 'cat_001',
      name: 'Technology',
      isActive: true,
    });

    const oversizedBuffer = new ArrayBuffer(26 * 1024 * 1024);
    const largeFile = new File([oversizedBuffer], 'huge.pdf', { type: 'application/pdf' });
    const fd = new FormData();
    fd.append('title', 'Big File Idea');
    fd.append('description', 'A valid description with enough characters here.');
    fd.append('categoryId', 'cat_001');
    fd.append('attachment', largeFile);

    const request = new Request('http://localhost:3000/api/ideas', { method: 'POST', body: fd });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('too large');
    expect(prisma.idea.create).not.toHaveBeenCalled();
  });

  it('should return 400 for unsupported file type', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: 'cat_001',
      name: 'Technology',
      isActive: true,
    });

    const exeFile = new File(['x'], 'virus.exe', { type: 'application/x-msdownload' });
    Object.defineProperty(exeFile, 'size', { value: 100 });
    const fd = new FormData();
    fd.append('title', 'Exe Idea');
    fd.append('description', 'A valid description with enough characters here.');
    fd.append('categoryId', 'cat_001');
    fd.append('attachment', exeFile);

    const request = new Request('http://localhost:3000/api/ideas', { method: 'POST', body: fd });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('not supported');
    expect(prisma.idea.create).not.toHaveBeenCalled();
  });

  it('should return 400 for empty file', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: 'cat_001',
      name: 'Technology',
      isActive: true,
    });

    const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' });
    const fd = new FormData();
    fd.append('title', 'Empty File Idea');
    fd.append('description', 'A valid description with enough characters here.');
    fd.append('categoryId', 'cat_001');
    fd.append('attachment', emptyFile);

    const request = new Request('http://localhost:3000/api/ideas', { method: 'POST', body: fd });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/empty|valid file/i);
    expect(prisma.idea.create).not.toHaveBeenCalled();
  });
});
