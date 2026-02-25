import { getUserRole } from '@/lib/auth/roles';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('getUserRole', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a lowercase role when user exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

    await expect(getUserRole('user-1')).resolves.toBe('admin');
  });

  it('throws when user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(getUserRole('missing-user')).rejects.toThrow('User not found');
  });

  it('throws when role is missing', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: null });

    await expect(getUserRole('user-2')).rejects.toThrow('User role missing');
  });
});
