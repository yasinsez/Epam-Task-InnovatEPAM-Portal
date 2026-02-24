import { POST } from '@/app/api/auth/logout/route';

jest.mock('@/server/auth/callbacks', () => ({
  revokeSessionByJwt: jest.fn(async () => undefined),
}));

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  it('returns unauthorized when token missing', async () => {
    const request = new Request('http://localhost:3000/api/auth/logout', { method: 'POST' });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('logs out with valid token', async () => {
    const jwt = await import('@/lib/auth/token');
    const token = jwt.generateJWT('user-1', 'employee@epam.com');

    const request = new Request('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
