import { POST } from '@/app/api/drafts/[id]/submit/route';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth/roles', () => ({
  getUserRole: jest.fn(),
  resolveUserIdForDb: jest.fn((id: string) => Promise.resolve(id)),
}));

jest.mock('@/lib/services/draft-service', () => ({
  submitDraft: jest.fn(),
}));

describe('POST /api/drafts/[id]/submit', () => {
  const getServerSession = jest.requireMock('next-auth').getServerSession;
  const getUserRole = jest.requireMock('@/lib/auth/roles').getUserRole;
  const submitDraft = jest.requireMock('@/lib/services/draft-service').submitDraft;

  const createRequest = (body: object) =>
    new Request('http://localhost:3000/api/drafts/draft-1/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue({ user: { id: 'user-123', email: 'user@example.com' } });
    getUserRole.mockResolvedValue('submitter');
  });

  it('should submit draft successfully', async () => {
    submitDraft.mockResolvedValue({
      id: 'draft-1',
      title: 'My idea',
      status: 'SUBMITTED',
      submittedAt: new Date('2026-02-28T12:00:00Z'),
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Tech' },
      description: 'Valid description with enough characters',
      dynamicFieldValues: {},
    });

    const request = createRequest({
      title: 'My idea',
      description: 'Valid description with enough characters',
      categoryId: 'cat-1',
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'draft-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.idea.status).toBe('SUBMITTED');
  });

  it('should return 404 when draft not found', async () => {
    submitDraft.mockRejectedValue(new Error('Draft not found'));

    const request = createRequest({
      title: 'My idea',
      description: 'Valid description with enough characters',
      categoryId: 'cat-1',
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'draft-1' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Draft not found');
  });

  it('should return 400 with details when validation fails', async () => {
    submitDraft.mockRejectedValue(
      new Error(
        JSON.stringify({
          validationErrors: [
            { field: 'title', message: 'Title must be at least 5 characters' },
          ],
        }),
      ),
    );

    const request = createRequest({
      title: 'Hi',
      description: 'Valid description with enough characters',
      categoryId: 'cat-1',
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'draft-1' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.details).toBeDefined();
    expect(data.details.title).toEqual(
      expect.arrayContaining([expect.stringMatching(/5 characters/)]),
    );
  });

  it('should return 403 when user is not submitter', async () => {
    getUserRole.mockResolvedValue('evaluator');

    const request = createRequest({
      title: 'My idea',
      description: 'Valid description with enough characters',
      categoryId: 'cat-1',
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'draft-1' }) });

    expect(response.status).toBe(403);
    expect(submitDraft).not.toHaveBeenCalled();
  });
});
