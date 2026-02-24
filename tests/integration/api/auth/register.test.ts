import { POST } from '@/app/api/auth/register/route';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    authLog: {
      create: jest.fn(),
    },
  },
  logAuthEvent: jest.fn(async () => undefined),
}));

jest.mock('@/lib/auth/email', () => ({
  emailService: {
    sendConfirmationEmail: jest.fn(async () => ({ success: true })),
  },
}));

describe('POST /api/auth/register', () => {
  const { prisma } = jest.requireMock('@/server/db/prisma') as {
    prisma: {
      user: {
        findUnique: jest.Mock;
        create: jest.Mock;
      };
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates user with valid payload', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'employee@epam.com',
      createdAt: new Date('2026-02-24T00:00:00.000Z'),
    });

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee@epam.com', password: 'SecurePass123' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('returns conflict on duplicate email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee@epam.com', password: 'SecurePass123' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('Invalid email or password');
  });

  it('returns validation errors for weak password and invalid email', async () => {
    const weakPasswordRequest = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee@epam.com', password: 'short' }),
    });

    const invalidEmailRequest = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee-at-epam.com', password: 'SecurePass123' }),
    });

    const weakPasswordResponse = await POST(weakPasswordRequest);
    const invalidEmailResponse = await POST(invalidEmailRequest);

    expect(weakPasswordResponse.status).toBe(400);
    expect(invalidEmailResponse.status).toBe(400);
  });
});
