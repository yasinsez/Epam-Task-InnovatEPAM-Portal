# InnovatEPAM Portal

InnovatEPAM Portal is an employee innovation management platform being developed in iterative phases.

This repository currently implements the **User Authentication System** (register, login, logout, password reset, session management) as the Phase 1 foundation.

## Current Scope (Branch: `002-user-auth`)

Implemented and tested:

- User registration with email/password validation
- User login with JWT-based session token handling
- Logout with session invalidation
- Password reset flow (forgot password + reset password)
- Session management with 24-hour expiry
- Silent token refresh support via `X-Auth-Token` response header
- Concurrent multi-device sessions and per-session revoke endpoint
- Progressive delay rate limiting for failed login attempts

Planned next (MVP continuation):

- Role distinction (submitter vs evaluator/admin)
- Idea submission form (title, description, category)
- Single-file attachment per idea
- Idea listing/viewing
- Evaluation workflow (submitted, under review, accepted, rejected)

## Tech Stack

- **Framework**: Next.js 14 (App Router) + React 18
- **Language**: TypeScript (strict mode)
- **Authentication**: NextAuth + JWT + custom auth routes
- **Database**: PostgreSQL + Prisma ORM
- **Validation**: Zod
- **Security**: bcrypt password hashing, auth middleware, rate-limiter
- **Testing**: Jest (unit, integration, contract, e2e)

## Project Structure

Key directories:

- `src/app/api/auth/*` → auth API routes
- `src/app/auth/*` → auth pages (login/register/forgot/reset)
- `src/lib/auth/*` → token, password, middleware, rate limiter, email
- `src/server/api/auth/*` → auth service and validators
- `src/server/db/*` → Prisma client
- `prisma/*` → schema and migrations
- `tests/*` → unit, integration, contract, and e2e suites
- `docs/*` → API, environment, monitoring, validation docs
- `specs/002-user-auth/*` → feature spec artifacts

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL 14+

## Environment Variables

Create `.env.local` using `.env.example` and define:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `SENDGRID_API_KEY` (optional)
- `RESEND_API_KEY` (optional)

See full details in `docs/ENVIRONMENT.md`.

## Getting Started

1. Install dependencies:

	```bash
	npm install
	```

2. Configure environment variables in `.env.local`.

3. Run migrations:

	```bash
	npx prisma migrate dev
	```

4. Start development server:

	```bash
	npm run dev
	```

5. Open `http://localhost:3000`.

## Available Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — lint code
- `npm run type-check` — TypeScript checks
- `npm test` — run all tests
- `npm run test:unit` — unit tests
- `npm run test:integration` — integration tests
- `npm run test:contract` — contract tests
- `npm run test:e2e` — e2e tests
- `npm run test:coverage` — coverage report

## Auth API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh`
- `GET /api/auth/sessions`
- `POST /api/auth/sessions/:sessionId/revoke`

See request/response details in `docs/API.md`.

## Quality and Validation

- Implementation follows spec-driven workflow under `specs/002-user-auth/`
- Quickstart alignment documented in `docs/quickstart-validation.md`
- Monitoring/query guidance in `docs/MONITORING.md`

## Sprint Context (Module Guide Alignment)

This repository is built as part of **A201 – Beyond Vibe Coding** sprint workflow:

- Spec-first development
- Test generation before/alongside implementation
- Iterative delivery of MVP capabilities
- Documentation and demo readiness as part of done criteria

## Suggested Next Milestones

1. Add role model and authorization guards
2. Implement idea submission domain (API + UI + DB schema)
3. Add file upload handling for single attachment
4. Build idea listing and detail views
5. Implement evaluator decision workflow and status transitions

---

Repository: `yasinsez/Epam-Task-InnovatEPAM-Portal`