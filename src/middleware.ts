import { withAuth } from 'next-auth/middleware';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware matcher configuration.
 * Protects dashboard, admin, and other role-based routes.
 */
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/access-denied'],
};

/**
 * Role requirements for routes.
 * Routes not listed here are accessible to all authenticated users.
 */
const roleRequirements: Record<string, string[]> = {
  '/admin': ['admin'],
  '/dashboard/submitter': ['submitter', 'admin'],
  '/dashboard/evaluator': ['evaluator', 'admin'],
};

/**
 * Checks if a route path requires specific roles.
 *
 * @param pathname Route path.
 * @returns Array of required roles, or null if route is public.
 */
function getRequiredRoles(pathname: string): string[] | null {
  // Exact match
  if (roleRequirements[pathname]) {
    return roleRequirements[pathname];
  }

  // Prefix match (e.g., /admin/users matches /admin)
  for (const [path, roles] of Object.entries(roleRequirements)) {
    if (
      pathname.startsWith(path) &&
      (pathname.length === path.length || pathname[path.length] === '/')
    ) {
      return roles;
    }
  }

  return null;
}

/**
 * Middleware for NextAuth-based role enforcement on protected routes.
 * Uses role from JWT (set at login) since middleware runs on Edge and cannot use Prisma.
 */
export default withAuth(
  async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const requiredRoles = getRequiredRoles(pathname);

    // If route doesn't require a role, allow access
    if (!requiredRoles) {
      return NextResponse.next();
    }

    // Get token from NextAuth JWT (role is stored in JWT at login)
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const userRole = token.role as string | undefined;
    if (!userRole || !requiredRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/access-denied', request.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);
