# Implementation Plan: Single File Attachment Per Idea

**Branch**: `005-single-file-per-idea` | **Date**: 2026-02-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-single-file-per-idea/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add optional single file attachment per idea to the InnovatEPAM Portal. Authenticated users can attach one file (PDF, DOCX, PNG, JPG, GIF; max 25 MB) when submitting an idea. Files are stored on the local filesystem; metadata (original name, stored path, size, type) is stored in PostgreSQL via Prisma. The existing idea submission form is extended with a file input control, validation, and replace-on-reselect behavior. Idea detail view exposes attachment download/view.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14+ (App Router)  
**Primary Dependencies**: React 18+, NextAuth v4+, Prisma ORM 5.x, React Hook Form (existing), FormData API for multipart uploads  
**Storage**: PostgreSQL 14+ via Prisma ORM (Attachment metadata) + local filesystem (uploaded files)  
**Testing**: Jest 29.x with React Testing Library 14.x (unit/integration), Playwright 1.40.x (E2E)  
**Target Platform**: Web application (browsers: modern Chrome, Firefox, Safari, Edge)  
**Project Type**: Web application (Next.js full-stack with Server Components and API routes)  
**Performance Goals**: File attachment completion within 3 minutes of form load; download within 3 seconds; 95% valid attachment success rate  
**Constraints**: 25 MB max file size; PDF/DOCX/PNG/JPG/GIF only; WCAG 2.1 AA; 80% line coverage; no virus scanning (trust internal users)  
**Scale/Scope**: Single file per idea; all authenticated users; local filesystem storage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: TypeScript Strict Mode & Type Safety
**STATUS**: ✅ PASS  
**Gate Check**: All file validation, Attachment model, API handlers MUST use strict types; FormData parsing validated with Zod  
**Justification**: Attachment fields, validation schemas, and API responses will be strictly typed; no implicit any

### Principle II: Clean Code & Maintainability
**STATUS**: ✅ PASS (Design Phase)  
**Gate Check**: File validation in dedicated utility; storage logic in service module; components <80 lines  
**Justification**: Extract file validation to `lib/validators.ts`; storage logic to `lib/services/attachment-service.ts`; form attachment UX as child component

### Principle III: Testing Principles (NON-NEGOTIABLE)
**STATUS**: ✅ PASS (with Requirements)  
**Gate Check**:
- 70% unit tests (file validation, size/type checks, sanitization) in `tests/unit/lib/`
- 20% integration tests (API upload, Prisma + filesystem, download route) in `tests/integration/api/`
- 10% E2E tests (attach → submit → view → download) in `tests/e2e/idea-attachment.spec.ts`
- Mutation score ≥75% on validation logic; coverage 80% line, 75% branch  
**Justification**: File validation and storage logic require comprehensive unit/integration tests; E2E covers critical user journey

### Principle IV: JSDoc Documentation (NON-NEGOTIABLE)
**STATUS**: ✅ PASS (Enforced in Code Review)  
**Gate Check**: Every function, component, Server Action, and API route MUST have JSDoc with `@param`, `@returns`, `@throws`  
**Justification**: Attachment service, validators, API routes will include complete JSDoc; PR review will verify

### Principle V: Secure Authentication & Data Persistence
**STATUS**: ✅ PASS  
**Gate Check**: NextAuth session on upload/download; Prisma for Attachment metadata; no raw SQL; files stored outside web root with path stored in DB  
**Justification**: API routes validate session; file paths use safe identifiers; download route enforces access control (idea visibility rules)

### Development Workflow Gates
**STATUS**: ✅ PASS  
**Database Migrations**: Attachment model MUST use `npx prisma migrate dev`  
**Testing Gates**: All tests MUST pass in CI; zero `.skip`/`.only`; ≥80% coverage  
**Code Review**: PR MUST follow conventional commits; at least 1 approval

**Overall Assessment**: ✅ **GATES PASS** — No constitutional violations. Feature aligns with all 5 core principles and development workflow.

## Project Structure

### Documentation (this feature)

```text
specs/005-single-file-per-idea/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api-ideas-upload.md   # POST /api/ideas (multipart) contract
│   └── api-attachments.md   # GET /api/ideas/[id]/attachment contract
├── spec.md              # Feature specification
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   └── ideas/
│   │       ├── route.ts                    # POST (extended for multipart file upload)
│   │       └── [id]/
│   │           └── attachment/
│   │               └── route.ts             # GET download attachment
│   └── ideas/
│       └── submit/
│           └── page.tsx                    # (unchanged, loads form)
├── components/
│   ├── SubmitIdeaForm.tsx                  # (extended with attachment control)
│   └── IdeaAttachmentInput.tsx              # File input + validation UX
├── lib/
│   ├── validators.ts                       # (extend with file validation)
│   ├── services/
│   │   └── attachment-service.ts            # Save/load files, path resolution
│   └── constants/
│       └── attachment.ts                    # Allowed types, max size, MIME map

prisma/
├── schema.prisma                           # (add Attachment model, Idea relation)
└── migrations/
    └── [timestamp]_add_attachment_model/
        └── migration.sql

uploads/                                    # Local filesystem storage (gitignored)
└── ideas/
    └── [ideaId]/
        └── [safeFilename]                  # Stored file

tests/
├── unit/
│   └── lib/
│       ├── validators.test.ts              # (extend with file validation tests)
│       └── services/
│           └── attachment-service.test.ts  # Storage logic
├── integration/
│   └── api/
│       └── ideas/
│           ├── route.test.ts               # (extend for multipart)
│           └── attachment-route.test.ts    # Download tests
└── e2e/
    └── idea-attachment.spec.ts             # Attach → submit → view → download
```

**Structure Decision**: Same web app structure as 004-idea-submission-form; additions are Attachment model, attachment service, extended API route for multipart, and download route. Upload directory is at repo root (`uploads/ideas/`) to keep files outside `src/` and easily gitignored.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | — | — |
