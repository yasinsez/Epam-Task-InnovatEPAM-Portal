import { NextResponse } from 'next/server';

import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { isPasswordResetTokenExpired } from '@/lib/auth/token';
import { prisma, logAuthEvent } from '@/server/db/prisma';

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { token?: string; password?: string };
  const token = body.token ?? '';
  const password = body.password ?? '';

  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    return NextResponse.json(
      { success: false, error: passwordValidation.errors[0] ?? 'Invalid password' },
      { status: 400 },
    );
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken || resetToken.isUsed || isPasswordResetTokenExpired(resetToken.expiresAt)) {
    return NextResponse.json({ success: false, error: 'Invalid or expired reset token' }, { status: 400 });
  }

  const newPasswordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash: newPasswordHash },
  });

  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { isUsed: true, usedAt: new Date() },
  });

  await logAuthEvent({
    userId: resetToken.userId,
    action: 'password_reset',
    status: 'success',
  });

  return NextResponse.json({ success: true, message: 'Password reset successful' });
}
