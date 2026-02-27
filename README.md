# InnovatEPAM Portal

InnovatEPAM Portal is an employee innovation management platform. The **MVP scope is implemented** across Phases 1–8.

## Implemented Features

- **User authentication** — register, login, logout, password reset; JWT-based sessions with 24-hour expiry; silent token refresh via `X-Auth-Token`; concurrent multi-device sessions and per-session revoke; progressive delay rate limiting for failed login attempts
- **Role-based access** — SUBMITTER, EVALUATOR, ADMIN with role-specific dashboards
- **Auth landing page** — `/auth` entry point for unauthenticated users (mobile-first, WCAG 2.1 AA)
- **Idea submission** — form with title, description, category, and optional single-file attachment
- **Idea listing** — paginated list with category filter (submitters see own ideas; evaluators/admins see all)
- **Idea detail view** — view full idea and attachment
- **Evaluation workflow** — start review, accept/reject with comments (submitted → under review → accepted/rejected)
- **Admin user management** — list users, change roles

## Tech Stack

- **Framework**: Next.js 14 (App Router) + React 18
- **Language**: TypeScript (strict mode)
- **Authentication**: NextAuth + JWT + custom auth routes
- **Database**: PostgreSQL + Prisma ORM
- **Validation**: Zod
- **Security**: bcrypt password hashing, auth middleware, rate-limiter
- **Testing**: Jest (unit, integration, contract) + Playwright (e2e)

## Project Structure

Key directories:

- `src/app/api/auth/*` → auth API routes
- `src/app/api/ideas/*` → ideas API (list, create, evaluate, attachment)
- `src/app/api/admin/*` → admin user management
- `src/app/auth/*` → auth pages (landing, login/register/forgot/reset)
- `src/app/ideas/*` → idea pages (list, submit, detail)
- `src/app/admin/*` → admin dashboard and user management
- `src/app/dashboard/*` → role-specific dashboards
- `src/lib/auth/*` → token, password, middleware, rate limiter, email, roles
- `src/lib/services/*` → idea-service, evaluation-service, attachment-service
- `src/server/api/auth/*` → auth service and validators
- `src/server/db/*` → Prisma client
- `prisma/*` → schema and migrations
- `tests/*` → unit, integration, contract, and e2e suites
- `docs/*` → API, environment, monitoring, validation docs
- `specs/002-user-auth/` through `specs/008-auth-landing-page/` → feature spec artifacts

## Application Routes

| Route | Description |
| ----- | ----------- |
| `/` | Redirects authenticated → `/dashboard`, unauthenticated → `/auth` |
| `/auth` | Auth landing (Sign In, Create Account) |
| `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password` | Auth flows |
| `/dashboard` | Role-based dashboard (submitter/evaluator/admin) |
| `/ideas` | Idea listing with pagination and category filter |
| `/ideas/submit` | Submit new idea |
| `/ideas/[id]` | Idea detail view |
| `/admin`, `/admin/users` | Admin dashboard and user management |
| `/access-denied` | Access denied page |

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

4. Seed the database (categories and dev users):

   ```bash
   npm run db:seed
   ```

5. Start development server:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000`.

### Test Accounts (after seeding)

| Email | Password | Role |
| ----- | -------- | ----- |
| `submitter@epam.com` | Submitter@12345 | SUBMITTER |
| `evaluator@epam.com` | Evaluator@12345 | EVALUATOR |
| `admin@epam.com` | Admin@12345 | ADMIN |

## Available Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — lint code
- `npm run type-check` — TypeScript checks
- `npm run db:seed` — seed categories and dev users
- `npm test` — run all Jest tests
- `npm run test:unit` — unit tests
- `npm run test:integration` — integration tests
- `npm run test:contract` — contract tests
- `npm run test:e2e` — Jest e2e tests
- `npm run test:e2e:playwright` — Playwright e2e tests
- `npm run test:coverage` — coverage report

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh`
- `GET /api/auth/sessions`
- `POST /api/auth/sessions/:sessionId/revoke`

### Admin

- `GET /api/admin/users`
- `PATCH /api/admin/users/:userId/role`

### Ideas

- `GET /api/ideas` — paginated list (query: page, pageSize, categoryId)
- `POST /api/ideas` — create idea with optional attachment (multipart)

### Idea by ID

- `PATCH /api/ideas/:id/start-review` — move idea to UNDER_REVIEW
- `POST /api/ideas/:id/evaluate` — accept/reject with comments
- `GET /api/ideas/:id/attachment` — download attachment

See request/response details in `docs/API.md`.

## Quality and Validation

- Implementation follows spec-driven workflow under `specs/002-user-auth/` through `specs/008-auth-landing-page/`
- Quickstart alignment documented in `docs/quickstart-validation.md`
- Monitoring/query guidance in `docs/MONITORING.md`

## Sprint Context (Module Guide Alignment)

This repository is built as part of **A201 – Beyond Vibe Coding** sprint workflow:

- Spec-first development
- Test generation before/alongside implementation
- Iterative delivery of MVP capabilities
- Documentation and demo readiness as part of done criteria

## Future Enhancements

- Richer category management
- Notifications and reporting
- Additional evaluation stages

---

Repository: `yasinsez/Epam-Task-InnovatEPAM-Portal`
