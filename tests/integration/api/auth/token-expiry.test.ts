import { POST as LOGOUT } from '@/app/api/auth/logout/route';
import { generateJWT } from '@/lib/auth/token';

describe('token expiry and invalidation', () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  it('rejects expired tokens', async () => {
    const token = generateJWT('user-1', 'employee@epam.com');
    const now = Math.floor(Date.now() / 1000);
    jest.spyOn(Date, 'now').mockReturnValue((now + 24 * 60 * 60 + 60) * 1000);

    const request = new Request('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    const response = await LOGOUT(request);
    expect(response.status).toBe(401);

    (Date.now as jest.Mock).mockRestore();
  });
});
