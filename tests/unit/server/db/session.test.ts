import { cleanupExpiredSessions } from '@/server/api/cron/session-cleanup';
import { prisma } from '@/server/db/prisma';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    session: {
      deleteMany: jest.fn(),
    },
  },
}));

describe('session expiry cleanup', () => {
  it('deletes expired sessions and returns deleted count', async () => {
    const prismaMock = prisma as unknown as {
      session: {
        deleteMany: jest.Mock;
      };
    };

    prismaMock.session.deleteMany.mockResolvedValue({ count: 2 });
    await expect(cleanupExpiredSessions()).resolves.toBe(2);
  });
});
