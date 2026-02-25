# Implementation Plan: Evaluation Workflow

**Branch**: `007-evaluation-workflow` | **Date**: 2026-02-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-evaluation-workflow/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add evaluation workflow with basic status tracking (submitted, under review, accepted, rejected) and simple admin accept/reject with comments. Extend existing Idea model and idea detail view with status display and inline evaluation controls. Introduce an Evaluation entity to persist decision, comments, and evaluator reference. Use first-wins concurrency (no locking) for concurrent admin evaluations.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode  
**Primary Dependencies**: Next.js 14+, NextAuth v4+, Prisma  
**Storage**: PostgreSQL 14+ via Prisma ORM  
**Testing**: Jest 29.x, React Testing Library 14.x, Playwright 1.40.x  
**Target Platform**: Node.js 18+ (Vercel)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: List/detail load &lt;2s; evaluation submit &lt;1 min  
**Constraints**: API &lt;2s non-batch; 2000 char max for comments  
**Scale/Scope**: Single Next.js app; existing ideas, users, roles; server actions or API routes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Post-Phase 1 re-check**: ✅ All gates still pass. Data model uses Prisma; API uses Zod; evaluation service follows single-responsibility; contracts document interfaces.

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode | ✅ PASS | Existing tsconfig strict: true; new code follows |
| II. Clean Code & Maintainability | ✅ PASS | Small functions; extract evaluation logic to services |
| III. Testing Principles | ✅ PASS | 70/20/10 pyramid; TDD; tests mirror src; AAA; Jest + RTL + Playwright |
| IV. JSDoc Documentation | ✅ PASS | All new functions, routes, components documented |
| V. Secure Auth & Data | ✅ PASS | NextAuth session validation; Prisma only; RBAC via requireRole |
| API Validation | ✅ PASS | Zod/runtime validation for evaluate payload |
| No console.log in prod | ✅ PASS | Use structured logger |

## Project Structure

### Documentation (this feature)

```text
specs/007-evaluation-workflow/
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
│   │   └── ideas/
│   │       └── [id]/
│   │           ├── attachment/route.ts  # existing
│   │           └── evaluate/route.ts   # NEW: POST accept/reject
│   ├── ideas/
│   │   ├── [id]/page.tsx               # extend: status + evaluation controls + feedback
│   │   └── page.tsx                    # extend: status column
│   └── ...
├── lib/
│   ├── services/
│   │   ├── idea-service.ts             # extend: status, evaluation
│   │   └── evaluation-service.ts       # NEW
│   ├── validators.ts                  # extend: evaluation comments
│   └── auth/role-guards.ts             # existing requireRole
prisma/
└── schema.prisma                       # IdeaStatus enum, Evaluation model

tests/
├── unit/lib/services/evaluation-service.test.ts
├── unit/lib/validators.test.ts
├── integration/api/ideas/evaluate-route.test.ts
└── e2e/evaluation-workflow.spec.ts
```

**Structure Decision**: Single Next.js App Router project; src/, prisma/, tests/ at repo root. Evaluation API at `POST /api/ideas/[id]/evaluate`; evaluation service in `src/lib/services/`; UI inline in idea detail page.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations; all gates pass.*
