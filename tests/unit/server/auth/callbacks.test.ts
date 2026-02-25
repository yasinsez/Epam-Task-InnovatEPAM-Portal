jest.mock('@/server/db/prisma', () => ({
  prisma: {
    session: {
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth/password', () => ({
  verifyPassword: jest.fn(),
}));

jest.mock('@/lib/auth/token', () => ({
  generateJWT: jest.fn(() => 'jwt-token'),
  refreshToken: jest.fn(),
}));

jest.mock('@/lib/auth/roles', () => ({
  getUserRole: jest.fn(async () => 'submitter'),
}));

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

import { authCallbacks, credentialsProvider, revokeSessionByJwt } from '@/server/auth/callbacks';
import { prisma } from '@/server/db/prisma';

describe('auth callbacks', () => {
  it('revokeSessionByJwt deletes matching sessions', async () => {
    const prismaMock = prisma as unknown as { session: { deleteMany: jest.Mock } };
    await revokeSessionByJwt('abc');
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({ where: { jwt: 'abc' } });
  });

  it('jwt callback enriches token on sign-in', async () => {
    const token = await authCallbacks?.jwt?.({
      token: {},
      user: { id: 'u1', email: 'e@x.com', name: 'E' } as any,
      account: null,
      profile: undefined,
      trigger: 'signIn',
      isNewUser: false,
      session: undefined,
    } as any);

    expect(token?.sub).toBe('u1');
  });

  it('session callback maps token values', async () => {
    const session = await authCallbacks?.session?.({
      session: { user: {} },
      token: { sub: 'u1', email: 'e@x.com', name: 'E', authToken: 't' },
      user: undefined,
    } as any);

    expect((session as any).user.id).toBe('u1');
    expect((session as any).user.role).toBe('submitter');
  });

  it('credentials provider authorize returns null when missing fields', async () => {
    const result = await (credentialsProvider as any).options.authorize({}, {});
    expect(result).toBeNull();
  });
});
