<!-- Sync Impact Report
Version bump: 1.0.0 → 1.1.0 (MINOR: Comprehensive Testing Principles expansion with 8 detailed sections)
Testing Principles expanded: Replaced single Testing Pyramid principle (III) with 8-section Testing Principles framework
  - Section 1: Testing Philosophy (TDD, RED-GREEN-REFACTOR)
  - Section 2: Coverage Requirements (70/20/10 pyramid, 80% line, 75% branch, 75% mutation)
  - Section 3: Test Types & Organization (unit/integration/E2E directory structure)
  - Section 4: Naming Conventions (test file/suite naming patterns)
  - Section 5: Test Anatomy (AAA pattern, beforeEach isolation)
  - Section 6: Mocking & Test Data (mock/stub/fake boundaries, fixtures)
  - Section 7: Quality Criteria (CRITICAL: observable behavior, no tautological tests, anti-patterns)
  - Section 8: Tools & Frameworks (Jest, React Testing Library, Playwright, Stryker, npm scripts, pre-commit, CI/CD)
Status: Complete - All 8 sections defined; mutation testing via Stryker; CI/CD gates specified
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

### III. Testing Principles (NON-NEGOTIABLE)

Testing is a first-class discipline woven into every layer of development. All testing practices MUST follow these comprehensive principles:

#### Section 1 – Testing Philosophy
The team MUST adopt Test-Driven Development (TDD) as the default development methodology:
- Tests MUST be written FIRST, before implementation code (RED-GREEN-REFACTOR cycle)
- Generated tests MUST derive from specifications and acceptance criteria, never from implementation details
- Rationale: TDD ensures specifications drive code design, reduces debugging cycles, and guarantees testable, loosely-coupled architectures

#### Section 2 – Coverage Requirements
Testing structure MUST follow the Testing Pyramid distribution with strict coverage targets:
- **Distribution**: Approximately 70% unit tests, 20% integration tests, 10% E2E tests
- **Unit Tests (70%)**: Services, utilities, business logic, validation functions, Prisma interactions, authentication flows
- **Integration Tests (20%)**: API endpoints, database operations, NextAuth flows, Server Actions, database transaction chains
- **E2E Tests (10%)**: Critical user workflows only (authentication, core revenue-impacting journeys)
- **Static Analysis**: TypeScript strict mode + ESLint comprehensive rules MUST pass with zero violations
- **Coverage Targets**: Minimum 80% line coverage, 75% branch coverage, 75% mutation score on business logic
- All tests MUST pass in CI before merge; coverage reports MUST be generated with every build
- Rationale: This distribution maximizes feedback speed while ensuring critical paths are validated; mutation testing catches subtle logic bugs

#### Section 3 – Test Types & Organization
Test files MUST be organized by type with predictable directory structures that mirror source code:
- **Unit Tests**: `tests/unit/**/*.test.ts` — mirror `src/` directory structure; one test file per source file
- **Integration Tests**: `tests/integration/**/*.test.ts` — group by feature module (e.g., `tests/integration/auth/`, `tests/integration/users/`)
- **E2E Tests**: `tests/e2e/**/*.spec.ts` — group by user journey (e.g., `tests/e2e/auth-flow.spec.ts`, `tests/e2e/checkout-flow.spec.ts`)
- Rationale: Mirrored structure accelerates test discoverability; feature-grouped integration tests clarify dependencies; E2E naming by user journey keeps test intent clear

#### Section 4 – Naming Conventions
Test file and suite naming conventions MUST be consistent and self-documenting:
- **Unit/Integration test files**: `ComponentName.test.ts` (matches source file name)
- **E2E test files**: `user-journey-name.spec.ts` (kebab-case, describing the user journey or workflow)
- **Test suites**: `describe('ComponentName', ...)` or `describe('User Journey: Authentication Flow', ...)` (matches file intent)
- **Test cases**: `it('should [do X] when [condition Y]', ...)` — imperative "should" statement that reads as a specification
- Rationale: Consistent naming enables developers to quickly locate tests; "should/when" format documents expected behavior

#### Section 5 – Test Anatomy
Every test MUST follow the Arrange-Act-Assert (AAA) pattern with strict isolation rules:
- **Arrange**: Set up test fixtures, mock dependencies, initialize state
- **Act**: Execute the function or component being tested
- **Assert**: Verify the output matches expectations
- Test-specific setup MUST use `beforeEach` (not `beforeAll`); ensures each test is stateless and independent
- Each test MUST be able to run in isolation without relying on other tests
- NO shared global state, shared fixtures, or test execution order dependencies
- Rationale: AAA clarity reduces cognitive load; `beforeEach` isolation prevents flaky tests; independent tests enable parallel execution and faster feedback

#### Section 6 – Mocking & Test Data
Mocking strategy MUST distinguish between what to mock, stub, and fake to maximize test effectiveness:
- **Mock**: External services and third-party APIs (email, payment processors, cloud services, HTTP APIs, Slack, analytics)
- **Stub**: Time-dependent functions (`Date.now()`, `setTimeout()`, `setInterval()`) — ensure tests are deterministic
- **Fake**: In-memory implementations (e.g., in-memory database for unit tests; `jest.mock('fs')` for file I/O)
- **Test Fixtures**: Use centralized, reusable test data builders for complex domain objects (e.g., `createTestUser()`, `setupMockAPI()`)
- Extract shared mock setup into helper functions to avoid duplication and improve maintainability
- **DO NOT mock**: Code you own (business logic, utilities, own services) — test the real implementation; DO NOT mock simple utilities (lodash, string manipulation)
- Rationale: Mocking the right boundaries prevents over-specification and brittleness; helpers reduce duplication and improve test clarity

#### Section 7 – Quality Criteria (CRITICAL)
Tests are only valuable if they enforce quality. All tests MUST exhibit these characteristics:

**What Makes a Good Test**:
- Tests **observable behavior**, not implementation details — refactor code without breaking tests
- Has **meaningful assertions** — never write tautological tests like `expect(x).toBe(x)` or assertions that always pass
- Tests **one thing** (single responsibility) — multiple assertions OK if testing one behavior; use separate tests for separate behaviors
- **Fast execution**: unit tests <1s, integration tests <5s — speed enables rapid feedback
- **Deterministic**: Same result on every run; no flaky failures from timing, iteration order, global state, or random data

**Quality Gates (Enforcement via CI)**:
- **Mutation Score**: Minimum 75% on business logic (use Stryker for JavaScript/TypeScript mutation testing)
- **No Tautological Tests**: Assertion reviews required in PR; assertions MUST validate non-obvious expectations
- **Oracle Validation**: All expected values (test oracles) MUST be human-verified; never copy expected values from unreviewed code
- **Coverage Thresholds**: Minimum 80% line coverage, 75% branch coverage on business logic

**Anti-Patterns MUST Be Avoided**:
- ❌ Testing private methods or internal implementation state — test public API
- ❌ Interdependent tests — test order MUST NOT matter; each test independent
- ❌ Brittle tests — tests that break on harmless refactoring; use behavior-driven assertions
- ❌ Flaky tests — intermittent failures from timing, concurrency, or shared state; root cause every flake
- ❌ Tests without assertions — dangling tests provide false confidence; every test MUST assert
- ❌ Copy-pasted test logic — extract helpers and shared setup to prevent divergent test maintenance

**Rationale**: Quality criteria distinguish signal from noise; mutation testing catches subtle logic bugs; oracle validation guarantees test integrity; anti-pattern avoidance prevents brittle, unmaintainable test suites

#### Section 8 – Tools & Frameworks
All testing, type checking, and quality tooling MUST be standardized across the project. Tool selection and command execution are non-negotiable:

**Static Analysis**:
- **Type Checker**: TypeScript 5.x with `strict: true` in `tsconfig.json` (non-negotiable; all implicit `any` forbidden)
- **Linter**: ESLint with `@typescript-eslint/parser`, `@typescript-eslint/recommended` + `@typescript-eslint/recommended-requiring-type-checking` ruleset; configuration in `.eslintrc.json`

**Unit & Integration Testing**:
- **Framework**: Jest 29.x+ (configured in `jest.config.js` with preset `ts-jest`)
- **Assertion Library**: Jest built-in matchers (expect API)
- **Component Testing**: React Testing Library 14.x+ (queries DOM by role/label, not implementation details)
- **Mocking**: Jest mocking API (`jest.mock()`, `jest.spyOn()`) + MSW (Mock Service Worker) for HTTP mocking in integration tests

**E2E Testing**:
- **Framework**: Playwright 1.40.x+ (configured in `playwright.config.ts`)
- **Optional**: Stagehand for AI-native browser automation (for complex visual validations or intelligent navigation)

**Coverage & Quality**:
- **Coverage Tool**: Jest coverage reports (enforced at 80% line, 75% branch minimum via CI)
- **Mutation Testing**: Stryker for JavaScript/TypeScript (configured in `stryker.config.mjs`; enforced at 75% mutation score minimum)

**Execution Commands** (npm scripts in `package.json`):
```
npm run typecheck        # tsc --noEmit
npm run lint             # eslint . --ext .ts,.tsx
npm run lint:fix         # eslint . --ext .ts,.tsx --fix
npm run test             # jest (all tests: unit + integration)
npm run test:unit        # jest --testPathPattern=tests/unit
npm run test:integration # jest --testPathPattern=tests/integration
npm run test:e2e         # playwright test
npm run coverage         # jest --coverage (generates coverage report)
npm run mutate           # stryker run (mutation testing; generates stryker report)
npm run test:watch       # jest --watch (for local development)
```

**Pre-Commit Hook**:
- MUST run: `npm run typecheck && npm run lint && npm run test:unit` (catches type/lint/unit errors before commit)
- Use husky + lint-staged to enforce; zero-tolerance for bypass (`--no-verify` blocked via branch protection)

**CI/CD Pipeline** (on every PR and main branch):
- ✅ Type check: `npm run typecheck` (zero failures)
- ✅ Lint: `npm run lint` (zero failures)
- ✅ All tests: `npm run test && npm run test:e2e` (zero failures)
- ✅ Coverage: `npm run coverage` (80% line, 75% branch minimum enforced)
- ✅ Mutation: `npm run mutate` (75% score minimum enforced on main branch)
- ✅ Bundle size check: `npm run build` (monitor Server Component sizes; flag regressions)
- All gates MUST pass before merge; no exceptions

**Rationale**: Standardized tooling eliminates "works on my machine" friction; automation via pre-commit + CI ensures consistency; mutation testing on main branch catches quality regressions early

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

**Version**: 1.1.0 | **Ratified**: 2026-02-24 | **Last Amended**: 2026-02-24
