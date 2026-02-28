# Implementation Plan: Multi-Stage Review

**Branch**: `011-multi-stage-review` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-multi-stage-review/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Admins configure ordered review stages (e.g., "Initial Screening", "Technical Review", "Final Decision"). Ideas progress through stages; evaluators advance ideas stage-by-stage until the final stage, where they accept or reject with comments. Submitters see current stage and progress. When no custom stages exist, the system falls back to the existing spec 007 evaluation workflow (submitted → under review → accept/reject).

## Technical Context

**Language/Version**: TypeScript 5.x with `strict: true`  
**Primary Dependencies**: Next.js 14+ App Router, Prisma ORM, NextAuth v4  
**Storage**: PostgreSQL 14+ via Prisma  
**Testing**: Jest 29.x (unit/integration), React Testing Library, Playwright (E2E)  
**Target Platform**: Web (Node.js 18+, Vercel)  
**Project Type**: Web application (Next.js full-stack)  
**Performance Goals**: Stage config CRUD <5s; advance idea <30s; stage display <2s  
**Constraints**: RBAC via NextAuth; first-wins concurrency; max ~10–20 stages  
**Scale/Scope**: Enterprise innovation portal; existing Idea, Evaluation, User models

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. TypeScript Strict Mode** | ✅ Pass | All new code uses strict types; no implicit any |
| **II. Clean Code & Maintainability** | ✅ Pass | Small functions; descriptive names; early returns |
| **III. Testing Principles** | ✅ Pass | TDD; Jest+RTL (unit/integration); Playwright (E2E); 80% line, 75% branch coverage |
| **IV. JSDoc Documentation** | ✅ Pass | All functions/components documented with @param, @returns |
| **V. Secure Auth & Data** | ✅ Pass | NextAuth session validation; Prisma only; RBAC enforced |
| **Technology Stack** | ✅ Pass | Next.js 14+, Prisma, PostgreSQL, NextAuth, Tailwind |
| **API Validation** | ✅ Pass | Zod validation for stage config and advance payloads |

**Gates**: All pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/011-multi-stage-review/
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
│   │   ├── admin/
│   │   │   └── review-stages/             # NEW: stage config CRUD
│   │   │       ├── route.ts               # GET list, POST create
│   │   │       └── [stageId]/route.ts     # PATCH, DELETE
│   │   └── ideas/[id]/
│   │       ├── advance-stage/route.ts     # NEW: advance to next stage
│   │       └── evaluate/route.ts          # Extend: final-stage accept/reject
│   ├── ideas/
│   │   └── [id]/page.tsx                 # Extend: show stage progress
│   └── dashboard/
│       ├── admin/                         # NEW: stage config UI
│       └── evaluator/
├── components/
│   ├── StageProgressDisplay.tsx           # NEW: stage indicator for submitters
│   ├── EvaluationForm.tsx                 # Extend: advance vs accept/reject
│   └── StageConfigForm.tsx                # NEW: admin stage CRUD
├── lib/
│   ├── services/
│   │   ├── stage-service.ts               # NEW: stage CRUD, get stages
│   │   ├── evaluation-service.ts         # Extend: advanceIdea, integrate stages
│   │   └── idea-service.ts                # Extend: include stage in list/detail
│   └── validators.ts                      # Extend: stage schemas
└── server/db/prisma/

prisma/
└── schema.prisma                          # Add ReviewStage, StageTransition; extend Idea

tests/
├── unit/
├── integration/
└── e2e/
```

**Structure Decision**: Single Next.js project. Multi-stage review extends existing evaluation infrastructure. New models `ReviewStage`, `StageTransition`; new service `stage-service.ts`; new admin API `/api/admin/review-stages`; extend `evaluation-service` for advance logic. Idea model gets `currentStageId` (nullable when using default workflow).

## Complexity Tracking

No constitution violations. (Empty table not duplicated.)
