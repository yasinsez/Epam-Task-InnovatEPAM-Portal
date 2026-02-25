import { NextResponse } from 'next/server';

import { emailService } from '@/lib/auth/email';
import { hashPassword } from '@/lib/auth/password';
import { AuthenticationError, ValidationError } from '@/lib/utils/errors';
import { prisma, logAuthEvent } from '@/server/db/prisma';
import { assertEmailUnique, validateRegistrationPayload } from '@/server/api/auth/validators';

type RegisterBody = {
  email?: string;
  password?: string;
};

function getRequestContext(request: Request): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  };
}

export async function POST(request: Request): Promise<Response> {
  const context = getRequestContext(request);

  try {
    const body = (await request.json()) as RegisterBody;
    const email = body.email?.trim().toLowerCase() ?? '';
    const password = body.password ?? '';

    validateRegistrationPayload(email, password);
    await assertEmailUnique(email);

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    await logAuthEvent({
      userId: user.id,
      action: 'register',
      status: 'success',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    await emailService.sendConfirmationEmail(email);

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully. Confirmation email sent.',
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    if (error instanceof AuthenticationError) {
      await logAuthEvent({
        action: 'register',
        status: 'failed',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        reason: 'duplicate_email',
      });

      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 409 },
      );
    }

    await logAuthEvent({
      action: 'register',
      status: 'failed',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      reason: 'internal_error',
    });

    return NextResponse.json(
      { success: false, error: 'An error occurred during registration' },
      { status: 500 },
    );
  }
}
