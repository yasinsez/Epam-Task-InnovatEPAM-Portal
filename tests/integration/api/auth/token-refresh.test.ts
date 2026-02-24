import { POST } from '@/app/api/auth/refresh/route';
import { generateJWT } from '@/lib/auth/token';

describe('POST /api/auth/refresh', () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  it('returns unauthorized without token', async () => {
    const request = new Request('http://localhost:3000/api/auth/refresh', { method: 'POST' });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns a refreshed token header when token near expiry', async () => {
    const token = generateJWT('user-1', 'employee@epam.com');
    const now = Math.floor(Date.now() / 1000);
    jest.spyOn(Date, 'now').mockReturnValue((now + 24 * 60 * 60 - 60) * 1000);

    const request = new Request('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Auth-Token')).toBeTruthy();
    (Date.now as jest.Mock).mockRestore();
  });
});
