# Tasks: Multi-Stage Review

**Input**: Design documents from `/specs/011-multi-stage-review/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single Next.js project**: `src/`, `prisma/`, `tests/` at repository root
- API routes: `src/app/api/`
- Services: `src/lib/services/`
- Components: `src/components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify prerequisites and prepare for multi-stage review feature

- [x] T001 [P] Verify existing evaluation flow (spec 007) and Idea/Evaluation models in prisma/schema.prisma
- [x] T002 [P] Verify Zod is available in package.json; add if missing for API validation
- [x] T003 Ensure branch `011-multi-stage-review` exists and is checked out

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schema, validators, and shared logic that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add ReviewStage and StageTransition models to prisma/schema.prisma per data-model.md
- [x] T005 Add currentStageId, currentStage, stageTransitions to Idea model in prisma/schema.prisma
- [x] T006 Add stageTransitions relation to User model in prisma/schema.prisma
- [x] T007 Run migration: `npx prisma migrate dev --name multi_stage_review`
- [x] T008 [P] Add stageCreateSchema, stageUpdateSchema, advanceStageSchema to src/lib/validators.ts per quickstart.md
- [x] T009 Add MAX_REVIEW_STAGES constant (20) to src/lib/constants/ or evaluation constants

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Admin Configures Review Stages (Priority: P1) 🎯 MVP

**Goal**: Admins can create, edit, reorder, and remove review stages. Configuration persists and applies to all ideas.

**Independent Test**: Log in as admin, open stage config, add/edit/reorder stages, save, verify persistence.

- [x] T010 [P] [US1] Create stage-service.ts with getStages, createStage, updateStage, deleteStage, getFirstStage, getNextStage, isFinalStage in src/lib/services/stage-service.ts
- [x] T011 [US1] Implement getStages with ideaCount; enforce max 20 on create; block delete when ideas in stage per data-model.md
- [x] T012 [US1] Create GET and POST handlers in src/app/api/admin/review-stages/route.ts per contracts/api-review-stages.md
- [x] T013 [US1] Create PATCH and DELETE handlers in src/app/api/admin/review-stages/[stageId]/route.ts per contracts/api-review-stages.md
- [x] T014 [US1] Create StageConfigForm component for add/edit/reorder stages in src/components/StageConfigForm.tsx
- [x] T015 [US1] Add stage config page under admin area (e.g., src/app/admin/stages/page.tsx) with list and StageConfigForm
- [x] T016 [US1] Add admin nav link to stage configuration in src/app/admin/AdminTabs.tsx or Navigation

**Checkpoint**: Admin can configure stages; list persists; add/edit/reorder/delete work; delete blocked when ideas in stage

---

## Phase 4: User Story 2 - Ideas Advance Through Stages (Priority: P1)

**Goal**: Evaluators move ideas stage-by-stage. At final stage, accept/reject with comments. First-wins concurrency.

**Independent Test**: Submit idea, log in as evaluator, advance through stages, accept/reject at final stage.

- [x] T017 [US2] Implement advanceIdeaToNextStage in src/lib/services/evaluation-service.ts (first-wins, StageTransition creation)
- [x] T018 [US2] Extend idea creation (submit) to set currentStageId = first stage when stages exist in src/lib/services/idea-service.ts or draft-service
- [x] T019 [US2] Create POST handler in src/app/api/ideas/[id]/advance-stage/route.ts per contracts/api-advance-stage.md
- [x] T020 [US2] Extend evaluate endpoint in src/app/api/ideas/[id]/evaluate/route.ts to accept ideas in final stage (when stages configured)
- [x] T021 [US2] Extend EvaluationForm in src/components/EvaluationForm.tsx: show "Advance to Next Stage" when not final; Accept/Reject when final
- [x] T022 [US2] Add advance-stage button and optional comments input to evaluator idea detail flow
- [x] T023 [US2] Include currentStage in idea list/detail responses in src/lib/services/idea-service.ts

**Checkpoint**: Evaluator can advance ideas; final stage uses evaluate; first-wins returns 409; default flow works when no stages

---

## Phase 5: User Story 3 - Submitter Sees Stage Progress (Priority: P2)

**Goal**: Submitters see current stage and progress in idea detail. Transparency reduces support inquiries.

**Independent Test**: Submit idea, evaluator advances it, submitter sees stage and progress in idea detail.

- [x] T024 [P] [US3] Create StageProgressDisplay component showing "Stage X of Y: Name" and optional completed path in src/components/StageProgressDisplay.tsx
- [x] T025 [US3] Extend getIdeaById to include currentStage (name, position, totalStages) and stageHistory in src/lib/services/idea-service.ts
- [x] T026 [US3] Add StageProgressDisplay to idea detail page in src/app/ideas/[id]/page.tsx for submitter view
- [x] T027 [US3] Ensure idea list shows current stage in IdeaListItem when applicable in src/components/IdeaListItem.tsx

**Checkpoint**: Submitter sees current stage and completed path; accepted/rejected shows final decision

---

## Phase 6: User Story 4 - Default Workflow (No Stages) (Priority: P1)

**Goal**: When no custom stages exist, system falls back to spec 007 evaluation workflow. Backward compatibility.

**Independent Test**: No stages configured → submit idea → evaluate accept/reject works as today.

- [x] T028 [US4] Ensure new ideas get currentStageId = null when getStages() returns empty in idea creation flow
- [x] T029 [US4] Ensure evaluator sees standard Start review → Accept/Reject when no stages; no advance button in src/components/EvaluationForm.tsx
- [x] T030 [US4] Ensure evaluate endpoint handles ideas with currentStageId null (default flow) in src/app/api/ideas/[id]/evaluate/route.ts

**Checkpoint**: Zero stages = default workflow; single stage = accept/reject at that stage; no regression

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements, validation, and documentation

- [x] T031 [P] Add JSDoc to stage-service, advanceIdeaToNextStage, and new components per constitution
- [x] T032 Run quickstart.md validation: admin configures stages, evaluator advances, submitter sees progress, no-stages default flow
- [x] T033 Ensure RBAC: admin-only for stage config; evaluator/admin for advance; submitter sees own ideas only

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on Foundational; benefits from US1 (stages must exist to advance)
- **US3 (Phase 5)**: Depends on Foundational + US2 (stage data must exist and advance must work)
- **US4 (Phase 6)**: Depends on Foundational; integrates with US2
- **Polish (Phase 7)**: Depends on US1, US2, US3, US4 complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational - No dependencies on other stories
- **US2 (P1)**: Can start after Foundational - Requires US1 stages for full flow, but advance logic works once stages exist
- **US3 (P2)**: Requires US2 (advance creates stage data to display)
- **US4 (P1)**: Cross-cutting; implement alongside Foundational and US2

### Within Each User Story

- Models/schema before services
- Services before API routes
- API routes before UI components
- Core implementation before integration

### Parallel Opportunities

- T001, T002 can run in parallel (Phase 1)
- T008, T009 can run in parallel within Phase 2 (after T007)
- T010 (stage-service) can run in parallel with T012, T013 prep once T008 done
- T024 (StageProgressDisplay) can start after idea-service includes stage (T025 may need to precede for data shape)

---

## Parallel Example: User Story 1

```bash
# After T004–T009 complete, launch US1 model/service + API together:
Task T010: "Create stage-service.ts in src/lib/services/stage-service.ts"
Task T012: "Create GET/POST in src/app/api/admin/review-stages/route.ts"
Task T013: "Create PATCH/DELETE in src/app/api/admin/review-stages/[stageId]/route.ts"
# Then T014, T015, T016 for UI
```

---

## Parallel Example: User Story 2

```bash
# After stage-service exists, implement advance logic and API:
Task T017: "Implement advanceIdeaToNextStage in src/lib/services/evaluation-service.ts"
Task T019: "Create POST in src/app/api/ideas/[id]/advance-stage/route.ts"
# T021, T022 extend EvaluationForm (depends on T017, T019 for API contract)
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US4)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: US1 (Admin configures stages)
4. Complete Phase 4: US2 (Advance through stages)
5. Complete Phase 6: US4 (Default workflow)
6. **STOP and VALIDATE**: Test full flow with stages; test with no stages
7. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Admin can configure stages → Test independently
3. US2 + US4 → Evaluator advances; default flow works → Test
4. US3 → Submitter sees progress → Test independently
5. Polish → Final validation per quickstart.md

### Suggested MVP Scope

- **Minimum**: Phase 1 + 2 + 3 + 4 + 6 (Setup, Foundational, US1, US2, US4)
- **Full**: Add Phase 5 (US3) and Phase 7 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Reorder via PATCH displayOrder per api-review-stages contract Option A
