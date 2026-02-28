# Tasks: Blind Review (Anonymous Evaluation)

**Input**: Design documents from `/specs/012-blind-review/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included per plan.md (unit for masking logic, integration for API, E2E for idea detail display).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single Next.js project**: `src/`, `prisma/`, `tests/` at repository root
- Idea service: `src/lib/services/idea-service.ts`
- Evaluation service: `src/lib/services/evaluation-service.ts`
- Config: `src/lib/config/blind-review.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and blind review configuration infrastructure

- [x] T001 [P] Create blind review config module `src/lib/config/blind-review.ts` with `getBlindReviewConfig()` resolving `BLIND_REVIEW_ENABLED` and `BLIND_REVIEW_ADMIN_AUDIT_ENABLED` from env (default false); export `BlindReviewConfig` type `{ enabled: boolean; adminAuditEnabled: boolean }`
- [x] T002 [P] Add JSDoc to `getBlindReviewConfig` in `src/lib/config/blind-review.ts` (@param, @returns)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema and evaluation-creation changes that MUST complete before display logic

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add `evaluatedUnderBlindReview Boolean? @default(null)` to Evaluation model in `prisma/schema.prisma`
- [x] T004 Run `npx prisma migrate dev` to create migration for evaluatedUnderBlindReview field
- [x] T005 Update `evaluateIdea` in `src/lib/services/evaluation-service.ts` to read current blind review config via `getBlindReviewConfig()` and set `evaluatedUnderBlindReview` when creating Evaluation (true if enabled, false otherwise)
- [x] T006 Extend IdeaDetail evaluation type in `src/lib/services/idea-service.ts` to include `evaluatedUnderBlindReview?: boolean | null` in the evaluation object
- [x] T007 Extend `getIdeaForDetail` Prisma query in `src/lib/services/idea-service.ts` to select `evaluatedUnderBlindReview` from evaluation relation

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 & 2 - Evaluator Identity Hidden / Comments Visible (Priority: P1) 🎯 MVP

**Goal**: Submitters and non-admin users see evaluation outcome and comments without evaluator identity; comments remain fully visible.

**Independent Test**: Log in as evaluator, accept/reject an idea with comments; view as submitter → see "Reviewed" (not evaluator name), comments visible.

### Implementation for User Story 1 & 2

- [x] T008 [US1] Create `shouldMaskEvaluator(evaluation, viewerRole, config)` utility in `src/lib/utils/blind-review.ts`: returns true if evaluatorDisplayName must be masked (evaluatedUnderBlindReview===true → always mask; else if config.enabled and (viewer not admin or !config.adminAuditEnabled) → mask; else false)
- [x] T009 [US1] Update `getIdeaForDetail` in `src/lib/services/idea-service.ts` to call `getBlindReviewConfig()`, pass evaluation (with evaluatedUnderBlindReview), viewer role, and config to `shouldMaskEvaluator`; when masking, set `evaluatorDisplayName` to "Reviewed" instead of real name/email
- [x] T010 [US1] Verify idea detail page `src/app/ideas/[id]/page.tsx` uses `idea.evaluation.evaluatorDisplayName` for "Evaluated by" display (already does; no change needed unless refactor)
- [x] T011 [P] [US1] Unit test: masking logic in `tests/unit/lib/services/idea-service-blind-review.test.ts` (shouldMaskEvaluator: evaluatedUnderBlindReview true→mask; config enabled + submitter→mask; config enabled + admin + audit→no mask; config off→no mask for legacy)

**Checkpoint**: US1 & US2 complete - submitters see anonymous evaluations with full comments

---

## Phase 4: User Story 3 - Admin-Audit Visibility (Priority: P2)

**Goal**: When `BLIND_REVIEW_ADMIN_AUDIT_ENABLED` is true, admins see evaluator identity; submitters never do.

**Independent Test**: Enable admin-audit, have evaluator evaluate idea; admin views → sees evaluator name; submitter views → sees "Reviewed".

### Implementation for User Story 3

- [x] T012 [US3] Verify `shouldMaskEvaluator` in masking logic treats admin + `config.adminAuditEnabled` as "do not mask" (already covered by T008 if implemented correctly)
- [x] T013 [US3] Add unit test case in `tests/unit/lib/services/idea-service-blind-review.test.ts` for admin with adminAuditEnabled ON → evaluator name shown; admin with adminAuditEnabled OFF → "Reviewed"

**Checkpoint**: US3 complete - admins can optionally see evaluator for auditing

---

## Phase 5: User Story 4 - Integration with Evaluation Workflow (Priority: P1)

**Goal**: Blind review works with single-stage (spec 007) and multi-stage (spec 011) evaluation; evaluators perform accept/reject as before; no retroactive exposure.

**Independent Test**: Enable blind review, complete full evaluation flow (accept/reject or advance stages); evaluations save; identity hidden; turning blind review OFF does not expose past evaluations (evaluatedUnderBlindReview=true).

### Implementation for User Story 4

- [x] T014 [US4] Verify `evaluateIdea` sets `evaluatedUnderBlindReview` correctly (T005) and extend unit test in `tests/unit/lib/services/evaluation-service.test.ts` to assert evaluatedUnderBlindReview is set when blind review enabled
- [x] T015 [US4] Integration test: `tests/integration/api/ideas-blind-review.test.ts` — call GET idea detail as submitter with blind review ON → evaluatorDisplayName is "Reviewed"; as admin with audit ON → real name
- [x] T016 [US4] E2E test: `tests/e2e/ideas-blind-review.spec.ts` — evaluate idea, view as submitter, assert "Evaluated by Reviewed" and comments visible; no evaluator name in DOM
- [x] T017 [US4] Document in `src/lib/utils/blind-review.ts` or idea-service: when stage transition comments with evaluator are displayed in future UI, apply same masking (StageProgressDisplay currently shows stage names only; no code change needed for current scope)

**Checkpoint**: US4 complete - blind review fully integrated with evaluation workflow

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, cleanup

- [x] T018 [P] Add JSDoc to all new/changed functions in `src/lib/config/blind-review.ts`, `src/lib/services/idea-service.ts`, masking utility
- [x] T019 Run quickstart.md validation: verify blind review ON/OFF, admin-audit, FR-009 (no retroactive exposure)
- [x] T020 [P] Update `specs/012-blind-review/quickstart.md` with any implementation notes if config paths or env var names differ

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001 config needed by T005)
- **User Story 1 & 2 (Phase 3)**: Depends on Foundational (getIdeaForDetail needs evaluatedUnderBlindReview and config)
- **User Story 3 (Phase 4)**: Depends on Phase 3 (admin-audit is part of masking logic)
- **User Story 4 (Phase 5)**: Depends on Phase 3 (integration tests verify masking + evaluation-service)
- **Polish (Phase 6)**: Depends on all user story phases complete

### User Story Dependencies

- **User Story 1 & 2 (P1)**: Can start after Foundational - Core masking
- **User Story 3 (P2)**: Depends on US1 - Admin-audit is conditional branch in masking logic
- **User Story 4 (P1)**: Depends on Foundational + US1 - Integration verification

### Within Each Phase

- T001, T002: Can run in parallel (Setup)
- T003 → T004: Migration depends on schema change
- T005 depends on T001 (config)
- T006, T007: Schema/types before display logic
- T008 → T009: Masking utility before integration into getIdeaForDetail

### Parallel Opportunities

- T001, T002 in Phase 1
- T006, T007 can run after T003/T004
- T011 (unit test) can run after T009
- T018, T020 in Phase 6
- US3 and US4 phases have some overlap (US4 integration tests can run once US1 is done)

---

## Parallel Example: Phase 1

```bash
# Launch both setup tasks together:
Task: "Create blind review config module src/lib/config/blind-review.ts"
Task: "Add JSDoc to getBlindReviewConfig"
```

---

## Parallel Example: User Story 1

```bash
# After T009 complete, run unit test:
Task: "Unit test masking logic in tests/unit/lib/services/idea-service-blind-review.test.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (config module)
2. Complete Phase 2: Foundational (migration, evaluation-service flag, types)
3. Complete Phase 3: User Story 1 & 2 (masking in getIdeaForDetail)
4. **STOP and VALIDATE**: Test as submitter → "Reviewed", comments visible
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → evaluation-service sets flag, schema ready
2. Add US1 & US2 → Masking in idea-service → MVP (blind review for submitters)
3. Add US3 → Admin-audit visibility (if needed)
4. Add US4 → Integration tests + E2E validation
5. Polish → Docs, quickstart validation

### Parallel Team Strategy

- One developer: Sequential phases 1 → 2 → 3 → 4 → 5 → 6
- US3 and US4 can overlap: US4 integration tests validate US1; US3 is a small addition to masking logic

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 & US2 delivered together (same masking logic; comments already visible)
- evaluatedUnderBlindReview ensures FR-009: no retroactive exposure when blind review disabled
- Stage transition evaluator masking: future work when UI shows transition comments
- Verify tests fail before implementing (TDD where applicable)
- Commit after each task or logical group
