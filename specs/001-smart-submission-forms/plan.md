# Implementation Plan: Smart Submission Forms (Dynamic Fields)

**Branch**: `001-smart-submission-forms` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-smart-submission-forms/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Enable administrators to define configurable form fields (label, type, required, display order) for the idea submission form. Submitters see and fill these dynamic fields alongside fixed fields (title, description, category). Submitted values are persisted separately from configuration, displayed in list/detail views, and preserved historically when configuration changes.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Next.js 14+ App Router, Prisma ORM, Zod, NextAuth v4, React  
**Storage**: PostgreSQL 14+ via Prisma  
**Testing**: Jest 29.x, React Testing Library, Playwright 1.40+  
**Target Platform**: Web (desktop + mobile responsive)  
**Project Type**: web-service (Next.js full-stack)  
**Performance Goals**: <2s API response for non-batch; submission form usable on mobile  
**Constraints**: 80% line coverage, 75% branch coverage; Zod validation on all API payloads  
**Scale/Scope**: Max 25 dynamic fields per form; 50 options per select; 10k char limit for long text

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status |
|-----------|-------------|--------|
| I. TypeScript Strict | `strict: true`, no `any`, explicit types | ✅ Align |
| II. Clean Code | Functions <30 lines, early returns, single-purpose | ✅ Align |
| III. Testing | TDD, 70/20/10 pyramid, 80% line, 75% branch, Jest+RTL+Playwright | ✅ Align |
| IV. JSDoc | All functions/components documented | ✅ Align |
| V. Auth & DB | NextAuth-only, Prisma-only, RBAC via callbacks | ✅ Align |
| Stack | Next.js 14+, Prisma, Zod, Tailwind | ✅ Align |
| API validation | Zod for request payloads | ✅ Align |

**No violations.** Plan adheres to InnovatEPAM Portal Constitution.

## Project Structure

### Documentation (this feature)

```text
specs/001-smart-submission-forms/
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
│   │   ├── ideas/           # POST, GET - extend with dynamic fields
│   │   └── admin/form-config/  # CRUD for form configuration (new)
│   ├── admin/               # Admin layout, tabs - add Form Config tab
│   ├── ideas/
│   │   ├── submit/page.tsx  # Uses SubmitIdeaForm - add dynamic fields
│   │   └── [id]/page.tsx    # Detail - display dynamic values
│   └── dashboard/submitter/  # List view - show dynamic fields
├── components/
│   ├── SubmitIdeaForm.tsx   # Extend with dynamic field rendering
│   ├── IdeaListItem.tsx    # Extend for dynamic field display
│   └── DynamicFieldRenderer.tsx  # New - type-aware field input (new)
├── lib/
│   ├── services/
│   │   ├── idea-service.ts  # Extend getIdeasForUser, getIdeaForDetail
│   │   └── form-config-service.ts  # New - CRUD for form config
│   ├── validators.ts       # Extend with dynamic validation helpers
│   └── utils/
│       └── dynamic-schema.ts  # New - Zod schema from field defs
└── server/db/prisma.ts

prisma/
├── schema.prisma           # Add FormConfiguration, FormFieldDefinition, IdeaFieldValue (or JSONB)
└── migrations/

tests/
├── unit/
│   ├── lib/services/form-config-service.test.ts
│   └── lib/utils/dynamic-schema.test.ts
├── integration/
│   ├── api/admin/form-config/
│   └── api/ideas/  # Extend for dynamic fields
├── contract/
│   └── api-form-config.test.ts  # New
└── e2e/
    └── smart-submission-forms.spec.ts  # New
```

**Structure Decision**: Single Next.js project (Option 1). Form config and idea APIs live under `src/app/api/`. Dynamic field logic in `src/lib/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*None.*
