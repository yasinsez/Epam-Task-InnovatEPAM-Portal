# Implementation Tasks: Basic Role Distinction

**Phase 2 Output** | Actionable task breakdown  
**Date**: 2026-02-25 | **Feature**: User Roles (003-user-roles)

**Feature Branch**: `003-user-roles`

---

## Epic 1: Database & Schema

### Task 1.1 – Migrate User schema to add `role` field

**Story**: [User Story 1 – User Roles Assignment (P1)]  
**Type**: Schema/Database  
**Effort**: 1-2 hours

**Definition of Done**:
- [ ] Prisma schema updated with `UserRole` enum (SUBMITTER, EVALUATOR, ADMIN)
- [ ] `User.role` field added with default `SUBMITTER`
- [ ] Migration file generated via `npx prisma migrate dev --name add_user_roles`
- [ ] Migration runs cleanly on test database
- [ ] Existing users backfilled with `SUBMITTER` role (automatic via default)
- [ ] Prisma Client regenerated
- [ ] No type errors in TypeScript strict mode

**Acceptance Criteria**:
- Users table has a `role` column of type ENUM
- New registrations default to `SUBMITTER`
- Database reflects schema change (verified via Prisma Studio or SQL query)

---

## Epic 2: Backend – Role Enforcement & Guards

### Task 2.1 – Create role lookup utility (no caching)

**Story**: [User Story 1 & 2 – Role Assignment & Page Access (P1)]  
**Type**: Backend/Utility  
**Effort**: 1 hour

**Definition of Done**:
- [ ] New file: `src/lib/auth/roles.ts`
- [ ] Function `getUserRole(userId: string): Promise<string>` implemented
- [ ] Fetches role from database on every call (no caching)
- [ ] Returns role as lowercase string: 'submitter' | 'evaluator' | 'admin'
- [ ] Throws error if user not found or role missing
- [ ] JSDoc documented with @param, @returns, @throws, @example
- [ ] Unit tests cover all branches (user found, role missing, user not found)
- [ ] Test coverage ≥95%

**Acceptance Criteria**:
- Function fetches fresh role from DB every call
- Errors appropriately for missing users/roles
- Type-safe return type

---

### Task 2.2 – Create role guard utilities for API routes

**Story**: [User Story 3 – Role-Based API Access (P1)]  
**Type**: Backend/Utility  
**Effort**: 2-3 hours

**Definition of Done**:
- [ ] New file: `src/lib/auth/role-guards.ts`
- [ ] Function `requireRole(...allowedRoles: string[])` implemented
- [ ] Returns a wrapper that checks NextAuth session + DB role
- [ ] Returns 401 if no session, 403 if role not in allowedRoles
- [ ] JSDoc documented
- [ ] Usage example: `export const POST = requireRole('admin')(async (req) => { ... })`
- [ ] Unit tests cover all cases (no session, invalid role, valid role)
- [ ] Integration tests verify with real DB
- [ ] Test coverage ≥90%

**Acceptance Criteria**:
- API routes can be wrapped with role guard
- Unauthorized requests rejected with appropriate status codes
- Guard fetches fresh role from DB (no cached permission)

---

### Task 2.3 – Integrate role checks into NextAuth callbacks

**Story**: [User Story 1 – Role Assignment (P1)]  
**Type**: Backend/Auth  
**Effort**: 2 hours

**Definition of Done**:
- [ ] Update NextAuth configuration in `src/server/auth/callbacks.ts`
- [ ] Add `authorized` callback to load user role and pass to session
- [ ] Verify role is always fetched from DB (not embedded in token)
- [ ] Documentation updated: explain role is checked per-request, not cached
- [ ] Unit tests verify callback loads role correctly
- [ ] Integration tests verify session contains role hydration
- [ ] Test coverage ≥85%

**Acceptance Criteria**:
- Session contains user role (retrieved from DB)
- Role is not stored in JWT (verified by checking token payload)
- Token refresh does not cache role

---

## Epic 3: Backend – Admin APIs

### Task 3.1 – Implement GET /api/admin/users (list users with roles)

**Story**: [User Story 1 – User Roles Assignment (P1)]  
**Type**: Backend/API  
**Effort**: 2 hours

**Definition of Done**:
- [ ] New API route: `src/app/api/admin/users/route.ts`
- [ ] GET handler queries all users (id, email, name, role)
- [ ] Admin guard applied (requireRole('admin'))
- [ ] Returns 200 with users array on success
- [ ] Returns 403 on non-admin request
- [ ] Returns 401 on missing session
- [ ] Paginated response (optional: limit 50 users per page for future scale)
- [ ] JSDoc documented
- [ ] Contract spec verified: [contracts/api-roles.md](./contracts/api-roles.md)
- [ ] Unit tests mocking Prisma
- [ ] Integration tests with real DB
- [ ] Test coverage ≥90%

**Acceptance Criteria**:
- Endpoint returns list of users with roles
- Non-admins cannot access endpoint
- Endpoint properly documented in API contract

---

### Task 3.2 – Implement PATCH /api/admin/users/{userId}/role (update role)

**Story**: [User Story 1 – User Roles Assignment (P1)]  
**Type**: Backend/API  
**Effort**: 2-3 hours

**Definition of Done**:
- [ ] New API route: `src/app/api/admin/users/[userId]/role/route.ts`
- [ ] PATCH handler validates role input (zod schema: submitter | evaluator | admin)
- [ ] Admin guard applied (requireRole('admin'))
- [ ] Self-demotion check: admin cannot change their own role (returns 403)
- [ ] Updates User.role in database
- [ ] Returns 200 with updated user object
- [ ] Returns 400 on invalid role value
- [ ] Returns 403 on non-admin or self-demotion
- [ ] Returns 404 on unknown user
- [ ] JSDoc documented
- [ ] Contract spec verified: [contracts/api-roles.md](./contracts/api-roles.md)
- [ ] Unit tests cover all error cases
- [ ] Integration tests verify role change persists and is enforced on next request
- [ ] Test coverage ≥90%

**Acceptance Criteria**:
- Endpoint updates user role in database
- Admins cannot demote themselves
- Non-admins cannot change roles
- Role change enforces immediately on next API call

---

## Epic 4: Backend – Page Access Control

### Task 4.1 – Create middleware for role-based route protection

**Story**: [User Story 2 – Role-Based Page Access (P1)]  
**Type**: Backend/Middleware  
**Effort**: 2-3 hours

**Definition of Done**:
- [ ] New file: `src/lib/auth/middleware.ts` (or update existing)
- [ ] Middleware exports `withRoleGuard(allowedRoles: string[])` helper
- [ ] Redirects to access denied page (e.g., /access-denied) for role mismatches
- [ ] Redirects to login for unauthenticated users
- [ ] JSDoc documented with usage example
- [ ] Works with Next.js middleware.ts and server components
- [ ] Unit tests mocking NextAuth
- [ ] Integration tests verify redirects
- [ ] Test coverage ≥85%

**Acceptance Criteria**:
- Protected pages redirect non-authorized users
- Login redirects to login page
- Access denied redirects to access denied page
- Role checked on every page load (no client-side only checks)

---

### Task 4.2 – Implement access-denied page

**Story**: [User Story 2 – Role-Based Page Access (P1)]  
**Type**: Frontend/Page  
**Effort**: 1 hour

**Definition of Done**:
- [ ] New page: `src/app/access-denied/page.tsx`
- [ ] Displays user-friendly message explaining access denied
- [ ] Shows current user's role
- [ ] Provides links to role-appropriate dashboard
- [ ] Styled consistently with existing UI
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Component documented with JSDoc
- [ ] E2E test verifies page displays correctly

**Acceptance Criteria**:
- Page loads when user lacks required role
- Message explains why access was denied
- User can navigate to allowed sections

---

## Epic 5: Frontend – Role-Based Navigation & UI

### Task 5.1 – Update AuthContext to include role

**Story**: [User Story 4 – Role-Based UI Display (P2)]  
**Type**: Frontend/Context  
**Effort**: 1-2 hours

**Definition of Done**:
- [ ] File: `src/app/components/AuthContext.tsx`
- [ ] AuthContext exports user object with `role: string`
- [ ] Role fetched from NextAuth session (already populated by callbacks)
- [ ] useAuth hook provides role to all components
- [ ] JSDoc documented
- [ ] TypeScript types for role strict ('submitter' | 'evaluator' | 'admin')
- [ ] Unit tests verify context provides role
- [ ] Test coverage ≥85%

**Acceptance Criteria**:
- Components can access user.role via useAuth hook
- Role type-safe in TypeScript
- Role always reflects current DB state (session refreshed per request)

---

### Task 5.2 – Create role-aware navigation component

**Story**: [User Story 4 – Role-Based UI Display (P2)]  
**Type**: Frontend/Component  
**Effort**: 2-3 hours

**Definition of Done**:
- [ ] New component: `src/app/components/Navigation.tsx`
- [ ] Conditionally renders menu items based on role:
  - Submitters: Submit Idea, My Ideas
  - Evaluators: Evaluation Queue, Assigned Ideas
  - Admins: All of above + Admin Panel, User Management
- [ ] No admin panel link shown to non-admins
- [ ] No evaluation queue link shown to submitters
- [ ] No submit idea link shown to evaluators
- [ ] JSDoc documented with role logic
- [ ] Styled consistently with brand
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Unit tests mock role and verify visibility
- [ ] E2E tests verify navigation items shown/hidden per role
- [ ] Test coverage ≥90%

**Acceptance Criteria**:
- Navigation displays correctly for each role
- Items hidden/shown appropriately
- Invalid role treated as unauthorized (no navigation items)

---

### Task 5.3 – Create role-specific dashboards

**Story**: [User Story 4 – Role-Based UI Display (P2)]  
**Type**: Frontend/Component  
**Effort**: 3-4 hours

**Definition of Done**:
- [ ] Create dashboard components:
  - `src/app/dashboard/submitter/page.tsx` – shows submission stats
  - `src/app/dashboard/evaluator/page.tsx` – shows evaluation stats
  - `/admin/page.tsx` – admin dashboard
- [ ] Submitter dashboard shows: ideas submitted, status breakdown (draft, pending, approved, rejected)
- [ ] Evaluator dashboard shows: pending reviews, completed reviews, average time per review
- [ ] Admin dashboard shows: user count by role, recent activity (optional)
- [ ] Dashboard redirects based on user's role
- [ ] JSDoc documented
- [ ] Styled with Tailwind CSS or CSS Modules
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Unit tests mock data and verify rendering
- [ ] E2E tests verify role-specific dashboard loads
- [ ] Test coverage ≥85%

**Acceptance Criteria**:
- Users see role-appropriate dashboard at `/dashboard` (e.g., submitter sees submitter dashboard)
- Dashboards display relevant statistics
- Unauthorized access redirected to access denied page

---

## Epic 6: Frontend – Role Guards in Components

### Task 6.1 – Create RoleGuard component for conditional rendering

**Story**: [User Story 4 – Role-Based UI Display (P2)]  
**Type**: Frontend/Component  
**Effort**: 1-2 hours

**Definition of Done**:
- [ ] New component: `src/app/components/RoleGuard.tsx`
- [ ] Props: `allowedRoles: string[]`, `children`
- [ ] Only renders children if user's role in allowedRoles
- [ ] Returns null (no error) if role not allowed
- [ ] JSDoc documented
- [ ] Unit tests verify rendering logic
- [ ] Test coverage ≥90%

**Acceptance Criteria**:
- Component renders only for allowed roles
- Safe to wrap any UI element
- Type-safe role prop

---

### Task 6.2 – Hide non-permitted action buttons

**Story**: [User Story 4 – Role-Based UI Display (P2)]  
**Type**: Frontend/Component  
**Effort**: 2 hours

**Definition of Done**:
- [ ] Update idea submission button (hide from evaluators)
  - Use RoleGuard to show only for 'submitter' role
- [ ] Update evaluation queue button (hide from submitters)
  - Use RoleGuard to show only for 'evaluator' role
- [ ] Update admin panel button (hide from non-admins)
  - Use RoleGuard to show only for 'admin' role
- [ ] All buttons tested with E2E scenarios
- [ ] Verify buttons hidden/shown per role
- [ ] Test coverage ≥80%

**Acceptance Criteria**:
- Action buttons visible only to authorized roles
- Hidden buttons do not appear in navigation or UI
- No console errors when role not authorized

---

## Epic 7: Testing & Validation

### Task 7.1 – Unit tests for role utilities and guards

**Story**: [All P1 stories]  
**Type**: Testing/Unit  
**Effort**: 3-4 hours

**Definition of Done**:
- [ ] Test file: `tests/unit/lib/auth/roles.test.ts`
- [ ] Tests for `getUserRole()`:
  - User found, role returned correctly
  - User not found, error thrown
  - Role missing, error thrown
- [ ] Test file: `tests/unit/lib/auth/role-guards.test.ts`
- [ ] Tests for `requireRole()`:
  - No session, returns 401
  - Invalid role, returns 403
  - Valid role, handler called
- [ ] Mock Prisma correctly with jest.mock
- [ ] All tests use AAA pattern (Arrange-Act-Assert)
- [ ] All tests independent (beforeEach isolation)
- [ ] Coverage report: ≥90% line, ≥85% branch
- [ ] Tests pass in CI

**Acceptance Criteria**:
- All role utilities have >90% coverage
- Tests are deterministic and fast (<1s each)
- No skipped tests

---

### Task 7.2 – Integration tests for admin APIs

**Story**: [User Story 1 – Role Assignment (P1)]  
**Type**: Testing/Integration  
**Effort**: 3-4 hours

**Definition of Done**:
- [ ] Test file: `tests/integration/api/admin/users.test.ts`
- [ ] Tests for GET /api/admin/users:
  - Admin can list users
  - Non-admin returns 403
  - Returns list with id, email, name, role
- [ ] Tests for PATCH /api/admin/users/{userId}/role:
  - Admin can update role
  - Non-admin returns 403
  - Invalid role returns 400
  - User not found returns 404
  - Self-demotion returns 403
- [ ] Tests verify role change persists in DB
- [ ] Tests verify role change enforced on next request (fresh DB lookup)
- [ ] Use real test database (Prisma seed)
- [ ] All tests use AAA pattern
- [ ] Tests independent (beforeEach cleanup)
- [ ] Coverage: ≥85%
- [ ] Tests pass in CI

**Acceptance Criteria**:
- Admin APIs tested with real DB
- Role enforcement verified
- All edge cases covered

---

### Task 7.3 – E2E tests for role-based page access

**Story**: [User Story 2 – Role-Based Page Access (P1)]  
**Type**: Testing/E2E  
**Effort**: 4-5 hours

**Definition of Done**:
- [ ] Test file: `tests/e2e/auth/role-access.spec.ts`
- [ ] Test user creation (submitter, evaluator, admin) with proper roles in DB
- [ ] Submitter access tests:
  - Can access /ideas/submit ✓
  - Cannot access /evaluation/queue → redirects to /access-denied
  - Cannot access /admin/users → redirects to /access-denied
- [ ] Evaluator access tests:
  - Can access /evaluation/queue ✓
  - Cannot access /ideas/submit → redirects to /access-denied
  - Cannot access /admin/users → redirects to /access-denied
- [ ] Admin access tests:
  - Can access /admin/users ✓
  - Can access /ideas/submit ✓
  - Can access /evaluation/queue ✓
- [ ] Test role change via admin API and verify enforcement on next page load
- [ ] All tests use Playwright
- [ ] All tests cleanup (delete test users)
- [ ] Tests pass in CI
- [ ] Test coverage captures critical workflows

**Acceptance Criteria**:
- E2E tests verify role-based access works end-to-end
- Tests cover all three roles
- Tests verify role changes take effect immediately

---

### Task 7.4 – E2E tests for role-based UI (navigation, buttons)

**Story**: [User Story 4 – Role-Based UI Display (P2)]  
**Type**: Testing/E2E  
**Effort**: 3-4 hours

**Definition of Done**:
- [ ] Test file: `tests/e2e/ui/role-navigation.spec.ts`
- [ ] Test navigation items per role:
  - Submitter: sees "Submit Idea", "My Ideas"
  - Submitter: does NOT see "Evaluation Queue", "Admin Panel"
  - Evaluator: sees "Evaluation Queue", "Assigned Ideas"
  - Evaluator: does NOT see "Submit Idea", "Admin Panel"
  - Admin: sees all navigation items
- [ ] Test action buttons hidden/shown per role
- [ ] Test dashboards display role-specific content
  - Submitter dashboard shows submission stats
  - Evaluator dashboard shows evaluation stats
  - Admin dashboard shows admin stats
- [ ] All tests use Playwright
- [ ] Tests cleanup
- [ ] Tests pass in CI

**Acceptance Criteria**:
- Navigation items visible/hidden correctly per role
- Dashboards display role-appropriate content
- UI is clean (no visible unauthorized buttons)

---

### Task 7.5 – Contract tests for admin role APIs

**Story**: [User Story 1 – Role Assignment (P1)]  
**Type**: Testing/Contract  
**Effort**: 2 hours

**Definition of Done**:
- [ ] Test file: `tests/contract/api-admin-roles.test.ts`
- [ ] Verify response schema matches [contracts/api-roles.md](./contracts/api-roles.md)
- [ ] GET /api/admin/users returns:
  - 200 with { success, users: [...] }
  - 401 on missing session
  - 403 on non-admin
- [ ] PATCH /api/admin/users/{userId}/role returns:
  - 200 with { success, user: {...} }
  - 400 on invalid role
  - 401 on missing session
  - 403 on non-admin or self-demotion
  - 404 on unknown user
- [ ] Response headers correct (JSON content-type, etc.)
- [ ] Tests pass

**Acceptance Criteria**:
- API responses match contract specification
- All status codes and schemas verified

---

## Epic 8: Documentation & Code Quality

### Task 8.1 – Add JSDoc to all new code

**Story**: [All stories]  
**Type**: Documentation  
**Effort**: 1-2 hours

**Definition of Done**:
- [ ] All functions have JSDoc with @param, @returns, @throws
- [ ] All components have JSDoc with prop descriptions
- [ ] API routes have JSDoc explaining purpose, access control, and main logic
- [ ] Complex logic has @example blocks
- [ ] Type annotations complete (no implicit any)
- [ ] TypeScript strict mode: zero errors
- [ ] Code review checklist passes

**Acceptance Criteria**:
- 100% of functions documented with JSDoc
- No implicit any types
- TypeScript strict mode passes

---

### Task 8.2 – Update schema.prisma documentation

**Story**: [All stories]  
**Type**: Documentation  
**Effort**: 1 hour

**Definition of Done**:
- [ ] Add comments to `UserRole` enum
- [ ] Add comments to `User.role` field
- [ ] Document validation rules (role values, defaults)
- [ ] Document enforcement (role fetched per request, not cached)

**Acceptance Criteria**:
- Schema is self-documenting
- Future developers understand role enforcement requirements

---

### Task 8.3 – Create README or docs for role implementation

**Story**: [All stories]  
**Type**: Documentation  
**Effort**: 2 hours

**Definition of Done**:
- [ ] Document created: `docs/ROLES.md` or section in `docs/API.md`
- [ ] Explains three role types and their capabilities
- [ ] Documents how to add role checks to new pages/APIs
- [ ] Shows example: wrapping a route with requireRole
- [ ] Shows example: using RoleGuard in component
- [ ] Documents testing patterns for roles
- [ ] Links to quickstart and contracts

**Acceptance Criteria**:
- Developers can understand and extend role system from docs
- Examples are copy-paste ready

---

## Dependency Order

1. **Task 1.1** (Database migration) – prerequisite for all backend tasks
2. **Tasks 2.1, 2.2** (utilities/guards) – prerequisite for Tasks 2.3, 3.1, 3.2
3. **Task 2.3** (NextAuth integration) – prerequisite for Tasks 5.1–5.3
4. **Tasks 3.1, 3.2** (admin APIs) – can run parallel after 2.1, 2.2
5. **Tasks 4.1, 4.2** (page access) – can run parallel after 2.1, 2.2
6. **Tasks 5.1–5.3** (frontend) – can run parallel after 2.3
7. **Tasks 6.1, 6.2** (role guards in UI) – can run parallel after 5.1
8. **Tasks 7.1–7.5** (tests) – throughout; prioritize after core features
9. **Tasks 8.1–8.3** (docs) – after implementation complete

---

## Estimation Summary

| Epic | Total Effort |
|------|--------------|
| Epic 1: Database | ~2 hours |
| Epic 2: Role Enforcement | ~7-8 hours |
| Epic 3: Admin APIs | ~4-5 hours |
| Epic 4: Page Access | ~4-5 hours |
| Epic 5: Frontend UI | ~6-10 hours |
| Epic 6: Role Guards | ~3-4 hours |
| Epic 7: Testing | ~16-20 hours |
| Epic 8: Documentation | ~4-5 hours |
| **Total** | **~46-59 hours** |

**Recommended Allocation**: 2-week sprint (80 hours available) with 50–60% dedicated to this feature (40–48 hours), allowing ~10–15 hours for code review, refinement, and integration.

---

## Definition of Done (Feature Complete)

- [ ] All tasks above completed
- [ ] All tests passing (unit + integration + E2E)
- [ ] Coverage thresholds met (80% line, 75% branch, 75% mutation)
- [ ] TypeScript strict: zero errors
- [ ] ESLint: zero violations
- [ ] Code review approved by 1+ maintainer
- [ ] JSDoc complete (100% of functions documented)
- [ ] Documentation updated (roles.md, API.md, quickstart.md)
- [ ] PR merged to main branch
- [ ] Deployed to staging (Vercel preview) and verified
- [ ] Success criteria from spec.md all verified:
  - SC-001: Users assigned roles correctly
  - SC-002: Access denied on unauthorized pages
  - SC-003: Admin role changes enforce immediately
  - SC-004: New registrations get submitter role
  - SC-005: UI displays role-specific content
  - SC-006: Concurrent role changes handled correctly
