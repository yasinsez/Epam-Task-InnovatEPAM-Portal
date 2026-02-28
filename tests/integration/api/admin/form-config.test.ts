// Integration tests for GET and PUT /api/admin/form-config

import { GET, PUT } from '@/app/api/admin/form-config/route';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    formConfiguration: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    formFieldDefinition: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    authLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth/role-guards', () => ({
  requireRole: () => (handler: (req: Request, ctx: { params: Record<string, string> }) => Promise<Response>) =>
    async (req: Request, ctx: { params: Record<string, string> }) => handler(req, ctx),
}));

jest.mock('@/lib/services/form-config-service', () => ({
  getActiveConfig: jest.fn(),
  saveConfig: jest.fn(),
}));

jest.mock('@/lib/auth/roles', () => ({
  resolveUserIdForDb: jest.fn((id: string) => Promise.resolve(id)),
}));

describe('GET /api/admin/form-config', () => {
  const getActiveConfig = jest.requireMock('@/lib/services/form-config-service').getActiveConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.requireMock('next-auth').getServerSession.mockResolvedValue({
      user: { id: 'admin-123', email: 'admin@example.com' },
    });
  });

  it('should return form config when one exists', async () => {
    getActiveConfig.mockResolvedValue({
      id: 'cfg1',
      updatedAt: '2026-02-28T10:00:00.000Z',
      updatedById: 'admin-123',
      fields: [
        {
          id: 'f1',
          label: 'Department',
          fieldType: 'SINGLE_SELECT',
          required: true,
          displayOrder: 0,
          options: ['Eng', 'Product'],
          minValue: null,
          maxValue: null,
          maxLength: null,
        },
      ],
    });

    const request = new Request('http://localhost:3000/api/admin/form-config');
    const response = await GET(request, { params: Promise.resolve({}) } as unknown as {
      params: Promise<Record<string, string>>;
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.formConfig.id).toBe('cfg1');
    expect(data.formConfig.fields).toHaveLength(1);
    expect(data.formConfig.fields[0].label).toBe('Department');
  });

  it('should return empty config when none exists', async () => {
    getActiveConfig.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/admin/form-config');
    const response = await GET(request, { params: Promise.resolve({}) } as unknown as {
      params: Promise<Record<string, string>>;
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.formConfig.fields).toEqual([]);
  });
});

describe('PUT /api/admin/form-config', () => {
  const saveConfig = jest.requireMock('@/lib/services/form-config-service').saveConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.requireMock('next-auth').getServerSession.mockResolvedValue({
      user: { id: 'admin-123', email: 'admin@example.com' },
    });
  });

  it('should save valid form config', async () => {
    saveConfig.mockResolvedValue({
      id: 'cfg1',
      updatedAt: '2026-02-28T10:00:00.000Z',
      updatedById: 'admin-123',
      fields: [
        {
          id: 'f1',
          label: 'Department',
          fieldType: 'SINGLE_SELECT',
          required: true,
          displayOrder: 0,
          options: ['Eng', 'Product'],
          minValue: null,
          maxValue: null,
          maxLength: null,
        },
      ],
    });

    const request = new Request('http://localhost:3000/api/admin/form-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: [
          {
            label: 'Department',
            fieldType: 'SINGLE_SELECT',
            required: true,
            displayOrder: 0,
            options: ['Eng', 'Product'],
          },
        ],
      }),
    });

    const response = await PUT(request, { params: Promise.resolve({}) } as unknown as {
      params: Promise<Record<string, string>>;
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Form configuration updated');
    expect(data.formConfig.fields[0].label).toBe('Department');
  });

  it('should return 400 when label is too short', async () => {
    const request = new Request('http://localhost:3000/api/admin/form-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: [
          {
            label: '',
            fieldType: 'TEXT',
            required: true,
            displayOrder: 0,
          },
        ],
      }),
    });

    const response = await PUT(request, { params: Promise.resolve({}) } as unknown as {
      params: Promise<Record<string, string>>;
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toBeDefined();
  });
});
