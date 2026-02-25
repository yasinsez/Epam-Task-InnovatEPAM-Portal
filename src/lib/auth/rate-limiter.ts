import { prisma } from '@/server/db/prisma';
import { logger } from '@/lib/utils/logger';

const ONE_HOUR_MS = 60 * 60 * 1000;

function getDelaySeconds(failures: number): number {
  if (failures <= 1) {
    return 0;
  }

  return Math.min(2 ** (failures - 2), 4);
}

/**
 * Records a failed login and returns the delay for the next attempt.
 *
 * @param userId User identifier.
 * @param reason Failure reason label.
 * @returns Delay in seconds.
 */
export async function recordFailedLogin(
  userId: string,
  reason = 'password_incorrect',
): Promise<number> {
  const threshold = new Date(Date.now() - ONE_HOUR_MS);

  await prisma.failedLoginAttempt.deleteMany({
    where: {
      userId,
      attemptAt: { lt: threshold },
    },
  });

  const failuresInWindow = await prisma.failedLoginAttempt.count({
    where: {
      userId,
      attemptAt: { gte: threshold },
    },
  });

  await prisma.failedLoginAttempt.create({
    data: {
      userId,
      reason,
    },
  });

  if (failuresInWindow + 1 >= 5) {
    logger.warn('Potential brute-force attack detected', {
      userId,
      failuresInLastHour: failuresInWindow + 1,
    });
  }

  return getDelaySeconds(failuresInWindow + 1);
}

/**
 * Returns current login delay for a user based on failures in the last hour.
 *
 * @param userId User identifier.
 * @returns Delay in seconds.
 */
export async function getCurrentLoginDelay(userId: string): Promise<number> {
  const threshold = new Date(Date.now() - ONE_HOUR_MS);
  const failuresInWindow = await prisma.failedLoginAttempt.count({
    where: {
      userId,
      attemptAt: { gte: threshold },
    },
  });

  return getDelaySeconds(failuresInWindow);
}

/**
 * Clears failed login records for a user.
 *
 * @param userId User identifier.
 * @returns Promise resolved when records are removed.
 */
export async function resetFailedLogins(userId: string): Promise<void> {
  await prisma.failedLoginAttempt.deleteMany({ where: { userId } });
}
