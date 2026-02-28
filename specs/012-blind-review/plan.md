# Implementation Plan: Blind Review (Anonymous Evaluation)

**Branch**: `012-blind-review` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-blind-review/spec.md`

## Summary

Blind review hides evaluator identity from submitters and non-admin users when displaying evaluation outcomes and comments. Evaluator reference remains persisted internally for audit and data integrity. The feature integrates with existing evaluation workflow (spec 007) and multi-stage review (spec 011) by applying display-layer masking where `evaluatorDisplayName` is shown. A configuration/feature flag controls enabling blind review; an optional admin-audit mode allows admins to see evaluator identity for auditing.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Next.js 14 App Router, NextAuth v4, Prisma ORM, React 18  
**Storage**: PostgreSQL 14+ via Prisma  
**Testing**: Jest 29.x (unit/integration), React Testing Library, Playwright (E2E)  
**Target Platform**: Web application (Node.js 18+, Vercel deployment)  
**Project Type**: Web application (Next.js monolith with Server Components)  
**Performance Goals**: API response <2s; idea detail load <2s per SC-002  
**Constraints**: No retroactive exposure of evaluator identity when blind review disabled  
**Scale/Scope**: Single deployment; system-wide blind review setting; per-campaign out of scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode | ✅ Pass | All services/types will use strict typing |
| II. Clean Code & Maintainability | ✅ Pass | Display logic extracted to utility/service |
| III. Testing Principles | ✅ Pass | Unit tests for masking logic; integration for API; E2E for idea detail display |
| IV. JSDoc Documentation | ✅ Pass | All new/changed functions documented |
| V. Secure Authentication & Data Persistence | ✅ Pass | NextAuth; Prisma only; evaluatorId persisted for audit, not exposed to submitters |

**No violations.** Complexity Tracking table intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/012-blind-review/
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
│   ├── api/ideas/[id]/route.ts    # May extend for blind-review-aware responses
│   ├── ideas/[id]/page.tsx       # Idea detail - change evaluator display
│   └── admin/                    # Admin settings for blind review config (if UI needed)
├── lib/
│   ├── services/
│   │   ├── idea-service.ts       # Mask evaluatorDisplayName by role/blindReview
│   │   └── evaluation-service.ts # Already returns evaluatorDisplayName; caller masks
│   └── config/                   # Blind review config resolver (env or DB)
prisma/
├── schema.prisma                 # Optional BlindReviewConfig model
tests/
├── unit/
│   └── lib/services/idea-service-blind-review.test.ts
├── integration/
│   └── api/ideas-blind-review.test.ts
└── e2e/
    └── ideas-blind-review.spec.ts
```

**Structure Decision**: Single Next.js project. Blind review implemented via service-layer masking in `idea-service.ts` and optional config in env or DB. Idea detail page uses masked `evaluatorDisplayName`; no structural changes.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations.*
