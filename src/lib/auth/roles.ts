import { prisma } from '@/server/db/prisma';

export type UserRole = 'submitter' | 'evaluator' | 'admin';

/**
 * Resolves mock user ID (e.g. mock-submitter) to the real database user ID when available.
 * Used for DB queries where ideas are filtered by userId (e.g. submitter's own ideas).
 *
 * @param userId - Session user ID (may be mock-{role})
 * @param userEmail - Session user email for lookup
 * @returns Real user ID when mock user has a corresponding DB user, otherwise original userId
 */
export async function resolveUserIdForDb(
  userId: string,
  userEmail: string | null | undefined,
): Promise<string> {
  if (!userId.startsWith('mock-') || !userEmail) {
    return userId;
  }
  const realUser = await prisma.user.findUnique({
    where: { email: userEmail.toLowerCase().trim() },
    select: { id: true },
  });
  return realUser?.id ?? userId;
}

/**
 * Loads the current role for a user from the database.
 *
 * @param userId - The user id from the session.
 * @returns The user's current role.
 * @throws Error when the user does not exist or has no role.
 * @example
 * const role = await getUserRole('user-id');
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  // Check for mock user ID in development (format: mock-{role})
  if (userId.startsWith('mock-')) {
    const mockRole = userId.slice(5) as UserRole; // Remove 'mock-' prefix
    if (['admin', 'submitter', 'evaluator'].includes(mockRole)) {
      return mockRole;
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Default to submitter for users missing role (e.g. created before role migration)
  const role = user.role?.toLowerCase() ?? 'submitter';
  return role as UserRole;
}
