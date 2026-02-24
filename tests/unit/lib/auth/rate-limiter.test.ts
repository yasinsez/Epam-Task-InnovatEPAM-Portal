import { prisma } from '@/server/db/prisma';
import { getCurrentLoginDelay, recordFailedLogin } from '@/lib/auth/rate-limiter';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    failedLoginAttempt: {
      deleteMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('rate limiter', () => {
  const prismaMock = prisma as unknown as {
    failedLoginAttempt: {
      deleteMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates progressive delays', async () => {
    prismaMock.failedLoginAttempt.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);

    await expect(recordFailedLogin('u1')).resolves.toBe(0);
    await expect(recordFailedLogin('u1')).resolves.toBe(1);
    await expect(recordFailedLogin('u1')).resolves.toBe(2);
  });

  it('returns current delay', async () => {
    prismaMock.failedLoginAttempt.count.mockResolvedValue(3);

    await expect(getCurrentLoginDelay('u1')).resolves.toBe(2);
  });
});
