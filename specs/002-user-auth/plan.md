# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

User authentication system for InnovatEPAM Portal supporting registration, login, logout, password reset, and session management via JWT tokens. Built on Next.js 14+ with NextAuth.js and Prisma ORM, enforcing TypeScript strict mode, comprehensive testing pyramid, and secure credential handling per constitution principles.

## Technical Context

**Language/Version**: TypeScript 5.x with `strict: true`  
**Primary Dependencies**: Next.js 14+, NextAuth.js v4+, Prisma ORM, PostgreSQL 14+  
**Storage**: PostgreSQL 14+ (Prisma abstraction layer)  
**Testing**: Jest + React Testing Library (unit/integration), Playwright (e2e)  
**Target Platform**: Web application, Vercel deployment  
**Project Type**: Next.js web service with authentication module  
**Performance Goals**: JWT validation sub-50ms latency (SC-005), login completion <30s (SC-002), password reset <5min (SC-004)  
**Constraints**: ≥80% test coverage on business logic, HTTPS required, no implicit `any` types, secure token handling per NextAuth/Prisma standards  
**Scale/Scope**: InnovatEPAM Portal initial auth system, 12 user stories, 20 functional requirements, support for 100 concurrent registrations/logins

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**✓ PASS** - User authentication system is fully aligned with InnovatEPAM Portal Constitution:

1. **Principle I (TypeScript Strict Mode)**: Auth system will enforce strict type safety on all authentication flows (NextAuth callbacks, Prisma queries, JWT validation). Type-safe session/token handling reduces auth bypass vulnerabilities.

2. **Principle II (Clean Code)**: Auth logic naturally decomposes into modular services (registration handler, login handler, token refresh, password reset) each <30 lines, with validation/security concerns separated from business logic.

3. **Principle III (Testing Pyramid)**: Auth feature aligns perfectly with pyramid model:
   - **Unit (80%)**: Password hashing, email validation, token expiry logic, delay calculation (FR-017), JWT creation/validation
   - **Integration (15%)**: NextAuth flows, Prisma User/Token queries, email service integration, session persistence
   - **E2E (5%)**: Registration → login → dashboard, forgot password → reset workflow

4. **Principle IV (JSDoc Documentation)**: Every auth handler, API route, and Prisma schema function will have complete JSDoc with `@param`, `@returns`, `@throws` tags. NextAuth callbacks, token refresh logic, and salt/hash operations require detailed documentation.

5. **Principle V (Secure Auth & Data Persistence)**: Feature directly implements this principle:
   - NextAuth.js is sole auth mechanism (Principles V requirement)
   - Prisma is exclusive database abstraction
   - Password hashing required (FR-004)
   - JWT validation on all routes (FR-008, FR-010)
   - HTTPS required (assumption in spec)
   - Environment variables for secrets

**No violations**. No Complexity Tracking table needed.

**Post-Design Validation** (Phase 1 complete):
- ✓ Data model confirms Prisma + PostgreSQL alignment
- ✓ API contracts validate NextAuth session callbacks integration
- ✓ Session contract confirms JWT refresh middleware pattern complies with Principle I (strict types)
- ✓ Quickstart guide demonstrates type-safe implementations for all handler functions
- ✓ Testing considerations in data-model.md supports Testing Pyramid (80/15/5)

**Architecture remains fully aligned with Constitution V. Ready for Phase 2 (Implementation).**

## Project Structure

### Documentation (this feature)

```text
specs/002-user-auth/
├── plan.md              # This file (phase 0 output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api-auth.md      # API contract: POST /api/auth/register, /api/auth/login, etc.
│   └── session.md       # Session contract: JWT structure, refresh behavior
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (Next.js App Router structure - repository root)

```text
src/
├── lib/
│   ├── auth/
│   │   ├── password.ts           # Hash, validate, reset password logic
│   │   ├── token.ts              # JWT creation, validation, refresh logic
│   │   ├── rate-limiter.ts       # Progressive delay implementation (FR-017)
│   │   └── email.ts              # Email service for password reset & confirmation
│   └── utils/
│       ├── validators.ts         # Email (RFC 5322) & password validation
│       └── errors.ts             # Auth-specific error types
├── server/
│   ├── db/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   └── [migrations/]         # Managed by Prisma CLI
│   ├── auth/
│   │   ├── route.ts              # NextAuth.js [...nextauth] route handler
│   │   └── callbacks.ts          # NextAuth session/JWT/signin callbacks
│   └── api/
│       └── auth/
│           ├── register/route.ts  # POST /api/auth/register
│           ├── login/route.ts     # POST /api/auth/login
│           ├── logout/route.ts    # POST /api/auth/logout
│           ├── refresh/route.ts   # POST /api/auth/refresh
│           └── reset/route.ts     # POST /api/auth/reset
├── app/
│   ├── auth/
│   │   ├── login/page.tsx        # Login page
│   │   ├── register/page.tsx     # Registration page
│   │   ├── forgot-password/page.tsx # Password reset request
│   │   └── reset-password/page.tsx  # Password reset form
│   ├── dashboard/page.tsx        # Protected dashboard (requires session)
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
└── prisma/
    ├── schema.prisma             # Database schema (User, PasswordResetToken, AuthLog)
    └── seed.ts                   # Database seeding for development

tests/
├── unit/
│   ├── lib/auth/password.test.ts         # Password hashing, validation
│   ├── lib/auth/token.test.ts            # JWT creation/validation/refresh
│   ├── lib/auth/rate-limiter.test.ts     # Progressive delays (FR-017)
│   ├── lib/utils/validators.test.ts      # Email/password validation
│   └── server/auth/callbacks.test.ts     # NextAuth lifecycle
├── integration/
│   ├── api/auth/register.test.ts         # Registration flow (FR-001 to FR-016)
│   ├── api/auth/login.test.ts            # Login + delay logic (FR-005, FR-017)
│   ├── api/auth/logout.test.ts           # Logout invalidates token (FR-009)
│   ├── api/auth/refresh.test.ts          # Token refresh <5min (FR-019)
│   └── api/auth/password-reset.test.ts   # Reset flow + email delivery (FR-011 to FR-020)
└── e2e/
    ├── auth.spec.ts              # Registration → login → dashboard journey
    └── password-reset.spec.ts     # Password reset workflow
```

**Structure Decision**: Next.js App Router monorepo with modular auth services (`lib/auth/`) decoupled from API routes. Prisma ORM handles database layer. NextAuth.js controls session/JWT lifecycle. This aligns with Constitution Principle II (clean, modular code) and Principle V (NextAuth + Prisma mandates). Testing pyramid distributed across unit (password, token logic), integration (API flows), and e2e (user journeys).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
