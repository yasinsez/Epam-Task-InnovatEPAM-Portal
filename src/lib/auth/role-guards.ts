import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { getUserRole, type UserRole } from '@/lib/auth/roles';

// Import authOptions directly to avoid circular dependency
const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
};

type RouteHandler<Params extends Record<string, string> = Record<string, string>> = (
  request: Request,
  context: { params: Params },
) => Promise<Response> | Response;

/**
 * Guards an API route handler with role-based access control.
 *
 * @param allowedRoles - Roles allowed to access the handler.
 * @returns A wrapper for route handlers that enforces role checks.
 * @example
 * export const POST = requireRole('admin')(async (request) => { ... });
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return function withRoleGuard<Params extends Record<string, string>>(
    handler: RouteHandler<Params>,
  ) {
    return async (request: Request, context: { params: Params }): Promise<Response> => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;

      if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      try {
        const role = await getUserRole(userId);
        if (!allowedRoles.includes(role)) {
          return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      return handler(request, context);
    };
  };
}
