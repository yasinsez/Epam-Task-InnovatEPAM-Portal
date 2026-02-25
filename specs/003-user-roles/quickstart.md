# Quick Start: User Roles Implementation

**Phase 1 Output** | Developer guide for implementing role-based access control  
**Date**: 2026-02-25 | **Feature**: User Roles (003-user-roles)

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ database
- NextAuth and Prisma already configured (see spec 002-user-auth)

## Step 1: Update Prisma Schema

Add the `UserRole` enum and `User.role` field (see data-model.md), then run:

```bash
npx prisma migrate dev --name add_user_roles
```

## Step 2: Role Lookup Helper

Create a server-only helper to fetch role by user ID (no role caching):

```typescript
/**
 * Loads the current role for a user from the database.
 * @param userId - The user id from the session
 * @returns The user's current role
 * @throws Error if the user does not exist
 */
export async function getUserRole(userId: string): Promise<'submitter' | 'evaluator' | 'admin'> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (!user?.role) {
    throw new Error('User role missing');
  }

  return user.role.toLowerCase() as 'submitter' | 'evaluator' | 'admin';
}
```

## Step 3: Protect Pages and APIs

- Add middleware route checks for role-specific paths (submitter, evaluator, admin)
- In each protected API route, load role from DB and enforce access
- Ensure immediate enforcement (no session refresh required)

## Step 4: Admin Role Management API

Implement admin-only endpoints as defined in `contracts/api-roles.md`:
- `GET /api/admin/users`
- `PATCH /api/admin/users/{userId}/role`

## Step 5: UI Updates

- Show role-appropriate navigation and dashboards
- Hide admin/evaluator actions from submitters
- Show full navigation for admins

## Step 6: Testing

- Unit: role guard utilities and role validation
- Integration: admin role update endpoint and access denied cases
- E2E: role-based page access and navigation visibility

Suggested commands:
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```
