import { prisma } from '@/server/db/prisma';

const DAYS_TO_KEEP_EXPIRED = 7;

export async function cleanupExpiredSessions(): Promise<number> {
  const cutoff = new Date(Date.now() - DAYS_TO_KEEP_EXPIRED * 24 * 60 * 60 * 1000);

  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: cutoff },
    },
  });

  return result.count;
}
