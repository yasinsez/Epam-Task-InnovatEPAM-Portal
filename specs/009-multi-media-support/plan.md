# Implementation Plan: Multi-Media Support (Multiple File Types)

**Branch**: `009-multi-media-support` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-multi-media-support/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Enable submitters to attach multiple files (documents, images, spreadsheets) to idea submissions. The system enforces admin-configurable limits (file count, per-file size, total size) and validates both extension and MIME type. Existing single-file ideas remain viewable (backward compatible). Admin UI allows configuration of upload limits and allowed types. Storage remains local filesystem (`uploads/ideas/<ideaId>/`); each file stored as `<uuid>.<ext>`.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode  
**Primary Dependencies**: Next.js 14+, Prisma, NextAuth v4, Zod, React 18  
**Storage**: PostgreSQL 14+ (Prisma ORM); local filesystem for attachments (`./uploads`)  
**Testing**: Jest 29.x (unit/integration), React Testing Library, Playwright (e2e)  
**Target Platform**: Node.js 18+ (Vercel), web browsers  
**Project Type**: Web application (Next.js App Router, Server Components)  
**Performance Goals**: API response <2s, attachment download <3s (SC-003)  
**Constraints**: 80% line coverage, 75% branch coverage; JSDoc required; TDD  
**Scale/Scope**: Multi-file per idea (up to 10), mixed types; admin config stored in DB

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode | ✅ PASS | All code uses `strict: true` |
| II. Clean Code & Maintainability | ✅ PASS | Small functions, descriptive names |
| III. Testing Principles | ✅ PASS | TDD, 70/20/10 pyramid; unit/integration/e2e structure; Jest + RTL + Playwright |
| IV. JSDoc Documentation | ✅ PASS | All new functions/components documented |
| V. Secure Auth & Data Persistence | ✅ PASS | NextAuth sessions; Prisma only; RBAC via callbacks |
| API validation (zod/yup) | ✅ PASS | Request payloads validated with Zod |
| Database migrations | ✅ PASS | Prisma migrate; no raw SQL |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
│   ├── admin/
│   │   ├── AdminTabs.tsx
│   │   ├── upload-config/        # NEW: upload config settings page
│   │   └── ...
│   ├── api/
│   │   └── ideas/
│   │       └── [id]/
│   │           ├── attachment/   # LEGACY: single-file route (backward compat)
│   │           └── attachments/ # NEW: GET/POST per-attachment routes
│   ├── ideas/
│   │   ├── [id]/page.tsx         # MODIFY: attachments list, thumbnails
│   │   └── ...
│   └── ...
├── components/
│   ├── IdeaAttachmentInput.tsx   # MODIFY: multi-file input
│   ├── IdeaAttachmentsList.tsx    # NEW: attachments display + thumbnails
│   └── ...
├── lib/
│   ├── constants/
│   │   └── attachment.ts         # MODIFY: add upload-config defaults; DB overrides
│   ├── services/
│   │   ├── attachment-service.ts # MODIFY: multi-file ops
│   │   ├── upload-config-service.ts  # NEW: get/update upload config
│   │   └── idea-service.ts       # MODIFY: attachments array
│   └── validators.ts             # MODIFY: multi-file validation (config-aware)
└── server/db/prisma.ts

prisma/
└── schema.prisma                 # MODIFY: Attachment 1:N, UploadConfiguration model

tests/
├── unit/
├── integration/
├── contract/
└── e2e/
```

**Structure Decision**: Single Next.js application (App Router). New modules: `upload-config-service`, `upload-config` admin page, `IdeaAttachmentsList`. Existing `attachment-service` and `IdeaAttachmentInput` extended for multiple files.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(None)* | — | — |

---

## Post-Phase 1 Constitution Re-check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript Strict Mode | ✅ PASS | All new code uses strict types |
| II. Clean Code | ✅ PASS | Small functions; config service, validators follow existing patterns |
| III. Testing | ✅ PASS | Unit/integration/e2e structure per quickstart |
| IV. JSDoc | ✅ PASS | Contracts define interfaces; implementation will document |
| V. Auth & Data | ✅ PASS | Admin routes enforce role; Prisma for UploadConfiguration |
