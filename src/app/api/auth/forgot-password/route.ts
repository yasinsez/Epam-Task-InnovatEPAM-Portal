import { NextResponse } from 'next/server';

import { emailService } from '@/lib/auth/email';
import { generatePasswordResetToken, getPasswordResetExpiry } from '@/lib/auth/token';
import { validateEmail } from '@/lib/utils/validators';
import { prisma, logAuthEvent } from '@/server/db/prisma';

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? '';

  if (!validateEmail(email)) {
    return NextResponse.json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
    });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = generatePasswordResetToken();

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: getPasswordResetExpiry(24),
      },
    });

    const delivery = await emailService.sendPasswordResetEmail(email, token);

    if (!delivery.success) {
      await logAuthEvent({
        userId: user.id,
        action: 'password_reset',
        status: 'failed',
        reason: 'email_delivery_failed',
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: 'If the email exists, a reset link has been sent',
  });
}
