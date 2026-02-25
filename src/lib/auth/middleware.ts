import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import type { ZodType } from 'zod';

import { getUserRole, type UserRole } from '@/lib/auth/roles';
import { refreshToken, validateJWT } from '@/lib/auth/token';
import { authOptions } from '@/server/auth/route';

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

type RoleGuardOptions = {
  loginPath?: string;
  accessDeniedPath?: string;
};

/**
 * Enforces role-based access to a route.
 *
 * @param allowedRoles Roles allowed to access the route.
 * @param options Optional redirect paths.
 * @returns Middleware handler enforcing role-based access.
 */
export function withRoleGuard(allowedRoles: UserRole[], options: RoleGuardOptions = {}) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const loginPath = options.loginPath ?? '/auth/login';
    const accessDeniedPath = options.accessDeniedPath ?? '/access-denied';

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.redirect(new URL(loginPath, request.url));
    }

    try {
      const role = await getUserRole(userId);
      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL(accessDeniedPath, request.url));
      }
    } catch {
      return NextResponse.redirect(new URL(accessDeniedPath, request.url));
    }

    return NextResponse.next();
  };
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
