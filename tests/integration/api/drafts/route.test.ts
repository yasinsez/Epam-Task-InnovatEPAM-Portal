import { GET, POST } from '@/app/api/drafts/route';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth/roles', () => ({
  getUserRole: jest.fn(),
  resolveUserIdForDb: jest.fn((id: string) => Promise.resolve(id)),
}));

jest.mock('@/lib/services/draft-service', () => ({
  getDraftsForUser: jest.fn(),
  createDraft: jest.fn(),
}));

describe('GET /api/drafts', () => {
  const getServerSession = jest.requireMock('next-auth').getServerSession;
  const getUserRole = jest.requireMock('@/lib/auth/roles').getUserRole;
  const getDraftsForUser = jest.requireMock('@/lib/services/draft-service').getDraftsForUser;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when unauthenticated', async () => {
    getServerSession.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/drafts');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication');
  });

  it('should return 403 when user is evaluator', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'eval-1', email: 'eval@example.com' } });
    getUserRole.mockResolvedValue('evaluator');

    const request = new Request('http://localhost:3000/api/drafts');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('submitters');
  });

  it('should return drafts list for submitter', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'user-123', email: 'user@example.com' } });
    getUserRole.mockResolvedValue('submitter');
    getDraftsForUser.mockResolvedValue({
      drafts: [
        {
          id: 'draft-1',
          title: 'Untitled draft',
          updatedAt: new Date('2026-02-28T10:00:00Z'),
          createdAt: new Date('2026-02-28T09:00:00Z'),
          attachmentCount: 0,
        },
      ],
      pagination: {
        page: 1,
        pageSize: 15,
        totalCount: 1,
        totalPages: 1,
      },
    });

    const request = new Request('http://localhost:3000/api/drafts');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.drafts).toHaveLength(1);
    expect(data.drafts[0].id).toBe('draft-1');
    expect(data.pagination.totalCount).toBe(1);
  });
});

describe('POST /api/drafts', () => {
  const getServerSession = jest.requireMock('next-auth').getServerSession;
  const getUserRole = jest.requireMock('@/lib/auth/roles').getUserRole;
  const createDraft = jest.requireMock('@/lib/services/draft-service').createDraft;

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue({ user: { id: 'user-123', email: 'user@example.com' } });
    getUserRole.mockResolvedValue('submitter');
  });

  it('should return 403 when user is admin', async () => {
    getUserRole.mockResolvedValue('admin');

    const request = new Request('http://localhost:3000/api/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Draft' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  it('should create draft for submitter', async () => {
    createDraft.mockResolvedValue({
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

    const request = new Request('http://localhost:3000/api/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'My draft',
        description: 'Work in progress',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.draft.id).toBe('draft-new');
    expect(data.draft.title).toBe('My draft');
  });

  it('should return 400 when draft limit reached', async () => {
    createDraft.mockRejectedValue(new Error('Draft limit reached. Maximum 10 drafts per user.'));

    const request = new Request('http://localhost:3000/api/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Draft' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Draft limit');
  });
});
