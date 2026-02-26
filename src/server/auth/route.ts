import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';

import { authCallbacks, credentialsProvider } from '@/server/auth/callbacks';

/**
 * NextAuth configuration for credential-based authentication.
 * Includes secure cookie settings and CSRF token cookie policy.
 */
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
  pages: {
    signIn: '/auth/login',
  },
  cookies: {
    csrfToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Host-next-auth.csrf-token'
          : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  providers: [credentialsProvider],
  callbacks: authCallbacks,
};

const handler = NextAuth(authOptions);

type RouteContext = { params: Promise<{ nextauth?: string[] }> };

/**
 * Applies baseline security headers to auth responses.
 * Passes both request and context to NextAuth so it can resolve route params (nextauth action).
 */
async function withSecurityHeaders(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const response = await handler(request, context);

  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer');

  return response;
}

export const GET = withSecurityHeaders;
export const POST = withSecurityHeaders;
