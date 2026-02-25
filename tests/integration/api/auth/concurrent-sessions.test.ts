import { GET } from '@/app/api/auth/sessions/route';
import { generateJWT } from '@/lib/auth/token';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    session: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/auth/sessions', () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  it('returns active sessions for authenticated user', async () => {
    const prisma = jest.requireMock('@/server/db/prisma').prisma;

    prisma.session.findMany.mockResolvedValue([
      {
        id: 's1',
        userAgent: 'Chrome',
        ipAddress: '127.0.0.1',
        createdAt: new Date(),
        expiresAt: new Date(),
      },
      {
        id: 's2',
        userAgent: 'Firefox',
        ipAddress: '127.0.0.2',
        createdAt: new Date(),
        expiresAt: new Date(),
      },
    ]);

    const token = generateJWT('user-1', 'employee@epam.com');
    const request = new Request('http://localhost:3000/api/auth/sessions', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sessions).toHaveLength(2);
  });
});
