# Implementation Plan: Idea Listing and Viewing

**Branch**: `006-idea-listing-viewing` | **Date**: 2026-02-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-idea-listing-viewing/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement authenticated idea listing and detail viewing with role-based visibility (submitters see own ideas; evaluators/admins see all). Features include: idea list with title, category, date, attachment indicator; paginated list (15 per page); category filter (P3); full idea detail with submitter display name for evaluators/admins; skeleton loading states; empty states; and back navigation to list.

## Technical Context

**Language/Version**: TypeScript 5.x with `strict: true`  
**Primary Dependencies**: Next.js 14+ (App Router), Prisma 6.x, NextAuth 4.x, Zod, React 18, Tailwind CSS  
**Storage**: PostgreSQL 14+ via Prisma ORM; Idea, Category, Attachment, User models exist  
**Testing**: Jest 29.x, React Testing Library, Playwright (per constitution)  
**Target Platform**: Web (Next.js App Router, Node.js 18+)  
**Project Type**: Web application (Next.js full-stack)  
**Performance Goals**: List load <3s; detail open <2s; attachment download <5s (per spec SC-001, SC-002, SC-005)  
**Constraints**: API response <2s non-batch; role-based access; NextAuth session required  
**Scale/Scope**: MVP—~50–500 ideas; 4 categories; 3 roles (submitter, evaluator, admin)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Post Phase 1**: Constitution Check still PASS. No violations introduced by design artifacts.

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. TypeScript Strict Mode** | ✅ PASS | All code uses strict types; no implicit any |
| **II. Clean Code & Maintainability** | ✅ PASS | Small functions; descriptive names; early returns |
| **III. Testing Principles** | ✅ PASS | TDD; 70/20/10 pyramid; Jest + RTL + Playwright; AAA pattern |
| **IV. JSDoc Documentation** | ✅ PASS | All functions/components documented with @param, @returns |
| **V. Secure Auth & Data** | ✅ PASS | NextAuth on all routes; Prisma for DB; RBAC via roles |

**Verdict**: No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/006-idea-listing-viewing/
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
│   ├── ideas/
│   │   ├── [id]/
│   │   │   └── page.tsx           # Idea detail (exists; enhance)
│   │   ├── page.tsx               # Idea list page (NEW)
│   │   └── submit/
│   │       └── page.tsx
│   ├── api/
│   │   └── ideas/
│   │       ├── route.ts           # POST exists; add GET for list
│   │       └── [id]/
│   │           └── attachment/
│   │               └── route.ts    # GET download (exists)
│   └── components/                # Skeleton, IdeaListItem, etc.
├── lib/
│   ├── services/
│   │   ├── idea-service.ts        # Extend with list/detail queries
│   │   └── attachment-service.ts
│   └── auth/
│       └── roles.ts
server/
└── db/
    └── prisma.ts

tests/
├── unit/
├── integration/
└── e2e/
```

**Structure Decision**: Single Next.js App Router project. Ideas list at `/ideas`; detail at `/ideas/[id]`; API at `GET /api/ideas` (list) and existing routes. No new packages; extend idea-service and add list/detail components.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. Table omitted.
