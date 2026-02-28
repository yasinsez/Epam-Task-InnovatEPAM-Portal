import { GET, PATCH, DELETE } from '@/app/api/drafts/[id]/route';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth/roles', () => ({
  getUserRole: jest.fn(),
  resolveUserIdForDb: jest.fn((id: string) => Promise.resolve(id)),
}));

jest.mock('@/lib/services/draft-service', () => ({
  getDraftById: jest.fn(),
  updateDraft: jest.fn(),
  discardDraft: jest.fn(),
}));

describe('GET /api/drafts/[id]', () => {
  const getServerSession = jest.requireMock('next-auth').getServerSession;
  const getUserRole = jest.requireMock('@/lib/auth/roles').getUserRole;
  const getDraftById = jest.requireMock('@/lib/services/draft-service').getDraftById;

  const context = { params: Promise.resolve({ id: 'draft-1' }) };

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue({ user: { id: 'user-123', email: 'user@example.com' } });
    getUserRole.mockResolvedValue('submitter');
  });

  it('should return draft when owner', async () => {
    getDraftById.mockResolvedValue({
      id: 'draft-1',
      title: 'My draft',
      description: 'WIP',
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Tech' },
      dynamicFieldValues: {},
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
      attachments: [],
    });

    const request = new Request('http://localhost:3000/api/drafts/draft-1');
    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.draft.id).toBe('draft-1');
  });

  it('should return 404 when draft not found', async () => {
    getDraftById.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/drafts/nonexistent');
    const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Draft not found');
  });

  it('should return 403 when user is evaluator', async () => {
    getUserRole.mockResolvedValue('evaluator');

    const request = new Request('http://localhost:3000/api/drafts/draft-1');
    const response = await GET(request, context);

    expect(response.status).toBe(403);
    expect(getDraftById).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/drafts/[id]', () => {
  const getServerSession = jest.requireMock('next-auth').getServerSession;
  const getUserRole = jest.requireMock('@/lib/auth/roles').getUserRole;
  const discardDraft = jest.requireMock('@/lib/services/draft-service').discardDraft;

  const context = { params: Promise.resolve({ id: 'draft-1' }) };

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue({ user: { id: 'user-123', email: 'user@example.com' } });
    getUserRole.mockResolvedValue('submitter');
    discardDraft.mockResolvedValue(undefined);
  });

  it('should discard draft when owner', async () => {
    const request = new Request('http://localhost:3000/api/drafts/draft-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('discarded');
  });

  it('should return 404 when draft not found', async () => {
    discardDraft.mockRejectedValue(new Error('Draft not found'));

    const request = new Request('http://localhost:3000/api/drafts/nonexistent', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
  });
});
