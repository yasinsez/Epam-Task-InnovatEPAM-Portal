// Integration tests for POST and GET /api/ideas endpoints

import { POST, GET } from '@/app/api/ideas/route';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    category: { findUnique: jest.fn() },
    idea: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    attachment: { create: jest.fn() },
    user: { findUnique: jest.fn() },
    reviewStage: {
      findFirst: jest.fn().mockResolvedValue({ id: 'stage-1', name: 'Initial', displayOrder: 0 }),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/services/attachment-service', () => ({
  saveAttachmentFile: jest.fn(),
}));

jest.mock('@/lib/auth/roles', () => ({
  getUserRole: jest.fn(),
  resolveUserIdForDb: jest.fn((id: string) => Promise.resolve(id)),
}));

jest.mock('@/lib/services/idea-service', () => ({
  getIdeasForUser: jest.fn(),
}));

jest.mock('@/lib/services/form-config-service', () => ({
  getActiveConfig: jest.fn(),
}));

jest.mock('@/lib/services/upload-config-service', () => ({
  getUploadConfig: jest.fn(),
}));

describe('POST /api/ideas', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;
  const getServerSession = jest.requireMock('next-auth').getServerSession;
  const saveAttachmentFile = jest.requireMock('@/lib/services/attachment-service').saveAttachmentFile;
  const getActiveConfig = jest.requireMock('@/lib/services/form-config-service').getActiveConfig;
  const getUploadConfig = jest.requireMock('@/lib/services/upload-config-service').getUploadConfig;

  const defaultUploadConfig = {
    maxFileCount: 10,
    maxFileSizeBytes: 10 * 1024 * 1024,
    maxTotalSizeBytes: 50 * 1024 * 1024,
    allowedExtensions: ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif', '.xls', '.xlsx'],
    mimeByExtension: {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue({ user: { id: 'user-123', email: 'user@example.com' } });
    getActiveConfig.mockResolvedValue(null); // No dynamic fields by default
    getUploadConfig.mockResolvedValue(defaultUploadConfig);
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
    expect(data.idea.attachments).toEqual([]);
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
      attachments: [
        {
          id: 'att-1',
          originalFileName: 'mock.pdf',
          fileSizeBytes: 100,
          mimeType: 'application/pdf',
        },
      ],
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
    expect(data.idea.attachments).toHaveLength(1);
    expect(data.idea.attachments[0].originalFileName).toBe('mock.pdf');
    expect(saveAttachmentFile).toHaveBeenCalledWith(
      'idea-123',
      expect.any(File),
      expect.any(Array),
    );
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
    expect(data.error).toMatch(/too large|exceeds|per-file size limit/i);
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
    expect(data.error).toMatch(/not supported|not allowed|file type/i);
    expect(prisma.idea.create).not.toHaveBeenCalled();
  });

  it('should successfully submit idea with dynamicFieldValues when form config has fields', async () => {
    getActiveConfig.mockResolvedValue({
      id: 'cfg1',
      updatedAt: '2026-02-28T10:00:00.000Z',
      updatedById: null,
      fields: [
        {
          id: 'fld_dept',
          label: 'Department',
          fieldType: 'SINGLE_SELECT',
          required: true,
          displayOrder: 0,
          options: ['Engineering', 'Product'],
          minValue: null,
          maxValue: null,
          maxLength: null,
        },
        {
          id: 'fld_score',
          label: 'Impact Score',
          fieldType: 'NUMBER',
          required: false,
          displayOrder: 1,
          options: null,
          minValue: 0,
          maxValue: 10,
          maxLength: null,
        },
      ],
    });

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
        dynamicFieldValues: {
          fld_dept: 'Engineering',
          fld_score: 7,
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.idea.dynamicFieldValues).toEqual({
      fld_dept: 'Engineering',
      fld_score: 7,
    });
    expect(prisma.idea.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dynamicFieldValues: { fld_dept: 'Engineering', fld_score: 7 },
        }),
      }),
    );
  });

  it('should return 400 when required dynamic field is missing', async () => {
    getActiveConfig.mockResolvedValue({
      id: 'cfg1',
      updatedAt: '2026-02-28T10:00:00.000Z',
      updatedById: null,
      fields: [
        {
          id: 'fld_req',
          label: 'Required Field',
          fieldType: 'TEXT',
          required: true,
          displayOrder: 0,
          options: null,
          minValue: null,
          maxValue: null,
          maxLength: null,
        },
      ],
    });

    prisma.category.findUnique.mockResolvedValue({
      id: 'cat_001',
      name: 'Process',
      isActive: true,
    });

    const request = new Request('http://localhost:3000/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Valid Title Here',
        description: 'This is a valid description with enough characters.',
        categoryId: 'cat_001',
        dynamicFieldValues: {},
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toBeDefined();
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

describe('GET /api/ideas', () => {
  const getServerSession = jest.requireMock('next-auth').getServerSession;
  const getUserRole = jest.requireMock('@/lib/auth/roles').getUserRole;

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue({ user: { id: 'user-123', email: 'user@example.com' } });
    getUserRole.mockResolvedValue('submitter');
  });

  it('should return 401 when not authenticated', async () => {
    getServerSession.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/ideas');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });

  it('should return ideas and pagination for authenticated submitter', async () => {
    const getIdeasForUser = jest.requireMock('@/lib/services/idea-service').getIdeasForUser;
    getIdeasForUser.mockResolvedValue({
      ideas: [
        {
          id: 'idea-1',
          title: 'My Idea',
          category: { id: 'c1', name: 'Tech' },
          submittedAt: new Date('2026-02-25T10:00:00.000Z'),
          hasAttachment: false,
          status: 'SUBMITTED',
          dynamicFieldValues: null,
        },
      ],
      pagination: { page: 1, pageSize: 15, totalCount: 1, totalPages: 1 },
    });

    const request = new Request('http://localhost:3000/api/ideas');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.ideas).toHaveLength(1);
    expect(data.ideas[0].title).toBe('My Idea');
    expect(data.pagination.page).toBe(1);
  });

  it('should return 400 for invalid page parameter', async () => {
    const request = new Request('http://localhost:3000/api/ideas?page=0');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid pagination parameters');
  });

  it('should return 400 for invalid pageSize (too large)', async () => {
    const request = new Request(
      'http://localhost:3000/api/ideas?pageSize=101',
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid pagination parameters');
  });

  it('should accept valid page and pageSize', async () => {
    const getIdeasForUser =
      jest.requireMock('@/lib/services/idea-service').getIdeasForUser;
    getIdeasForUser.mockResolvedValue({
      ideas: [],
      pagination: { page: 2, pageSize: 25, totalCount: 0, totalPages: 0 },
    });

    const request = new Request(
      'http://localhost:3000/api/ideas?page=2&pageSize=25',
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.page).toBe(2);
    expect(data.pagination.pageSize).toBe(25);
  });

  it('should pass categoryId filter when provided', async () => {
    const getIdeasForUser =
      jest.requireMock('@/lib/services/idea-service').getIdeasForUser;
    getIdeasForUser.mockResolvedValue({
      ideas: [],
      pagination: { page: 1, pageSize: 15, totalCount: 0, totalPages: 0 },
    });

    const request = new Request(
      'http://localhost:3000/api/ideas?categoryId=cat_001',
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(getIdeasForUser).toHaveBeenCalledWith(
      'user-123',
      'submitter',
      expect.objectContaining({ categoryId: 'cat_001' }),
    );
  });
});
