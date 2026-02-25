# Tasks: Evaluation Workflow

**Input**: Design documents from `specs/007-evaluation-workflow/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included per plan.md and Constitution Check (70/20/10 pyramid)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: Next.js at repo root; `src/`, `prisma/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Evaluation-specific constants and validation schema

- [X] T001 [P] Create evaluation constants in `src/lib/constants/evaluation.ts` (MAX_EVALUATION_COMMENTS_LENGTH = 2000)
- [X] T002 Extend `src/lib/validators.ts` with `evaluateIdeaSchema` (Zod: decision enum 'ACCEPTED'|'REJECTED', comments min 1 max 2000)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model and schema that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add IdeaStatus enum (SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED) and Evaluation model to `prisma/schema.prisma`; extend Idea with status IdeaStatus, evaluation Evaluation?; add evaluations Evaluation[] to User
- [X] T004 Run Prisma migration: `npx prisma migrate dev --name add_evaluation_workflow` (handle existing status string → enum conversion in migration if needed)
- [X] T005 [P] Extend `tests/unit/lib/validators.test.ts` with evaluateIdeaSchema tests (valid payload, empty comments, >2000 chars, invalid decision)

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 - Display Idea Status (Priority: P1) 🎯 MVP

**Goal**: All users who can view an idea see its current evaluation status (submitted, under review, accepted, rejected) in the idea list and idea detail view.

**Independent Test**: Submit an idea and verify its status appears as "Submitted" in the list and detail view.

### Implementation for User Story 1

- [X] T006 [P] [US1] Extend IdeaListItem and IdeaDetail types in `src/lib/services/idea-service.ts` with status (IdeaStatus); extend getIdeasForUser to select and return status
- [X] T007 [P] [US1] Extend getIdeaForDetail in `src/lib/services/idea-service.ts` to include evaluation relation with evaluator, return status and evaluation (decision, comments, evaluatedAt, evaluatorDisplayName)
- [X] T008 [US1] Add status prop to IdeaListItemProps and display status label in `src/components/IdeaListItem.tsx`
- [X] T009 [US1] Pass status from getIdeasForUser to IdeaListItem in `src/app/ideas/page.tsx`
- [X] T010 [US1] Display status badge/label in `src/app/ideas/[id]/page.tsx`

**Checkpoint**: Status visible in list and detail — User Story 1 complete

---

## Phase 4: User Story 2 - Admin Accepts or Rejects Idea with Comments (Priority: P1)

**Goal**: Admin/evaluator can accept or reject an idea with required comments; comments stored and visible; first-wins concurrency enforced.

**Independent Test**: Log in as admin, open a submitted idea, accept with comments, verify status updates and comments are persisted and visible.

### Implementation for User Story 2

- [X] T011 [P] [US2] Create `src/lib/services/evaluation-service.ts` with `evaluateIdea(ideaId, evaluatorId, decision, comments)` implementing first-wins (return null if already evaluated)
- [X] T012 [P] [US2] Unit test: evaluation service (success, first-wins 409 case) in `tests/unit/lib/services/evaluation-service.test.ts`
- [X] T013 [US2] Create `src/app/api/ideas/[id]/evaluate/route.ts` (POST handler: requireRole admin/evaluator, Zod validate body, call evaluateIdea, return 400/401/403/404/409/200)
- [X] T014 [US2] Integration test: evaluate route in `tests/integration/api/ideas/evaluate-route.test.ts` (success accept/reject, 400 invalid, 403 submitter, 409 already evaluated, 404 not found)
- [X] T015 [US2] Create `src/components/EvaluationForm.tsx` (client component): Accept/Reject buttons, comments textarea with 2000 char limit and counter, submit via fetch to /api/ideas/[id]/evaluate, handle 400/409/200
- [X] T016 [US2] Add EvaluationForm to `src/app/ideas/[id]/page.tsx` for admin/evaluator when status is SUBMITTED or UNDER_REVIEW
- [X] T017 [US2] Add evaluation display section to `src/app/ideas/[id]/page.tsx` for all users when evaluation exists (decision, comments, evaluatedAt, evaluatorDisplayName)

**Checkpoint**: Admin can evaluate with comments; evaluation visible — User Story 2 complete

---

## Phase 5: User Story 3 - Submitter Views Evaluation Feedback (Priority: P2)

**Goal**: Submitter can view evaluation outcome and comments on their own ideas in the idea detail view.

**Independent Test**: Admin rejects idea with comments; log in as submitter; verify they see "Rejected" and comments in idea detail.

### Implementation for User Story 3

- [X] T018 [US3] Verify getIdeaForDetail in `src/lib/services/idea-service.ts` allows submitter (owner) to access their own idea with evaluation data
- [X] T019 [US3] E2E test: submitter sees evaluation feedback in `tests/e2e/evaluation-workflow.spec.ts` (admin rejects → submitter views feedback)

**Checkpoint**: Submitter sees evaluation feedback — User Story 3 complete

---

## Phase 6: User Story 4 - Admin Transitions Idea to Under Review (Priority: P3)

**Goal**: When admin clicks "Start evaluation", status transitions to UNDER_REVIEW to indicate evaluation in progress (optional for MVP).

**Independent Test**: Admin opens submitted idea, clicks "Evaluate"/"Start evaluation", verify status becomes "Under Review".

### Implementation for User Story 4

- [X] T020 [P] [US4] Add startReviewIdea function to `src/lib/services/evaluation-service.ts` or idea-service to set status UNDER_REVIEW
- [X] T021 [US4] Create `PATCH /api/ideas/[id]/start-review` route or add "Start evaluation" action in `src/app/api/ideas/[id]/`
- [X] T022 [US4] Add "Start evaluation" / "Evaluate" button to `src/app/ideas/[id]/page.tsx` for admin/evaluator when status is SUBMITTED; on click transition to UNDER_REVIEW before showing evaluation controls

**Checkpoint**: Under review transition works — User Story 4 complete (optional)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: E2E coverage, validation, and documentation

- [X] T023 Add E2E tests for US1 and US2 in `tests/e2e/evaluation-workflow.spec.ts` (admin accepts with comments, admin rejects with comments, status visible in list and detail)
- [X] T024 [P] Add JSDoc to all new functions in `src/lib/services/evaluation-service.ts`, `src/app/api/ideas/[id]/evaluate/route.ts`
- [X] T025 Run quickstart.md validation steps: migration, unit, integration, e2e tests; manual accept/reject flow
- [X] T026 [P] Code cleanup: ensure no console.log in prod paths; use structured logger where needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational completion
  - US1, US2 can proceed after Foundational; US2 depends on US1 for extended IdeaDetail
  - US3 depends on US2 (evaluation display)
  - US4 is independent of US2/US3, can run in parallel
- **Polish (Phase 7)**: Depends on desired user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no dependency on other stories
- **User Story 2 (P1)**: After Foundational; uses extended Idea model from schema; UI builds on US1 detail page
- **User Story 3 (P2)**: After US2 — evaluation display already added; verify submitter access
- **User Story 4 (P3)**: After Foundational — optional; can defer to later phase

### Parallel Opportunities

- T001 and T002 can run in parallel (Setup)
- T006 and T007 can run in parallel (US1 service extensions)
- T011 and T012 can run in parallel (US2 service + unit test)
- T020 can run in parallel with other US4 tasks
- T024 and T026 (Polish) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Extend idea service (types + getIdeasForUser) and getIdeaForDetail together:
Task T006: "Extend IdeaListItem and IdeaDetail types in src/lib/services/idea-service.ts"
Task T007: "Extend getIdeaForDetail in src/lib/services/idea-service.ts"
```

## Parallel Example: User Story 2

```bash
# Create evaluation service and its unit test together:
Task T011: "Create src/lib/services/evaluation-service.ts"
Task T012: "Unit test in tests/unit/lib/services/evaluation-service.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (display status)
4. Complete Phase 4: User Story 2 (admin accept/reject)
5. **STOP and VALIDATE**: Test independently
6. Deploy/demo

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add US1 → status visible everywhere
3. Add US2 → full evaluation workflow
4. Add US3 → submitter feedback verified
5. Add US4 (optional) → under review transition
6. Polish → E2E, docs, quickstart validation

### Suggested MVP Scope

- **MVP**: Phase 1 + Phase 2 + Phase 3 + Phase 4 (User Stories 1 and 2)
- **Optional for MVP**: Phase 6 (US4 — under review) can be deferred

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to user story for traceability
- Each user story independently completable and testable
- First-wins concurrency: no locking; 409 when idea already evaluated
- Comments required: enforced at API (Zod) and client
- Evaluator display: "Administrator" when user deactivated/deleted
