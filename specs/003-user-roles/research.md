# Research: Basic Role Distinction (Submitter vs. Evaluator/Admin)

**Phase 0 Output** | Key technical decisions and rationale  
**Date**: 2026-02-25 | **Feature**: User Roles (003-user-roles)

## Decision 1: Store role on `User` as a Prisma enum field

**Decision**: Add `role` to `User` with enum values `SUBMITTER`, `EVALUATOR`, `ADMIN`, defaulting to `SUBMITTER`.

**Rationale**:
- Matches requirement for exactly one role per user
- Simplifies queries and enforcement (single column lookup)
- Prisma enum enforces allowed values at schema level

**Alternatives considered**:
- Separate `Role` table with FK (unnecessary complexity for fixed roles)
- Many-to-many `UserRole` join table (not needed for exclusive roles)

---

## Decision 2: Enforce roles by DB lookup on every protected request

**Decision**: Fetch role from the database for each protected API call and page access check; do not embed role in JWT or session.

**Rationale**:
- Meets explicit requirement to avoid role caching in tokens
- Ensures immediate enforcement after role changes
- Avoids stale permission data in long-lived sessions

**Alternatives considered**:
- Store role in JWT claims (rejected by spec)
- Cache role in session store (rejected by spec)

---

## Decision 3: Page access control via middleware + server-side guards

**Decision**: Use Next.js middleware for route-level gating and server-side helpers (e.g., `getServerSession` + DB role lookup) for Server Components and API routes.

**Rationale**:
- Middleware provides early redirects for protected routes
- Server-side guards ensure no client-only enforcement gaps
- Aligns with Next.js App Router patterns

**Alternatives considered**:
- Client-only guards (insufficient security)
- Static route protection without role checks (does not meet requirements)

---

## Decision 4: Admin role management endpoints under `/api/admin/users`

**Decision**: Provide admin-only endpoints for listing users and updating roles.

**Rationale**:
- Clear separation of admin capabilities
- Matches existing API organization under `/api/`
- Simplifies RBAC checks (admin-only gate)

**Alternatives considered**:
- Generic `/api/roles` endpoints (less direct to admin user management)
- UI-only role changes without API (not feasible for persistence)
