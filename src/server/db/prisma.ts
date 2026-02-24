import { PrismaClient, type Prisma } from '@prisma/client';

type PrismaClientInstance = PrismaClient;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientInstance };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

type AuthLogAction = 'register' | 'login' | 'logout' | 'password_reset' | 'token_refresh';
type AuthLogStatus = 'success' | 'failed';

export async function logAuthEvent(input: {
  userId?: string;
  action: AuthLogAction;
  status: AuthLogStatus;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.authLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        status: input.status,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        reason: input.reason,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    return;
  }
}
