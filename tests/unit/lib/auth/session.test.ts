import { prisma } from '@/server/db/prisma';
import { revokeSessionByJwt } from '@/server/auth/callbacks';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    session: {
      deleteMany: jest.fn(),
    },
  },
}));

describe('session invalidation', () => {
  it('revokes session by jwt token', async () => {
    const prismaMock = prisma as unknown as {
      session: {
        deleteMany: jest.Mock;
      };
    };

    await revokeSessionByJwt('token-123');

    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
      where: { jwt: 'token-123' },
    });
  });
});
