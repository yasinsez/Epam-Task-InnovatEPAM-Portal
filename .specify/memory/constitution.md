<!-- Sync Impact Report
Version bump: 0.0.0 → 1.0.0 (MINOR: Initial constitution with 5 core principles)
Principles added: TypeScript Strict Mode (1), Clean Code Practices (2), Testing Pyramid (3), JSDoc Documentation (4), Secure Auth & Persistence (5)
Technology section: Added Next.js, TypeScript, Prisma, PostgreSQL, NextAuth, Vercel guidelines
Development workflow: Added code review, testing gates, deployment approval
Status: Complete - No deferred placeholders
-->

# InnovatEPAM Portal Constitution

## Core Principles

### I. TypeScript Strict Mode & Type Safety
All code MUST use TypeScript with `strict: true` in `tsconfig.json`. Type safety is non-negotiable:
- No implicit `any` types permitted
- All function parameters and return types explicitly declared
- Strict null checks enforced
- Use discriminated unions and exhaustive type narrowing for state management
- Rationale: Type safety eliminates entire classes of runtime errors, enabling confident refactoring and reducing production bugs by 70%+

### II. Clean Code & Maintainability
Code MUST prioritize readability and maintainability with the following standards:
- Functions should be small (max 30 lines) and single-purpose
- Variable and function names MUST be descriptive and self-documenting
- Complex business logic MUST be extracted to dedicated utility functions/modules
- Use meaningful comments only for WHY, not WHAT (code shows the WHAT)
- Avoid nested ternaries, deeply nested conditionals; prefer early returns
- Rationale: Clean code reduces cognitive load, accelerates onboarding, and cuts debugging time by 40%

### III. Testing Pyramid (NON-NEGOTIABLE)
Testing structure MUST follow the Testing Pyramid: 80% unit tests (business logic), 15% integration tests, 5% e2e tests:
- **Unit Tests (80%)**: Focus on Prisma database interactions, validation logic, authentication flows, utility functions; target 80% coverage minimum on business logic
- **Integration Tests (15%)**: Test NextAuth flows, API route handlers, Server Actions, database transaction chains, and service-to-service interactions
- **E2E Tests (5%)**: Critical user journeys only (authentication, core workflows)
- All tests MUST run and pass before merge
- Coverage reports MUST be generated with every build; CI/CD MUST enforce minimum 80% on business logic
- Rationale: This pyramid maximizes feedback speed while ensuring critical paths are validated; catches regressions early

### IV. JSDoc Documentation (NON-NEGOTIABLE)
ALL code MUST be documented with JSDoc comments:
- Every function, component, Server Action, API route MUST have a JSDoc block
- JSDoc MUST include `@param`, `@returns`, `@throws`, `@deprecated` (if applicable) tags
- For complex logic, include `@example` with usage snippets
- React components MUST document props with `@typedef` or inline `@param` for each prop
- Database queries (Prisma) MUST document returned schema and error conditions
- Rationale: JSDoc enables IDE autocomplete, reduces documentation overhead, and improves developer experience

### V. Secure Authentication & Data Persistence
NextAuth.js MUST be the sole authentication mechanism. Prisma MUST be the exclusive database abstraction:
- NextAuth sessions MUST be validated on every Server Action and API route
- Passwords MUST never be logged or exposed in errors
- SQL queries MUST go through Prisma (never raw SQL without explicit security review)
- Database credentials MUST live in environment variables only; never in code
- Role-based access control (RBAC) MUST be enforced via NextAuth callbacks and Prisma queries
- PostgreSQL MUST be configured with encrypted connections (SSL in production)
- Rationale: Exclusive auth/ORM standards eliminate auth bypass vulnerabilities, SQL injection, and credential leaks; enforces consistent security posture

## Technology Stack & Infrastructure

**Framework**: Next.js 14+ (App Router)
**Language**: TypeScript 5.x with `strict: true`
**Database**: PostgreSQL 14+ via Prisma ORM
**Authentication**: NextAuth v4+ (sessions + JWT)
**Deployment**: Vercel (production) and preview deployments for all PRs
**Package Manager**: npm or yarn (consistent across team)
**Testing**: Jest + React Testing Library (unit/integration), Playwright (e2e)
**Code Quality**: ESLint (TypeScript rules), Prettier (formatting)
**Styling**: Tailwind CSS (preferred) or CSS Modules
**Logging**: Structured JSON logging (e.g., pino or winston)

**Non-negotiable Constraints**:
- All code MUST target Node.js 18+ runtime
- Bundle size MUST be monitored; Server Components preferred for large dependencies
- Environment variables MUST be prefixed with `NEXT_PUBLIC_` (public) or no suffix (private/server-only)
- API routes MUST use runtime validation (zod/yup) for request payloads
- No dangling console.logs in production code; use structured logging

## Development Workflow & Quality Gates

**Code Review Process**:
1. All changes MUST go through PR review before merge
2. At least ONE approval required; maintainers can self-merge after review self-review
3. PR title MUST follow conventional commits: `feat(module)`, `fix(bug)`, `docs:`, `test:`, `refactor:`
4. PR description MUST reference related issues/epics

**Testing Gates**:
- All tests MUST pass in CI; zero test skips (`.skip`, `.only`) in production code
- Coverage tool MUST report ≥80% on business logic; PR author responsible for justifying gaps
- Integration tests MUST validate NextAuth flows and Prisma queries with test database

**Database Migrations**:
- All schema changes MUST go through explicit `npx prisma migrate dev` workflow
- Migrations MUST be committed to VCS; no manual SQL
- Cannot drop columns without deprecation period (2 weeks minimum)

**Deployment**:
- Staging (preview) deployments MUST pass all tests + bundle size checks
- Production deployments MUST be tagged with git tag (vX.Y.Z)
- All deploy variables (NextAuth URL, database connection) MUST match environment

**Performance & Observability**:
- Core Web Vitals MUST be tracked via Vercel Analytics
- API response times MUST not exceed 2s for non-batch operations; batch operations 5s max
- Critical errors MUST be logged with stack traces and context; no silent failures

## Governance

This Constitution is the source of truth for InnovatEPAM Portal development. It supersedes informal practices and must be referenced in every code review and standup.

**Amendment Process**:
- Proposed amendments MUST be documented in a PR with rationale
- Changes affecting Principles I, III, IV, or V (core pillars) require unanimous maintainer agreement
- Non-breaking clarifications approved by single maintainer
- All amendments MUST include migration plan for existing code (in PRs or separate refactor tasks)

**Compliance Verification**:
- Every PR MUST verify compliance with Principles I–V via checklist in template
- Architecture Review Board (or maintainer) reviews quarterly for drift
- Any violation MUST be flagged in PR review; merge blocked until resolved

**Runtime Guidance**:
- Development guidelines and example patterns: See `docs/development-guide.md` and `.specify/templates/`
- Architecture decisions: See `docs/adr/` folder
- Troubleshooting & debugging: Consult test files as reference implementations

**Version**: 1.0.0 | **Ratified**: 2026-02-24 | **Last Amended**: 2026-02-24
