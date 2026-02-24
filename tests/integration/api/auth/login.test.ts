import { POST } from '@/app/api/auth/login/route';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
    authLog: {
      create: jest.fn(),
    },
  },
  logAuthEvent: jest.fn(async () => undefined),
}));

jest.mock('@/lib/auth/rate-limiter', () => ({
  getCurrentLoginDelay: jest.fn(async () => 0),
  recordFailedLogin: jest.fn(async () => 0),
  resetFailedLogins: jest.fn(async () => undefined),
}));

jest.mock('@/server/api/auth/validators', () => ({
  validateLoginPayload: jest.fn(),
  verifyLoginCredentials: jest.fn(),
}));

describe('POST /api/auth/login', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;
  const verifyLoginCredentials = jest.requireMock('@/server/api/auth/validators').verifyLoginCredentials;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  it('returns token for valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    verifyLoginCredentials.mockResolvedValue({
      id: 'user-1',
      email: 'employee@epam.com',
      name: 'Employee',
    });

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee@epam.com', password: 'SecurePass123' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Auth-Token')).toBeTruthy();
    expect(body.success).toBe(true);
  });

  it('returns generic auth error for invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    verifyLoginCredentials.mockRejectedValue(new Error('Invalid email or password'));

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee@epam.com', password: 'wrong' }),
    });

    const response = await POST(request);

    expect([401, 500]).toContain(response.status);
  });
});
