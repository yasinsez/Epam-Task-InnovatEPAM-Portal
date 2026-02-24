import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ZodType } from 'zod';

import { refreshToken, validateJWT } from '@/lib/auth/token';

/**
 * Validates authorization header for API requests and adds refresh token header when needed.
 *
 * @param request Next request object.
 * @returns Unauthorized response or passthrough response.
 */
export function validateAuthRequest(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const payload = validateJWT(token);

  if (!payload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const response = NextResponse.next();
  const refreshed = refreshToken(token);
  if (refreshed) {
    response.headers.set('X-Auth-Token', refreshed);
  }

  return response;
}

/**
 * Enforces authentication for protected pages and redirects to login when unauthorized.
 *
 * @param request Next request object.
 * @param loginPath Login route path.
 * @returns Redirect response or passthrough response.
 */
export function enforceProtectedRoute(request: NextRequest, loginPath = '/auth/login'): NextResponse {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;

  if (!token || !validateJWT(token)) {
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  return NextResponse.next();
}

/**
 * Validates JSON request body against a zod schema.
 *
 * @param request Request object.
 * @param schema Zod schema.
 * @returns Parsed data or 400 response.
 */
export async function validateJsonPayload<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  const body = await request.json().catch(() => null);

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Invalid request payload',
          issues: result.error.issues,
        },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: result.data };
}
