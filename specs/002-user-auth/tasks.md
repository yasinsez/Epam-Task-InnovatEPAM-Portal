# Tasks: User Authentication System

**Input**: Design documents from `/specs/002-user-auth/`  
**Feature**: User Authentication (002-user-auth)  
**Tech Stack**: Next.js 14+, NextAuth.js v4+, Prisma ORM, PostgreSQL 14+, TypeScript 5.x  
**Output Phase**: Phase 2 Implementation  

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story using the Testing Pyramid (80% unit, 15% integration, 5% e2e).

## Format: `[ID] [P?] [Story] Description`

- **[ID]**: Task identifier (T001, T002, etc.) in execution order
- **[P]**: Task can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story (US1, US2, US3, US4, US5) - omitted for Setup/Foundational/Polish phases
- **File paths**: All task descriptions include exact file paths for implementation

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create project structure and install core dependencies

- [ ] T001 Create Next.js 14+ project structure with TypeScript strict mode enabled
- [ ] T002 Install core dependencies: next, react, typescript, prisma, @prisma/client, next-auth, bcrypt, zod in package.json
- [ ] T003 [P] Configure TypeScript with strict mode in tsconfig.json (strict: true, noImplicitAny: true)
- [ ] T004 [P] Setup ESLint and Prettier configuration for code quality
- [ ] T005 Create .env.local and .env.example with required variables: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, SENDGRID_API_KEY, RESEND_API_KEY
- [ ] T006 Initialize PostgreSQL database and create connection string for .env.local

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & ORM Setup

- [ ] T007 Create Prisma schema with User, Session, PasswordResetToken, FailedLoginAttempt, AuthLog entities in prisma/schema.prisma
- [ ] T008 Create and run initial Prisma migration for database schema in prisma/migrations/
- [ ] T009 Create Prisma client singleton in src/server/db/prisma.ts with proper initialization and connection pooling

### Utility & Validation Layer

- [ ] T010 [P] Create email and password validators in src/lib/utils/validators.ts (RFC 5322 email, 8+ char password validation)
- [ ] T011 [P] Create auth-specific error types in src/lib/utils/errors.ts (ValidationError, AuthenticationError, RateLimitError, etc.)
- [ ] T012 [P] Implement password hashing utility in src/lib/auth/password.ts (bcrypt hash/verify/validate functions with cost 12)

### Token & Session Management

- [ ] T013 Create JWT token utility in src/lib/auth/token.ts (generate, validate, refresh JWT functions with HS256)
- [ ] T014 Implement rate limiter utility in src/lib/auth/rate-limiter.ts (track failed logins, calculate exponential backoff delays: 1s→2s→4s)
- [ ] T015 Create email service abstraction in src/lib/auth/email.ts (SendGrid/Resend interface for registration and password reset emails)

### NextAuth Integration

- [ ] T016 [P] Create NextAuth.js configuration in src/server/auth/route.ts ([...nextauth] dynamic route handler)
- [ ] T017 [P] Implement NextAuth callbacks in src/server/auth/callbacks.ts (jwt, session, signIn callbacks for JWT embedding and session management)
- [ ] T018 Create JWT validation middleware in src/lib/auth/middleware.ts (validate and refresh tokens on protected routes)

### Core Auth Context

- [ ] T019 Create auth service interface in src/server/api/auth/auth-service.ts (abstract service for registration, login, logout operations)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Registration (Priority: P1) 🎯 MVP

**Goal**: Enable employees to create new accounts with email and password, receive confirmation email, and immediately access the system.

**Acceptance Criteria**:
- Valid email + password creates account and sends confirmation email
- Duplicate email rejected with generic error message
- Weak password (<8 chars) rejected with validation error
- Invalid email format rejected with validation error
- Confirmation email is sent but not required for account activation

**Independent Test**: Navigate to registration, enter valid email/password, submit form, verify account exists in database, verify confirmation email sent. User can immediately login with registered credentials.

### Unit Tests for User Story 1

- [ ] T020 [P] [US1] Unit test for email validation in tests/unit/lib/validators.test.ts
- [ ] T021 [P] [US1] Unit test for password validation in tests/unit/lib/validators.test.ts
- [ ] T022 [P] [US1] Unit test for password hashing in tests/unit/lib/auth/password.test.ts (verify bcrypt functions)

### Integration Tests for User Story 1

- [ ] T023 [US1] Integration test for registration endpoint in tests/integration/api/auth/register.test.ts (valid registration, duplicate email, weak password, invalid email)
- [ ] T024 [US1] Contract test for POST /api/auth/register response schema in tests/contract/api-auth.test.ts

### Implementation for User Story 1

- [ ] T025 [P] [US1] Create User model validation logic in src/server/api/auth/validators.ts (email uniqueness, password strength)
- [ ] T026 [US1] Implement POST /api/auth/register endpoint in src/app/api/auth/register/route.ts (request validation, password hashing, user creation, email queueing)
- [ ] T027 [US1] Integrate confirmation email sending in register endpoint using email service from src/lib/auth/email.ts
- [ ] T028 [US1] Add auth logging for registration attempts in src/server/db/prisma.ts (AuthLog entries for success/failure)
- [ ] T029 [US1] Create registration form UI in src/app/auth/register/page.tsx (email/password inputs, client-side validation, error display)

**Checkpoint**: User Story 1 complete - users can register, receive confirmation email, and access the system

---

## Phase 4: User Story 2 - User Login (Priority: P1)

**Goal**: Enable registered employees to authenticate with email/password and receive JWT tokens. Enforce progressive delay on failed attempts without permanent lockout.

**Acceptance Criteria**:
- Valid credentials generate JWT token and redirect to dashboard
- Invalid password shows generic error, applies progressive delay
- Non-existent email shows generic error (no email enumeration)
- Failed attempts trigger 1s→2s→4s delays (FR-017)
- Delay counter resets after 1 hour with no failed attempts
- Session persists across page navigation using JWT

**Independent Test**: Register user, logout, login with correct credentials, verify JWT token received and dashboard accessible. Test failed logins trigger delays without account lockout.

### Unit Tests for User Story 2

- [ ] T030 [P] [US2] Unit test for rate limiter delay calculation in tests/unit/lib/auth/rate-limiter.test.ts
- [ ] T031 [P] [US2] Unit test for JWT generation/validation in tests/unit/lib/auth/token.test.ts

### Integration Tests for User Story 2

- [ ] T032 [US2] Integration test for login endpoint in tests/integration/api/auth/login.test.ts (valid credentials, invalid password, non-existent user, rate limiting)
- [ ] T033 [US2] Integration test for rate limiter in tests/integration/lib/auth/rate-limiter.test.ts (progressive delays, counter reset after 1 hour)
- [ ] T034 [US2] Contract test for POST /api/auth/login response schema in tests/contract/api-auth.test.ts (JWT token in response)

### E2E Test for User Story 2

- [ ] T035 [US2] E2E test for login flow in tests/e2e/auth/login.spec.ts (Playwright: register → logout → login → verify dashboard access)

### Implementation for User Story 2

- [ ] T036 [P] [US2] Create login validation in src/server/api/auth/validators.ts (email existence check, password verification)
- [ ] T037 [US2] Implement FailedLoginAttempt recording in src/lib/auth/rate-limiter.ts (record failures, check counter, apply delays)
- [ ] T038 [US2] Implement POST /api/auth/login endpoint in src/app/api/auth/login/route.ts (credential validation, rate limit check, JWT generation, session creation)
- [ ] T039 [US2] Add JWT token to response in login endpoint (Authorization header or secure HTTP-only cookie per NextAuth pattern)
- [ ] T040 [US2] Create login form UI in src/app/auth/login/page.tsx (email/password inputs, error display, rate limit messages)
- [ ] T041 [US2] Implement JWT refresh logic in NextAuth callbacks (refresh token when <5 minutes remaining, FR-019)

**Checkpoint**: User Story 2 complete - users can login, receive JWT tokens, with progressive rate limiting on failed attempts

---

## Phase 5: User Story 3 - User Logout (Priority: P1)

**Goal**: Enable users to securely end their sessions and invalidate their JWT tokens.

**Acceptance Criteria**:
- Logout button clears JWT token and redirects to login page
- Protected pages redirect to login when user is logged out
- Cached JWT tokens rejected with 401 Unauthorized
- Multiple device sessions don't interfere when one device logs out

**Independent Test**: Login, click logout, attempt to access protected page via URL, verify redirect to login. Attempt to use old JWT token in API call, verify 401 rejection.

### Unit Tests for User Story 3

- [ ] T042 [P] [US3] Unit test for session invalidation in tests/unit/lib/auth/session.test.ts

### Integration Tests for User Story 3

- [ ] T043 [US3] Integration test for logout endpoint in tests/integration/api/auth/logout.test.ts (session invalidation, token rejection)
- [ ] T044 [US3] Contract test for POST /api/auth/logout response in tests/contract/api-auth.test.ts

### E2E Test for User Story 3

- [ ] T045 [US3] E2E test for logout flow in tests/e2e/auth/logout.spec.ts (Playwright: login → logout → verify login page redirect and protected page access blocked)

### Implementation for User Story 3

- [ ] T046 [US3] Implement POST /api/auth/logout endpoint in src/app/api/auth/logout/route.ts (invalidate session, clear JWT token)
- [ ] T047 [US3] Implement session invalidation in src/server/auth/callbacks.ts (remove session record from database)
- [ ] T048 [US3] Create logout button UI in src/app/components/LogoutButton.tsx (calls logout endpoint, redirects to login)
- [ ] T049 [US3] Implement protected route middleware in src/lib/auth/middleware.ts (check JWT validity, redirect to login if invalid/expired)

**Checkpoint**: User Story 3 complete - users can logout and have sessions properly invalidated

---

## Phase 6: User Story 4 - Password Reset (Priority: P2)

**Goal**: Enable users who forget their password to reset it via email without revealing account existence.

**Acceptance Criteria**:
- Forgot Password endpoint sends reset email if account exists
- Generic success message shown regardless of email delivery outcome
- Reset link valid for 24 hours only
- Password must meet 8-character minimum
- New password successfully logs user in
- Email delivery failures logged for admin review
- Duplicate reset link attempts rejected

**Independent Test**: Request password reset on registered email, receive reset link, click link, enter new password, login with new password. Test expired link rejected, test unregistered email shows same success message.

### Unit Tests for User Story 4

- [ ] T050 [P] [US4] Unit test for password reset token generation in tests/unit/lib/auth/token.test.ts
- [ ] T051 [P] [US4] Unit test for token expiry validation in tests/unit/lib/auth/token.test.ts

### Integration Tests for User Story 4

- [ ] T052 [US4] Integration test for forgot-password endpoint in tests/integration/api/auth/forgot-password.test.ts (valid email sends reset, invalid email shows same message, email delivery failure handling)
- [ ] T053 [US4] Integration test for reset-password endpoint in tests/integration/api/auth/reset-password.test.ts (valid token accepts new password, expired token rejected, weak password rejected)
- [ ] T054 [US4] Integration test for password reset token lifecycle in tests/integration/lib/auth/reset-token.test.ts (generation, validation, expiry, one-time use)

### E2E Test for User Story 4

- [ ] T055 [US4] E2E test for password reset flow in tests/e2e/auth/password-reset.spec.ts (Playwright: forgot password → receive email → click link → set new password → login with new password)

### Implementation for User Story 4

- [ ] T056 [P] [US4] Create password reset token generation in src/lib/auth/token.ts (cryptographically random token, 24h expiry)
- [ ] T057 [US4] Implement POST /api/auth/forgot-password endpoint in src/app/api/auth/forgot-password/route.ts (find user, generate token, queue email, show generic success message)
- [ ] T058 [US4] Implement POST /api/auth/reset-password endpoint in src/app/api/auth/reset-password/route.ts (validate token, check expiry, verify one-time use, update password)
- [ ] T059 [US4] Create password reset email template in src/lib/auth/email.ts (include reset link with token, 24h expiry notice)
- [ ] T060 [US4] Implement email delivery failure logging in src/lib/auth/email.ts (log to console/external service, return silent success to user)
- [ ] T061 [US4] Create forgot-password form UI in src/app/auth/forgot-password/page.tsx (email input, generic success message)
- [ ] T062 [US4] Create reset-password form UI in src/app/auth/reset-password/page.tsx (accept token from URL, new password input, validation, success redirect to login)

**Checkpoint**: User Story 4 complete - users can securely reset forgotten passwords via email

---

## Phase 7: User Story 5 - Session Management (Priority: P2)

**Goal**: Manage user sessions with 24-hour JWT expiry, automatic token refresh, and support for multiple concurrent sessions across devices.

**Acceptance Criteria**:
- JWT tokens valid for exactly 24 hours from issuance
- Tokens automatically refreshed when <5 minutes remaining (via response header)
- Expired tokens (>24h) rejected with 401
- Logout invalidates specific session without affecting other device sessions
- Multiple devices can maintain independent sessions simultaneously
- Session refresh happens silently without user interaction
- Unused sessions expire and require re-login after 24 hours

**Independent Test**: Login on multiple devices, monitor token age, verify automatic refresh on API calls near expiry, logout from one device, verify other device sessions unaffected. Wait 24 hours (or mock), verify token expiry.

### Unit Tests for User Story 5

- [ ] T063 [P] [US5] Unit test for token refresh logic in tests/unit/lib/auth/token.test.ts (verify <5min condition, new token generation)
- [ ] T064 [P] [US5] Unit test for session expiry in tests/unit/server/db/session.test.ts (24h expiry validation)

### Integration Tests for User Story 5

- [ ] T065 [US5] Integration test for token refresh in tests/integration/api/auth/token-refresh.test.ts (automatic refresh on API calls, new token in response header)
- [ ] T066 [US5] Integration test for multiple concurrent sessions in tests/integration/api/auth/concurrent-sessions.test.ts (independent tokens per device, isolated session management)
- [ ] T067 [US5] Integration test for token expiry in tests/integration/api/auth/token-expiry.test.ts (24h expiry, 401 on expired token, logout invalidates token)

### E2E Test for User Story 5

- [ ] T068 [US5] E2E test for multi-device session management in tests/e2e/auth/multi-device.spec.ts (Playwright: login on 2 browsers, verify independent sessions, logout from one, verify other session still active)

### Implementation for User Story 5

- [ ] T069 [P] [US5] Implement automatic token refresh in src/server/auth/callbacks.ts (check token age, generate new token if <5min remaining)
- [ ] T070 [P] [US5] Add token refresh response header in src/app/api/auth/refresh/route.ts (send new JWT in X-Auth-Token header when refreshing)
- [ ] T071 [US5] Implement client-side token refresh handling in src/app/components/AuthContext.tsx (listen for X-Auth-Token header, update stored token)
- [ ] T072 [US5] Create Session cleanup task in src/server/api/cron/session-cleanup.ts (delete expired sessions older than 24h+7 days)
- [ ] T073 [US5] Implement per-device session tracking in src/app/api/auth/sessions/route.ts (list active sessions with device info)
- [ ] T074 [US5] Implement session revocation in src/app/api/auth/sessions/[sessionId]/revoke/route.ts (allow users to logout from specific device)

**Checkpoint**: User Story 5 complete - sessions are securely managed with automatic refresh and multi-device support

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening, documentation, testing completion, and infrastructure concerns

### Security & Error Handling

- [ ] T075 [P] Implement comprehensive error handling across all auth endpoints in src/app/api/auth/*/route.ts (proper HTTP status codes, generic error messages)
- [ ] T076 [P] Add HTTPS enforcement and security headers in src/server/auth/route.ts (HSTS, X-Frame-Options, X-Content-Type-Options)
- [ ] T077 Add brute-force attack logging in src/lib/auth/rate-limiter.ts (alert on excessive failed attempts from single user/IP)
- [ ] T078 Implement CSRF protection for NextAuth configuration in src/server/auth/route.ts

### Testing & Validation

- [ ] T079 [P] Run all unit test suites and verify 80%+ coverage in tests/unit/
- [ ] T080 [P] Run all integration test suites in tests/integration/
- [ ] T081 Run E2E test suite in tests/e2e/ (verify all user story flows work end-to-end)
- [ ] T082 Validate quickstart.md setup instructions match implementation in docs/quickstart-validation.md

### Documentation & Monitoring

- [ ] T083 [P] Add JSDoc comments to all auth functions in src/lib/auth/ and src/server/auth/ (document @param, @returns, @throws)
- [ ] T084 [P] Create API documentation in docs/API.md (endpoint signatures, request/response examples, error codes)
- [ ] T085 Setup auth logging infrastructure in src/server/db/prisma.ts (log all auth events: register, login, logout, reset)
- [ ] T086 Create monitoring dashboard queries in docs/MONITORING.md (track registration rate, login success rate, failed login patterns, token refresh rate)
- [ ] T087 Document environment variable requirements in docs/ENVIRONMENT.md (DATABASE_URL, NEXTAUTH_SECRET, SENDGRID_API_KEY, etc.)

### Cleanup & Optimization

- [ ] T088 [P] Remove console.error temporary debugging from production code, use structured logging instead
- [ ] T089 [P] Verify all type safety with `npm run type-check` (no implicit any, strict mode)
- [ ] T090 Add request validation middleware in src/lib/auth/middleware.ts (validate all JSON payloads against schemas)
- [ ] T091 Optimize database queries in Prisma calls (add indexes, verify query efficiency in slow-query logs)
- [ ] T092 Cleanup temporary migration files and verify prisma/migrations/ only contains production schemas

**Checkpoint**: All features implemented, tested, documented, and hardened for production

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ─────[BLOCKS]─────┐
    ↓                                      │
Phase 3 (US1 Registration) ←──────────────┤
    ↓                                      │
Phase 4 (US2 Login) ←──────────────────────┤
    ↓                                      │
Phase 5 (US3 Logout) ←──────────────────────┤
    ↓                                      │
Phase 6 (US4 Password Reset) ←──────────────┤
    ↓                                      │
Phase 7 (US5 Session Management) ←──────────┤
    ↓                                      │
Phase 8 (Polish) ←─────────────────────────┘
```

### Within Each User Story

**Test-Driven Development Pattern** (write tests first):
1. Unit tests (TDD: write, watch fail, implement, watch pass)
2. Integration tests (verify components work together)
3. E2E tests (verify complete user journey)
4. Implementation (models → services → endpoints → UI)
5. Cross-story integration (if dependencies exist)

### Parallel Opportunities

**Phase 1 Setup** (independent):
- T003, T004 can run in parallel (TS config + linting)
- T005, T006 can run in parallel (env vars + database setup)

**Phase 2 Foundational** (within phase):
- T010, T011, T012 (validators, errors, password) can run in parallel
- T016, T017 (NextAuth route, callbacks) can run in parallel
- T013, T014, T015 (token logic, rate limiter, email service) can depend on T010-T012 but run together after

**Across User Stories** (after Phase 2):
- US1 (T020-T029) can start immediately after Phase 2
- US2 (T030-T041) can start after Phase 2, but needs US1 complete for login testing
- US3 (T042-T049) can start after US2 (needs login to test logout)
- US4 (T050-T062) can run in parallel with US3 (independent email flow)
- US5 (T063-T074) can run in parallel with US4 (builds on US1+US2 but independent refresh logic)

**Parallel User Story Example**:
```bash
# After Phase 2 complete, one engineer works on US1 while another starts US4
Engineer A:
  - Completes US1 (Registration) - T020 to T029
  - Completes US2 (Login) - T030 to T041
  - Completes US3 (Logout) - T042 to T049

Engineer B (in parallel after Phase 2):
  - Understands data model (PasswordResetToken, email service)
  - Completes US4 (Password Reset) - T050 to T062
  - Starts US5 (Session Management) - T063 to T074

Then combine: Both engineers verify all stories work together in Phase 8 Polish
```

### Critical Path to MVP

**Minimum implementation for MVP (first release)**:
1. Phase 1: Setup ✅
2. Phase 2: Foundational ✅
3. Phase 3: US1 Registration ✅
4. Phase 4: US2 Login ✅
5. Phase 5: US3 Logout ✅ 
6. Phase 8: Polish (minimum - T075, T076, T079, T083) ✅

**MVP ships with**: User can register, login with JWT, logout  
**Post-MVP deliverables**: US4 (Password Reset), US5 (Session Management)

---

## Task Checklist by User Story

### User Story 1 (Registration): 10 tasks
- Unit tests: 3 (T020-T022)
- Integration tests: 2 (T023-T024)
- Implementation: 5 (T025-T029)
- **Independent Test**: Register new account → verify DB entry → verify confirmation email sent

### User Story 2 (Login): 12 tasks
- Unit tests: 2 (T030-T031)
- Integration tests: 3 (T032-T034)
- E2E test: 1 (T035)
- Implementation: 6 (T036-T041)
- **Independent Test**: Login with registered creds → receive JWT → access protected pages

### User Story 3 (Logout): 8 tasks
- Unit tests: 1 (T042)
- Integration tests: 2 (T043-T044)
- E2E test: 1 (T045)
- Implementation: 4 (T046-T049)
- **Independent Test**: Logout → token invalid → protected pages redirect → old JWT rejected

### User Story 4 (Password Reset): 13 tasks
- Unit tests: 2 (T050-T051)
- Integration tests: 3 (T052-T054)
- E2E test: 1 (T055)
- Implementation: 7 (T056-T062)
- **Independent Test**: Forgot password → receive email → click link → reset password → login with new creds

### User Story 5 (Session Management): 12 tasks
- Unit tests: 2 (T063-T064)
- Integration tests: 3 (T065-T067)
- E2E test: 1 (T068)
- Implementation: 6 (T069-T074)
- **Independent Test**: Login on 2 devices → verify independent tokens → auto-refresh → logout one device doesn't affect other

### Phase 8 (Polish): 18 tasks
- Security & Error Handling: 4 (T075-T078)
- Testing & Validation: 4 (T079-T082)
- Documentation & Monitoring: 5 (T083-T087)
- Cleanup & Optimization: 5 (T088-T092)

**Total Task Count**: 92 tasks

---

## Testing Strategy

### Testing Pyramid (per Constitution Principle III)

**Target Coverage**: 80% unit | 15% integration | 5% E2E

### Unit Tests (80%)
- **Location**: `tests/unit/lib/` and `tests/unit/server/`
- **Scope**: Password hashing, validation, token generation/validation, rate limiter logic
- **Tools**: Jest + supertest
- **Execution**: `npm run test:unit` (fast, sub-second each)

Example unit tests:
```typescript
// tests/unit/lib/auth/password.test.ts
- hashPassword generates bcrypt hash
- verifyPassword validates correct password
- verifyPassword rejects invalid password
- validatePasswordStrength rejects <8 char passwords
```

### Integration Tests (15%)
- **Location**: `tests/integration/api/auth/`
- **Scope**: API endpoints with database, NextAuth flow, email queueing
- **Tools**: Jest + supertest + test database
- **Execution**: `npm run test:integration` (slower, 1-5s each)
- **Setup**: Use test database with migrations pre-applied

Example integration tests:
```typescript
// tests/integration/api/auth/register.test.ts
- POST /api/auth/register with valid data creates user
- POST /api/auth/register with duplicate email returns 409
- Confirmation email is queued after successful registration
```

### E2E Tests (5%)
- **Location**: `tests/e2e/auth/`
- **Scope**: Complete user journeys (register → login → logout → password reset)
- **Tools**: Playwright or Cypress
- **Execution**: `npm run test:e2e` (slowest, 10-30s per test)
- **Target Scenarios**: 
  - User registration + confirmation email
  - Login + dashboard access + logout
  - Password reset + new login
  - Multi-device session management

Example E2E tests:
```typescript
// tests/e2e/auth/registration-flow.spec.ts
- User navigates to registration
- Fills email and password
- Clicks register
- Sees success message
- Confirmation email is sent
- Can immediately login with registered credentials
```

### Test Execution

```bash
# Local development - watch mode
npm run test:unit -- --watch
npm run test:integration -- --watch

# CI/CD pipeline
npm run test:unit                    # Must pass
npm run test:integration             # Must pass
npm run test:e2e                     # Should pass (can be slower)
npm run test:coverage                # Verify 80%+ coverage
```

---

## Estimation & Team Sizing

### Estimated Story Points (T-shirt sizing)

- **US1 (Registration)**: M (Medium) - 5 days solo developer
  - Straightforward CRUD + email integration
  - Unit tests provide good safety net

- **US2 (Login)**: M-L (Medium-Large) - 6 days solo
  - Rate limiting logic adds complexity
  - JWT integration with NextAuth requires understanding of both

- **US3 (Logout)**: S (Small) - 2 days solo
  - Simple session invalidation
  - Build on US1+US2 work

- **US4 (Password Reset)**: M (Medium) - 5 days solo
  - Email workflow + token validation
  - Security considerations around token expiry

- **US5 (Session Management)**: L (Large) - 7 days solo
  - Token refresh logic
  - Multi-device session tracking
  - Requires testing on multiple browser instances

### Recommended Team Composition

**Optimal: 2-3 developers**
- **Senior Developer**: Phase 2 (Foundational) setup → review all user story implementations
- **Mid Developer**: US1 + US2 + US3 (Registration/Login/Logout)
- **Mid Developer**: US4 + US5 (Password Reset/Session Management) + Phase 2 partnership

**Timeline**: 4-5 weeks for full feature (with parallel work)
- Week 1: Phase 1-2 (Setup + Foundational)
- Weeks 2-4: User Stories 1-5 in parallel
- Week 5: Phase 8 (Polish) + integration testing

---

## Pre-Implementation Checklist

Before starting Phase 1, verify:

- [ ] PostgreSQL 14+ installed and accessible
- [ ] Node.js 18+ installed
- [ ] Git repository cloned and .gitignore configured
- [ ] Team members have access to NextAuth.js docs
- [ ] SendGrid or Resend account created and API keys available
- [ ] TypeScript knowledge (strict mode requirements)
- [ ] Understanding of Next.js 14+ App Router
- [ ] Jest and Playwright test frameworks reviewed
- [ ] All design documents (plan.md, spec.md, data-model.md) reviewed by team

---

## Success Criteria

Feature implementation is **COMPLETE** when:

- ✅ All 92 tasks have status "DONE"
- ✅ All 5 user stories independently functional and tested
- ✅ >80% test coverage (unit+integration+E2E combined)
- ✅ Zero critical security issues (no hardcoded secrets, HTTPS enforced)
- ✅ All API endpoints contract-tested per `contracts/api-auth.md`
- ✅ Quickstart.md validation passes (docs accurate)
- ✅ Authentication works on production (Vercel deployment)
- ✅ Team aware of maintenance procedures (database migration, emergency token revocation)

---

## Post-Implementation Support

### Ongoing Maintenance

**Daily Operations**:
- Monitor auth logs for failed login patterns (rate limiting effectiveness)
- Check email delivery success rate (SendGrid/Resend logs)
- Review error logs for OAuth anomalies

**Weekly Tasks**:
- Verify session cleanup is running (expired sessions deleted)
- Check database query performance (token validation latency <50ms target)

**Monthly Review**:
- Analyze registration/login trends
- Review security advisory updates for NextAuth.js + Prisma
- Prepare changelog for next release

### Scaling Considerations

For 100+ concurrent users (per plan.md scope):
- Connection pooling: Use PgBouncer with Prisma
- Rate limiting: Consider Redis cache for higher throughput (future optimization)
- Email queueing: Implement job queue (Bull/RabbitMQ) for high volume
- Token validation: Cache token expiry checks (Redis) if <50ms target becomes issue

### Post-MVP Enhancements

1. **Multi-factor authentication (2FA)** - TOTP/SMS
2. **Social login** - Google, Microsoft, GitHub OAuth
3. **Session management UI** - View active devices, revoke sessions
4. **Audit logging** - Exportable security audit trail
5. **Account recovery** - Security questions, account recovery emails
6. **Passwordless login** - Magic links, WebAuthn

