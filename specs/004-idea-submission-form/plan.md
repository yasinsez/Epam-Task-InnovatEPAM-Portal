# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement a form-based feature allowing authenticated users to submit innovation ideas with title, description, and category. The form must validate inputs (title 5-100 chars, description 20-2000 chars), sanitize special characters, provide clear error messages, include accessibility compliance (WCAG 2.1 AA), and handle submission errors with retry logic (3 retries, 1s cooldown). Success target: 95% first-attempt submissions within 2 minutes.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14+ (App Router)  
**Primary Dependencies**: React 18+, NextAuth v4+, Prisma ORM 5.x, React Hook Form (for form state management)  
**Storage**: PostgreSQL 14+ via Prisma ORM (existing connection via `DATABASE_URL`)  
**Testing**: Jest 29.x with React Testing Library 14.x (unit/integration), Playwright 1.40.x (E2E)  
**Target Platform**: Web application (browsers: modern Chrome, Firefox, Safari, Edge)  
**Project Type**: Web application (Next.js full-stack with Server Components and API routes)  
**Performance Goals**: Form completion <2 minutes average, 95% of valid submissions succeed on first attempt, category selector loads in <500ms  
**Constraints**: WCAG 2.1 Level AA accessibility compliance, API response <2s, 3 submission retries with 1s cooldown, 80% line coverage minimum  
**Scale/Scope**: Single form component integrated into InnovatEPAM Portal, available to all authenticated users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: TypeScript Strict Mode & Type Safety
**STATUS**: ✅ PASS  
**Gate Check**: Verify `tsconfig.json` has `strict: true`; all component props, API responses, and form state MUST be strictly typed; discriminated unions for error states  
**Justification**: Project already enforces strict: true; form will use strict types for title/description/category/error states

### Principle II: Clean Code & Maintainability
**STATUS**: ✅ PASS (Design Phase)  
**Gate Check**: Form component <80 lines; validation logic extracted to utility functions; error messages co-located in constants  
**Justification**: Form will be modular; validation extracted to `lib/validators.ts`; error messages in `lib/utils/errors.ts`

### Principle III: Testing Principles (NON-NEGOTIABLE)
**STATUS**: ✅ PASS (with Requirements)  
**Gate Check**:  
- 70% unit tests (validation logic, sanitization, error formatting) in `tests/unit/lib/validators.test.ts`  
- 20% integration tests (form submission, NextAuth session validation, Prisma create) in `tests/integration/api/ideas/`  
- 10% E2E tests (user journey: filter category → fill form → submit → confirm) in `tests/e2e/idea-submission.spec.ts`  
- Mutation score ≥75% on validation/error logic (via Stryker)  
- Coverage targets: 80% line, 75% branch  
**Justification**: Feature includes complex validation and error handling; these require comprehensive testing per pyramid; Stryker will validate mutation score on business logic

### Principle IV: JSDoc Documentation (NON-NEGOTIABLE)
**STATUS**: ✅ PASS (Enforced in Code Review)  
**Gate Check**: Every function, component, and Server Action MUST have JSDoc with `@param`, `@returns`, `@throws` tags  
**Justification**: Form component, validation utilities, and API route will include complete JSDoc; PR review will verify

### Principle V: Secure Authentication & Data Persistence
**STATUS**: ✅ PASS  
**Gate Check**: NextAuth session validation on API route; Prisma for Idea/Category model creation; no raw SQL  
**Justification**: API route will use NextAuth callbacks for auth; Prisma will define Idea/Category schema; form will sanitize inputs server-side

### Development Workflow Gates
**STATUS**: ✅ PASS  
**Database Migrations**: Schema additions (Idea, Category tables) MUST use `npx prisma migrate dev`  
**Testing Gates**: All tests MUST pass in CI; zero `.skip`/`.only`; ≥80% coverage  
**Code Review**: PR MUST follow conventional commits format; at least 1 approval before merge  

**Overall Assessment**: ✅ **GATES PASS** — No constitutional violations. Feature aligns with all 5 core principles and development workflow requirements.

## Project Structure

### Documentation (this feature)

```text
specs/004-idea-submission-form/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api-ideas.md     # API contract for idea submission
├── spec.md              # Feature specification
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   └── ideas/
│   │       └── route.ts                    # POST /api/ideas (form submission endpoint)
│   └── ideas/
│       └── submit/
│           └── page.tsx                    # Page wrapper for idea submission form
├── components/
│   └── SubmitIdeaForm.tsx                  # Main form component (title, description, category)
│   └── FormErrorBoundary.tsx               # Error boundary for form
└── lib/
    ├── validators.ts                       # Validation logic (title, description, category)
    ├── sanitizers.ts                       # Input sanitization (strip HTML/special chars)
    └── utils/
        └── errors.ts                       # Error messages and formatting

prisma/
├── schema.prisma                           # (Updated with Idea + Category models)
└── migrations/
    └── [timestamp]_add_idea_category_models/
        └── migration.sql

tests/
├── unit/
│   └── lib/
│       ├── validators.test.ts              # Unit tests for form validation logic
│       └── sanitizers.test.ts              # Unit tests for input sanitization
├── integration/
│   └── api/
│       └── ideas/
│           └── route.test.ts               # Integration tests for POST /api/ideas
└── e2e/
    └── idea-submission.spec.ts             # E2E test for complete user workflow
```

**Structure Decision**: Feature follows the existing Next.js App Router structure. Form component in `src/components/`, validation utilities in `src/lib/`, API route for form submission in `src/app/api/ideas/`, and Prisma models in `prisma/schema.prisma`. Tests mirror the source structure: unit tests for validation, integration for API endpoint, E2E for user workflow.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No complexity escalations needed. All gates passed before and after Phase 1 design. Design aligns with all 5 core principles.

---

## Phase 1 Completion Status

**✅ COMPLETE** — All Phase 1 deliverables generated:

1. ✅ **data-model.md** - Entity definitions (Idea, Category) with validation, relationships, and Prisma schema
2. ✅ **contracts/api-ideas.md** - API contract for POST /api/ideas with request/response schemas and error handling
3. ✅ **quickstart.md** - Developer implementation guide with step-by-step instructions
4. ✅ **Agent Context Updated** - Copilot agent context enriched with TypeScript/Next.js/Zod/Prisma patterns
5. ✅ **Constitution Check Re-evaluated** - All gates still pass; design enforces:
   - TypeScript strict mode (validation with Zod)
   - Clean code principles (modular form component, extracted validation)
   - Testing pyramid (unit tests for validators, integration tests for API, E2E tests for form workflow)
   - JSDoc documentation (all functions documented)
   - Secure auth + persistence (NextAuth + Prisma, sanitized inputs)

**Research Phase**: Skipped — No NEEDS CLARIFICATION items; technical context fully determined from codebase inspection (Zod confirmed in package.json, Prisma existing, NextAuth in use)

---

## Next Phase

**Phase 2 (Tasks)**: Use `/speckit.tasks` command to generate implementation tasks from this plan. Tasks will include:
- Database migration setup
- Validator/sanitizer implementation
- API route implementation
- Form component implementation
- Test suite implementation
- Integration into navigation
- E2E test coverage

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
