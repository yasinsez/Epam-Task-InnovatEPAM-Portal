# Implementation Plan: Ideas Scoring System

**Branch**: `013-ideas-scoring` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-ideas-scoring/spec.md`

## Summary

Add a 1–5 numeric scoring system to ideas. Evaluators and admins assign ratings during evaluation (alongside or before accept/reject). Ratings are persisted with evaluator reference and timestamp, displayed in list and detail views, and visible to submitters for their own ideas. Rating updates are blocked once an idea is accepted or rejected. Optional sort/filter by rating for evaluators and admins (P3).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Next.js 14 App Router, NextAuth v4, Prisma ORM, React 18  
**Storage**: PostgreSQL 14+ via Prisma  
**Testing**: Jest 29.x (unit/integration), React Testing Library, Playwright (E2E)  
**Target Platform**: Web application (Node.js 18+, Vercel deployment)  
**Project Type**: Web application (Next.js monolith with Server Components)  
**Performance Goals**: API response <2s; idea list/detail load <2s per SC-002  
**Constraints**: Rating immutable after accept/reject; 1–5 range validation; existing access rules apply  
**Scale/Scope**: Single deployment; one rating per idea in MVP

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode | ✅ Pass | All services/types will use strict typing |
| II. Clean Code & Maintainability | ✅ Pass | Rating logic extracted to service; small functions |
| III. Testing Principles | ✅ Pass | Unit tests for rating service/validation; integration for API; E2E for assign/display |
| IV. JSDoc Documentation | ✅ Pass | All new/changed functions documented |
| V. Secure Authentication & Data Persistence | ✅ Pass | NextAuth; Prisma only; ratingEvaluatorId persisted for audit |

**No violations.** Complexity Tracking table intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/013-ideas-scoring/
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
│   ├── api/ideas/[id]/assign-rating/route.ts   # POST assign rating (new)
│   └── ideas/[id]/page.tsx                     # Extend with rating display + assign UI
├── lib/
│   ├── services/
│   │   ├── idea-service.ts                     # Include rating in list/detail; sort/filter
│   │   └── rating-service.ts                   # assignRating, validate 1-5
│   └── validators.ts                           # ratingSchema (zod)
├── components/
│   ├── EvaluationForm.tsx                      # Add rating input alongside accept/reject
│   └── RatingDisplay.tsx                       # "4/5" or "Not yet rated" (new)
prisma/
├── schema.prisma                               # Add rating, ratingEvaluatorId, ratingAssignedAt to Idea
tests/
├── unit/
│   └── lib/services/rating-service.test.ts
├── integration/
│   └── api/ideas-assign-rating.test.ts
└── e2e/
    └── ideas-scoring.spec.ts
```

**Structure Decision**: Single Next.js project. Rating stored on Idea model with evaluator and timestamp. New `rating-service` for assign logic; `idea-service` extended for list/detail responses and optional sort/filter.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations.*
