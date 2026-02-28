# Implementation Plan: Draft Management (Save Drafts)

**Branch**: `010-draft-management` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-draft-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Submitters can save partially completed idea submissions as drafts. Drafts persist form data (fixed fields, dynamic fields, attachments) without requiring validation. Submitters can resume editing, submit drafts to convert them into ideas, list their drafts, and discard drafts. Drafts are submitter-only visible and excluded from evaluation workflows. Maximum 10 drafts per user.

## Technical Context

**Language/Version**: TypeScript 5.x with `strict: true`  
**Primary Dependencies**: Next.js 14+ App Router, Prisma ORM, NextAuth v4  
**Storage**: PostgreSQL 14+ via Prisma  
**Testing**: Jest 29.x (unit/integration), React Testing Library, Playwright (E2E)  
**Target Platform**: Web (Node.js 18+, Vercel)  
**Project Type**: Web application (Next.js full-stack)  
**Performance Goals**: Draft list <2s; draft save/load <1s  
**Constraints**: RBAC via NextAuth; 10 drafts/user max; last-save-wins  
**Scale/Scope**: Enterprise innovation portal; existing Idea, FormConfiguration, Attachment, UploadConfiguration models

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
| **API Validation** | ✅ Pass | Zod validation for draft save/submit payloads |

**Gates**: All pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/010-draft-management/
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
│   │   ├── ideas/route.ts              # POST: extend for draft save; GET: filter drafts for submitters
│   │   ├── drafts/                     # NEW: draft CRUD endpoints
│   │   │   ├── route.ts                 # GET list, POST create
│   │   │   └── [id]/route.ts            # GET, PATCH, DELETE
│   │   └── ideas/[id]/route.ts
│   ├── ideas/
│   │   ├── submit/page.tsx              # Extend: load draft by id; Save draft button
│   │   └── drafts/page.tsx              # NEW: drafts list
│   └── dashboard/submitter/
├── components/
│   ├── SubmitIdeaForm.tsx               # Extend: Save draft, load draft mode
│   └── DraftListItem.tsx                # NEW: optional
├── lib/
│   ├── services/
│   │   ├── draft-service.ts             # NEW: getDrafts, saveDraft, submitDraft, discardDraft
│   │   ├── idea-service.ts              # Extend: exclude DRAFT from evaluator list; add draft count
│   │   └── attachment-service.ts        # Extend: drafts/ path for draft attachments
│   └── validators.ts                    # Extend: DraftSaveSchema (relaxed validation)
└── server/db/prisma/

prisma/
└── schema.prisma                        # Add DRAFT to IdeaStatus; or new Draft model (see research)

tests/
├── unit/
├── integration/
└── e2e/
```

**Structure Decision**: Single Next.js project. Draft management extends existing ideas infrastructure. New API routes under `/api/drafts`, new service `draft-service.ts`, and extended `SubmitIdeaForm` for Save draft / load draft flows.

## Complexity Tracking

No constitution violations. (Empty table not duplicated.)
