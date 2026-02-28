import { getUserRole, resolveUserIdForDb } from '@/lib/auth/roles';

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

  it('defaults to submitter when role is missing', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: null });

    await expect(getUserRole('user-2')).resolves.toBe('submitter');
  });

  it('returns mock role when userId starts with mock- and role is valid', async () => {
    await expect(getUserRole('mock-admin')).resolves.toBe('admin');
    await expect(getUserRole('mock-evaluator')).resolves.toBe('evaluator');
    await expect(getUserRole('mock-submitter')).resolves.toBe('submitter');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('falls through to DB when mock- prefix has invalid role', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

    await expect(getUserRole('mock-invalid')).resolves.toBe('admin');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'mock-invalid' },
      select: { role: true },
    });
  });
});

describe('resolveUserIdForDb', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns userId when it does not start with mock-', async () => {
    await expect(
      resolveUserIdForDb('real-user-123', 'user@epam.com'),
    ).resolves.toBe('real-user-123');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('returns userId when userEmail is null or undefined', async () => {
    await expect(resolveUserIdForDb('mock-submitter', null)).resolves.toBe(
      'mock-submitter',
    );
    await expect(resolveUserIdForDb('mock-admin', undefined)).resolves.toBe(
      'mock-admin',
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('returns real user id when mock user has corresponding DB user', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'db-user-456' });

    await expect(
      resolveUserIdForDb('mock-submitter', 'submitter@epam.com'),
    ).resolves.toBe('db-user-456');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'submitter@epam.com' },
      select: { id: true },
    });
  });

  it('returns original userId when mock user has no DB user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      resolveUserIdForDb('mock-submitter', 'unknown@epam.com'),
    ).resolves.toBe('mock-submitter');
  });
});
