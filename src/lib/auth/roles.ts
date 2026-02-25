import { prisma } from '@/server/db/prisma';

export type UserRole = 'submitter' | 'evaluator' | 'admin';

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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.role) {
    throw new Error('User role missing');
  }

  return user.role.toLowerCase() as UserRole;
}
