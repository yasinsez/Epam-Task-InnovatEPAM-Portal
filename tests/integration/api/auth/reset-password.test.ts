import { POST } from '@/app/api/auth/reset-password/route';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    passwordResetToken: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    authLog: {
      create: jest.fn(),
    },
  },
  logAuthEvent: jest.fn(async () => undefined),
}));

describe('POST /api/auth/reset-password', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;

  it('resets password with valid token', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      isUsed: false,
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    const request = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token', password: 'SecurePass123' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('rejects expired token', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      isUsed: false,
      expiresAt: new Date(Date.now() - 1000),
    });

    const request = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'expired-token', password: 'SecurePass123' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
