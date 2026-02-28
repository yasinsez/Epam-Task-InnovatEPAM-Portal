# Tasks: Ideas Scoring System

**Input**: Design documents from `/specs/013-ideas-scoring/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included per plan.md (unit for rating-service, integration for assign-rating API, E2E for assign/display).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `src/` at repository root
- **Prisma**: `prisma/schema.prisma`
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project context and branch; no new project initialization (existing Next.js monolith)

- [ ] T001 Verify on branch `013-ideas-scoring` and Node.js 18+ available

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: All user stories depend on Idea model having rating fields and RatingService existing.

- [ ] T002 Add `rating`, `ratingEvaluatorId`, `ratingAssignedAt` to Idea model and `ideasRated` relation to User in prisma/schema.prisma
- [ ] T003 Add `@@index([rating])` to Idea model in prisma/schema.prisma
- [ ] T004 Run `npx prisma migrate dev` to create migration for rating fields
- [ ] T005 [P] Add `ratingSchema` (z.number().int().min(1).max(5)) to src/lib/validators.ts
- [ ] T006 [P] Create RatingService with `assignRating(ideaId, evaluatorId, rating)` in src/lib/services/rating-service.ts (validate 1-5, block when ACCEPTED/REJECTED)

**Checkpoint**: Migration applied; validators and RatingService ready. User story implementation can begin.

---

## Phase 3: User Story 1 - Evaluator Assigns Rating (Priority: P1) 🎯 MVP

**Goal**: Evaluators and admins can assign or update a 1-5 rating on ideas in SUBMITTED or UNDER_REVIEW. Rating persists with evaluator and timestamp; immutable after accept/reject.

**Independent Test**: Log in as evaluator/admin, open a submitted/under-review idea, assign rating 1-5, save; verify persisted and displayed. Try 0 or 6 → blocked. Accept idea → try to change rating → blocked (409).

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T007 [P] [US1] Unit test for assignRating and validation in tests/unit/lib/services/rating-service.test.ts
- [ ] T008 [P] [US1] Integration test for POST /api/ideas/[id]/assign-rating in tests/integration/api/ideas-assign-rating.test.ts

### Implementation for User Story 1

- [ ] T009 [US1] Create POST handler for assign-rating in src/app/api/ideas/[id]/assign-rating/route.ts (auth, role check, status check, call RatingService)
- [ ] T010 [US1] Add rating input (1-5 stars or select) and "Save Rating" to EvaluationForm in src/components/EvaluationForm.tsx
- [ ] T011 [US1] Wire EvaluationForm rating input to POST /api/ideas/[id]/assign-rating and handle success/error responses

**Checkpoint**: Evaluators can assign/update ratings; validation and immutability enforced.

---

## Phase 4: User Story 2 - Rating Displayed in List and Detail (Priority: P1)

**Goal**: Users with access see rating ("4/5") or "Not yet rated" in idea list and idea detail view.

**Independent Test**: Have one idea with rating and one without; verify both display correctly in list and detail views.

### Implementation for User Story 2

- [ ] T012 [US2] Extend getIdeasForUser in src/lib/services/idea-service.ts to include rating, ratingDisplay in each idea
- [ ] T013 [US2] Extend getIdeaForDetail in src/lib/services/idea-service.ts to include rating, ratingDisplay, ratingAssignedAt
- [ ] T014 [P] [US2] Create RatingDisplay component ("4/5" or "Not yet rated") in src/components/RatingDisplay.tsx
- [ ] T015 [US2] Add RatingDisplay to idea list items in src/app/ideas/page.tsx
- [ ] T016 [US2] Add RatingDisplay to idea detail view in src/app/ideas/[id]/page.tsx

**Checkpoint**: Ratings visible in list and detail for users with access.

---

## Phase 5: User Story 3 - Submitter Views Rating on Own Ideas (Priority: P2)

**Goal**: Submitters see the rating on their own ideas when viewing detail or list.

**Independent Test**: Evaluator rates submitter's idea; submitter logs in and sees rating in detail and list.

### Implementation for User Story 3

- [ ] T017 [US3] Verify getIdeasForUser and getIdeaForDetail return rating for submitters viewing their own ideas (no filtering of rating by role)
- [ ] T018 [US3] Add E2E test for submitter viewing own idea with rating in tests/e2e/ideas-scoring.spec.ts

**Checkpoint**: Submitters can view ratings on their evaluated ideas.

---

## Phase 6: User Story 4 - Sort or Filter Ideas by Rating (Priority: P3)

**Goal**: Evaluators and admins can sort by rating (highest/lowest first) and filter by minRating (e.g., 4+).

**Independent Test**: Have ideas with different ratings; apply sort by rating desc → highest first; filter minRating=4 → only 4–5; clear → default order.

### Implementation for User Story 4

- [ ] T019 [US4] Add optional sortBy (ratingDesc, ratingAsc) and minRating to getIdeasForUser in src/lib/services/idea-service.ts
- [ ] T020 [US4] Pass sortBy and minRating from ideas list API route to getIdeasForUser in src/app/api/ideas/route.ts
- [ ] T021 [US4] Add sort and filter UI controls to ideas list page for evaluators/admins in src/app/ideas/page.tsx

**Checkpoint**: Evaluators/admins can sort and filter ideas by rating.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: E2E coverage and quickstart validation

- [ ] T022 Add E2E test for evaluator assign rating and display flow in tests/e2e/ideas-scoring.spec.ts (if not already complete from T018)
- [ ] T023 Run quickstart.md verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup → BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 2 (Phase 4)**: Depends on Foundational
- **User Story 3 (Phase 5)**: Depends on Foundational + US2 (rating in responses)
- **User Story 4 (Phase 6)**: Depends on Foundational + US2 (idea-service with rating)
- **Polish (Phase 7)**: Depends on US1–US4

### User Story Dependencies

- **US1 (P1)**: After Foundational only
- **US2 (P1)**: After Foundational only
- **US3 (P2)**: After US2 (needs rating in list/detail responses)
- **US4 (P3)**: After US2 (extends idea-service with sort/filter)

### Within Each User Story

- Tests written and FAIL before implementation
- Models/migration before services
- Services before endpoints
- US1: Route → EvaluationForm → wire-up

### Parallel Opportunities

- T005, T006 can run in parallel (validators vs rating-service)
- T007, T008 can run in parallel (unit vs integration tests)
- T012, T013 sequential (same file); T014 parallel (new component)
- US1 and US2 can start in parallel after Foundational (different files initially)

---

## Parallel Example: User Story 1

```bash
# Launch tests for User Story 1 together:
Task T007: "Unit test for assignRating in tests/unit/lib/services/rating-service.test.ts"
Task T008: "Integration test for assign-rating in tests/integration/api/ideas-assign-rating.test.ts"
```

---

## Parallel Example: Foundational

```bash
# After migration (T002–T004):
Task T005: "Add ratingSchema to src/lib/validators.ts"
Task T006: "Create RatingService in src/lib/services/rating-service.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (assign rating)
4. Complete Phase 4: User Story 2 (display rating)
5. **STOP and VALIDATE**: Test assign + display independently
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Assign rating works
3. Add US2 → Display works (MVP!)
4. Add US3 → Submitters see ratings
5. Add US4 → Sort/filter for evaluators

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (assign-rating API + EvaluationForm)
   - Developer B: US2 (idea-service + RatingDisplay + pages)
3. Developer C: US3 (verification) and US4 (sort/filter) after US2

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to user story for traceability
- Each user story independently completable and testable
- Commit after each task or logical group
- Run quickstart.md verification at end
