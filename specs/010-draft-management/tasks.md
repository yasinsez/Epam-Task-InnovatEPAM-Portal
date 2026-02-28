# Tasks: Draft Management (Save Drafts)

**Input**: Design documents from `/specs/010-draft-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included per quickstart.md and project constitution (TDD). Unit, integration, and E2E tests for draft flows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project structure**: `src/app/` (API routes, pages), `src/lib/services/` (business logic), `src/components/` (UI), `prisma/` (schema)
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/e2e/`, `tests/contract/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and draft-specific structure

- [x] T001 Create `src/app/api/drafts/` directory structure with `route.ts`, `[id]/route.ts`, and `[id]/submit/route.ts` placeholder files
- [x] T002 [P] Add `DraftSaveSchema` and `DraftCreateInput` type exports to `src/lib/validators.ts` (relaxed: title/description optional, categoryId optional; default title "Untitled draft", description "")

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add DRAFT to IdeaStatus enum and make categoryId optional on Idea model in `prisma/schema.prisma`; add `@@index([userId, status])`; run `npx prisma migrate dev --name draft_management`
- [x] T004 Update Idea model consumers to handle null category (e.g. `idea.category?.name ?? '—'`) in `src/lib/services/idea-service.ts` and any display components that read idea.category
- [x] T005 Implement draft-service with getDraftsForUser, createDraft, getDraftById, updateDraft, discardDraft, submitDraft in `src/lib/services/draft-service.ts`; enforce 10-draft limit on create; use existing attachment-service for files
- [x] T006 Update idea-service: exclude status DRAFT from evaluator/admin idea lists in `src/lib/services/idea-service.ts`; add draft count to getSubmissionStats
- [x] T007 [P] Add unit tests for DraftSaveSchema in `tests/unit/lib/validators.test.ts`
- [x] T008 [P] Add unit tests for draft-service (create, list, update, discard, submit, limit enforcement) in `tests/unit/lib/services/draft-service.test.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Submitter Saves Idea as Draft (Priority: P1) 🎯 MVP

**Goal**: Submitter can save a partially completed idea as a draft, leave, and return to restore all data (fixed fields, dynamic fields, attachments).

**Independent Test**: Log in as submitter, open idea submission form, enter partial data, click "Save draft", navigate away, return to form with `?draftId=xxx` or via drafts list; verify all values restored.

### Implementation for User Story 1

- [x] T009 [US1] Implement GET (list) and POST (create) handlers in `src/app/api/drafts/route.ts` per contracts/api-drafts.md; validate role=submitter; enforce 10-draft limit on POST
- [x] T010 [US1] Implement GET, PATCH, DELETE handlers in `src/app/api/drafts/[id]/route.ts`; owner-only access; PATCH uses DraftSaveSchema
- [x] T011 [US1] Add Save draft button and draftId prop to `components/SubmitIdeaForm.tsx`; on Save draft (new): POST /api/drafts; on Save draft (existing): PATCH /api/drafts/[id]
- [x] T012 [US1] Update `src/app/ideas/submit/page.tsx` to support `?draftId=xxx`; when draftId present, fetch GET /api/drafts/[id] and populate form state; show Save draft and Submit buttons
- [x] T013 [US1] Add integration tests for GET list and POST create in `tests/integration/api/drafts/route.test.ts` (submitter success, 403 non-submitter, 400 when limit reached)

**Checkpoint**: User Story 1 should be fully functional - submitters can save drafts and resume editing

---

## Phase 4: User Story 2 - Submitter Completes and Submits Draft (Priority: P2)

**Goal**: Submitter can open a saved draft, complete required fields, and submit; draft converts to submitted idea and is removed from drafts list.

**Independent Test**: Open saved draft, complete required fields, click Submit; verify idea appears in submitted list with status SUBMITTED and draft no longer in drafts list.

### Implementation for User Story 2

- [x] T014 [US2] Implement POST handler in `src/app/api/drafts/[id]/submit/route.ts`; full validation (SubmitIdeaSchema + createSubmissionSchema); on success: update idea status→SUBMITTED, submittedAt→now
- [x] T015 [US2] Update SubmitIdeaForm submit path: when draftId present and user clicks Submit, call POST /api/drafts/[id]/submit with merged form data; handle validation errors
- [x] T016 [US2] Add integration test for submit endpoint in `tests/integration/api/drafts/submit-route.test.ts` (success, validation failure, 404 not owner)

**Checkpoint**: User Stories 1 and 2 should both work - save draft, resume, submit

---

## Phase 5: User Story 3 - Submitter Manages Drafts (List, Discard) (Priority: P3)

**Goal**: Submitter can view a list of drafts, open any to edit, and discard drafts. Drafts list shows title (or "Untitled draft") and last updated date.

**Independent Test**: Create multiple drafts, view drafts list, open a draft, discard one, verify list updates; verify 11th save fails with limit message.

### Implementation for User Story 3

- [x] T017 [US3] Create drafts list page at `src/app/ideas/drafts/page.tsx`; fetch GET /api/drafts; render list with title (or "Untitled draft"), updatedAt, Open and Discard actions
- [x] T018 [US3] Implement Discard flow in drafts list: confirm dialog, then DELETE /api/drafts/[id]; refresh list on success
- [x] T019 [US3] Add DraftListItem component (optional) in `components/DraftListItem.tsx` for consistent list item UI with title, date, Open/Discard buttons
- [x] T020 [US3] Add integration test for GET by id and DELETE in `tests/integration/api/drafts/[id]/route.test.ts`
- [x] T021 [US3] Add E2E test for draft flows in `tests/e2e/draft-management.spec.ts`: save draft → navigate away → return → restore; complete → submit; discard; draft limit (11th save fails)

**Checkpoint**: All user stories functional - save, list, open, submit, discard

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Navigation, draft count display, and validation

- [x] T022 Add "My Drafts" nav link for submitters in `src/app/components/Navigation.tsx` (or equivalent) pointing to /ideas/drafts
- [x] T023 [P] Update submitter dashboard to show draft count and link to drafts in `src/app/dashboard/submitter/page.tsx`
- [x] T024 Add JSDoc documentation to draft-service functions in `src/lib/services/draft-service.ts`
- [ ] T025 Run quickstart.md validation: manual verification of save draft, load draft, submit draft, discard, draft limit
- [x] T026 [P] Add contract test for drafts API in `tests/contract/api-drafts.test.ts` per contracts/api-drafts.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup; BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Phase 2
  - US1 (Phase 3) first - MVP
  - US2 (Phase 4) depends on US1 (needs Save draft + load flow)
  - US3 (Phase 5) can start after US1 (list/discard use same APIs)
- **Polish (Phase 6)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - no dependencies on other stories
- **User Story 2 (P2)**: Builds on US1 (submit-from-draft uses draft load flow)
- **User Story 3 (P3)**: Can start after US1 (list/discard independent of submit flow)

### Within Each User Story

- API routes before UI
- Services used by routes (already in Phase 2)
- Integration tests after routes
- E2E after full flow exists

### Parallel Opportunities

- T002 and T001 can run in parallel
- T007, T008 can run in parallel (Phase 2)
- T022, T023, T026 can run in parallel (Phase 6)
- US2 and US3 can be worked in parallel once US1 is done (different files)

---

## Parallel Example: User Story 1

```bash
# After Phase 2 complete, US1 implementation:
Task T009: Implement GET/POST in src/app/api/drafts/route.ts
Task T010: Implement GET/PATCH/DELETE in src/app/api/drafts/[id]/route.ts
# Then T011, T012 (form + page) - T012 depends on T011 for load flow
```

---

## Parallel Example: User Stories 2 and 3

```bash
# With two developers after US1 complete:
Developer A (US2): T014 submit route → T015 form submit logic → T016 integration test
Developer B (US3): T017 drafts page → T018 discard flow → T019 DraftListItem → T020 integration test
# T021 E2E can run after both
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (schema, draft-service, idea-service, DraftSaveSchema)
3. Complete Phase 3: User Story 1 (save draft, load draft)
4. **STOP and VALIDATE**: Manual test - save draft, navigate away, return, restore
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test save/load → Deploy (MVP)
3. Add US2 → Test submit-from-draft → Deploy
4. Add US3 → Test list/discard → Deploy
5. Polish → Nav, draft count, docs, contract tests

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Once Foundational done:
   - Developer A: US1 (APIs + form)
   - After US1: Developer A does US2, Developer B does US3 in parallel
3. Polish together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Draft limit (10) enforced in createDraft and POST /api/drafts
- Last-save-wins: no optimistic locking on PATCH
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
