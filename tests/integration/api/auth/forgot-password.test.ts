import { POST } from '@/app/api/auth/forgot-password/route';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    passwordResetToken: {
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
    sendPasswordResetEmail: jest.fn(async () => ({ success: true })),
  },
}));

describe('POST /api/auth/forgot-password', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;

  it('returns generic success for unknown email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unknown@epam.com' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toContain('If the email exists');
  });

  it('creates reset token and returns generic success for known email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'employee@epam.com' });

    const request = new Request('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee@epam.com' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(prisma.passwordResetToken.create).toHaveBeenCalled();
  });
});
