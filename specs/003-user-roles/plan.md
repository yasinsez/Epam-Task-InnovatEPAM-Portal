# Implementation Plan: Basic Role Distinction (Submitter vs. Evaluator/Admin)

**Branch**: `003-user-roles` | **Date**: 2026-02-25 | **Spec**: /specs/003-user-roles/spec.md
**Input**: Feature specification from `/specs/003-user-roles/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add exclusive user roles (submitter, evaluator, admin) stored on `User`, defaulting to submitter. Enforce role-based access on pages and APIs using NextAuth session checks and database role lookups on every protected request (no role caching in tokens). Provide admin-only APIs/UI to view and update roles, plus role-based UI navigation and dashboards.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 18+  
**Primary Dependencies**: Next.js 14 (App Router), NextAuth v4, Prisma ORM, zod  
**Storage**: PostgreSQL 14+ via Prisma  
**Testing**: Jest + React Testing Library (unit/integration), Playwright (E2E)  
**Target Platform**: Vercel/Node.js server runtime (App Router)  
**Project Type**: Web application (full-stack Next.js)  
**Performance Goals**: API responses <2s for non-batch operations (5s batch max)  
**Constraints**: TypeScript strict + JSDoc required; NextAuth-only auth; Prisma-only DB access; roles fetched from DB on each protected request (no role caching in tokens)  
**Scale/Scope**: Single-tenant MVP with 3 exclusive roles; no dynamic role creation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- TypeScript strict mode with explicit typing (PASS)
- Clean code limits and simple, readable utilities (PASS)
- TDD + coverage thresholds + test organization (PASS)
- JSDoc on all functions/components/routes (PASS)
- NextAuth + Prisma only; RBAC enforced via callbacks and DB queries (PASS)

**Post-Design Check**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/003-user-roles/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   ├── auth/
│   └── components/
├── lib/
│   └── auth/
├── server/
│   ├── api/
│   ├── auth/
│   └── db/
└── types/

tests/
├── contract/
├── e2e/
├── integration/
└── unit/
```

**Structure Decision**: Single Next.js App Router project with shared server utilities in `src/server` and reusable auth helpers in `src/lib`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
