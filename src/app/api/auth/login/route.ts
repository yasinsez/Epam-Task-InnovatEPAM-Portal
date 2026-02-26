import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

import { generateJWT } from '@/lib/auth/token';
import {
  getCurrentLoginDelay,
  recordFailedLogin,
  resetFailedLogins,
} from '@/lib/auth/rate-limiter';
import { shouldShowMockCredentials } from '@/lib/auth/mock-credentials';
import { AuthenticationError } from '@/lib/utils/errors';
import { prisma, logAuthEvent } from '@/server/db/prisma';
import { validateLoginPayload, verifyLoginCredentials } from '@/server/api/auth/validators';

type LoginBody = {
  email?: string;
  password?: string;
};

function getRequestContext(request: Request): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  };
}

/**
 * Checks if the given email is a mock credential in development mode
 */
function isMockCredential(email: string): boolean {
  if (!shouldShowMockCredentials()) {
    return false;
  }
  return ['admin@epam.com', 'submitter@epam.com', 'evaluator@epam.com'].includes(email.toLowerCase());
}

export async function POST(request: Request): Promise<Response> {
  const context = getRequestContext(request);
  let email = '';

  try {
    const body = (await request.json()) as LoginBody;
    email = body.email?.trim().toLowerCase() ?? '';
    const password = body.password ?? '';

    validateLoginPayload(email, password);

    // For non-mock users, check rate limiting
    if (!isMockCredential(email)) {
      const userLookup = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (userLookup) {
        const currentDelay = await getCurrentLoginDelay(userLookup.id);
        if (currentDelay > 0) {
          return NextResponse.json(
            {
              success: false,
              error: `Too many login attempts. Please try again in ${currentDelay} seconds.`,
              delaySeconds: currentDelay,
            },
            {
              status: 429,
              headers: {
                'Retry-After': String(currentDelay),
              },
            },
          );
        }
      }
    }

    const user = await verifyLoginCredentials(email, password);

    // Skip database operations for mock users in development
    if (!user.id.startsWith('mock-')) {
      await resetFailedLogins(user.id);

      await prisma.session.create({
        data: {
          userId: user.id,
          sessionToken: crypto.randomUUID(),
          jwt: '',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    const authToken = generateJWT(user.id, user.email, user.name ?? undefined);

    if (!user.id.startsWith('mock-')) {
      await logAuthEvent({
        userId: user.id,
        action: 'login',
        status: 'success',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      {
        status: 200,
        headers: {
          'X-Auth-Token': authToken,
        },
      },
    );

    response.cookies.set('auth-token', authToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      // For non-mock users, record failed login
      if (!isMockCredential(email)) {
        const userLookup = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        let delaySeconds = 0;
        if (userLookup) {
          delaySeconds = await recordFailedLogin(userLookup.id);
        }

        await logAuthEvent({
          userId: userLookup?.id,
          action: 'login',
          status: 'failed',
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          reason: 'invalid_credentials',
        });

        if (delaySeconds > 0) {
          return NextResponse.json(
            {
              success: false,
              error: `Too many login attempts. Please try again in ${delaySeconds} seconds.`,
              delaySeconds,
            },
            {
              status: 429,
              headers: {
                'Retry-After': String(delaySeconds),
              },
            },
          );
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during login',
      },
      { status: 500 },
    );
  }
}
