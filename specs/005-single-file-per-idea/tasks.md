# Tasks: Single File Attachment Per Idea

**Input**: Design documents from `specs/005-single-file-per-idea/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included per Constitution Check (70% unit, 20% integration, 10% E2E)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: Next.js at repo root; `src/`, `prisma/`, `tests/` at repository root
- `uploads/` at repo root (gitignored)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and attachment-specific setup

- [x] T001 Add `uploads/` to `.gitignore`
- [x] T002 [P] Create attachment constants in `src/lib/constants/attachment.ts` (MAX_ATTACHMENT_SIZE_BYTES, ALLOWED_EXTENSIONS, MIME_BY_EXTENSION)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add Attachment model and Idea relation to `prisma/schema.prisma`
- [x] T004 Run Prisma migration: `npx prisma migrate dev --name add_attachment_model`
- [x] T005 [P] Extend `src/lib/validators.ts` with `validateAttachmentFile(file: File)` (size, type, non-empty; Zod or manual)
- [x] T006 [P] Create `src/lib/services/attachment-service.ts` with `saveAttachmentFile`, `readAttachmentFile`, `deleteAttachmentFile` (JSDoc required)
- [x] T007 [P] Unit test: file validation in `tests/unit/lib/validators.test.ts`
- [x] T008 [P] Unit test: attachment service in `tests/unit/lib/services/attachment-service.test.ts`

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 - Attach a File When Submitting an Idea (Priority: P1) 🎯 MVP

**Goal**: Users can optionally attach a single file when submitting an idea; file is stored and associated with the idea.

**Independent Test**: Navigate to `/ideas/submit`, select a valid file, submit, verify idea is stored with attachment accessible.

### Implementation for User Story 1

- [x] T009 [P] [US1] Create `src/components/IdeaAttachmentInput.tsx` (file input, accept attribute, display selected name, Remove button, replace-on-reselect)
- [x] T010 [US1] Update `src/components/SubmitIdeaForm.tsx`: add IdeaAttachmentInput, use FormData when file present, append file as `attachment`
- [x] T011 [US1] Extend `src/app/api/ideas/route.ts` for multipart: parse formData(), extract title/description/categoryId/attachment, create Idea then save file + Attachment, rollback Idea on failure
- [x] T012 [US1] Add JSDoc to POST /api/ideas handler (params, returns, throws)
- [x] T013 [US1] Integration test: multipart submission in `tests/integration/api/ideas/route.test.ts`

**Checkpoint**: User can attach a valid file and submit; idea stored with attachment

---

## Phase 4: User Story 2 - File Validation and Constraints (Priority: P1)

**Goal**: System validates files (size, type, empty); rejects invalid with clear messages; enforces one file per idea with replace behavior.

**Independent Test**: Attempt attach with oversized file, wrong type, empty file; verify rejection with clear messages; verify replace on second select.

### Implementation for User Story 2

- [x] T014 [US2] Add client-side validation in `src/components/IdeaAttachmentInput.tsx` (size, type before submit; display errors)
- [x] T015 [US2] Add server-side validation in `src/app/api/ideas/route.ts` using validateAttachmentFile; return 400 with specific error messages (too large, unsupported type, empty)
- [x] T016 [US2] Add form data preservation on submission failure in `src/components/SubmitIdeaForm.tsx`
- [x] T017 [P] [US2] Unit test: file validation edge cases (empty, oversized, wrong type) in `tests/unit/lib/validators.test.ts`
- [x] T018 [US2] Integration test: validation rejection cases in `tests/integration/api/ideas/route.test.ts`

**Checkpoint**: Invalid files rejected; valid files accepted; replace behavior works

---

## Phase 5: User Story 3 - Attachment Display and Access (Priority: P2)

**Goal**: Users with access can see attachment indication on idea view and download/view the file.

**Independent Test**: Submit idea with attachment, go to idea detail, verify attachment link and successful download.

### Implementation for User Story 3

- [x] T019 [US3] Create `src/app/api/ideas/[id]/attachment/route.ts` (GET: session check, load Idea with Attachment, access check, stream file with Content-Type and Content-Disposition)
- [x] T020 [US3] Add JSDoc to GET attachment route (params, returns, throws)
- [x] T021 [US3] Add attachment display and download link to idea detail view (locate existing idea detail component and add link to `GET /api/ideas/[id]/attachment`)
- [x] T022 [P] [US3] Integration test: attachment download in `tests/integration/api/ideas/attachment-route.test.ts`
- [x] T023 [US3] E2E test: attach → submit → view → download in `tests/e2e/idea-attachment.spec.ts`

**Checkpoint**: Attachment visible and downloadable from idea view

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, documentation, cleanup logic

- [x] T024 Add Idea delete cleanup: remove filesystem file when Idea (and cascade Attachment) is deleted
- [x] T025 [P] Run quickstart.md validation (manual verification steps)
- [x] T026 [P] Ensure 80% line coverage; zero `.skip`/`.only`; mutation score ≥75% on validation logic

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2; extends Phase 3 components
- **Phase 5 (US3)**: Depends on Phase 2
- **Phase 6 (Polish)**: Depends on Phases 3, 4, 5

### User Story Dependencies

- **US1 (P1)**: After Foundational — no other story dependency
- **US2 (P1)**: After Foundational; extends US1 form/API with validation
- **US3 (P2)**: After Foundational; can start in parallel with US1/US2 once Foundational done

### Within Phases

- Models/schema before services
- Services before API routes
- Components before form integration
- Tests written to fail before implementation (TDD where applicable)

### Parallel Opportunities

- T002, T005, T006, T007, T008 can run in parallel within Phase 2
- T009 can run in parallel with other Phase 3 prep
- T017 can run in parallel within Phase 4
- T022 can run in parallel within Phase 5
- T025, T026 can run in parallel in Phase 6

---

## Parallel Example: Phase 2 (Foundational)

```bash
# After T003, T004 (schema + migration), run in parallel:
Task: "Extend validators in src/lib/validators.ts"
Task: "Create attachment-service.ts"
Task: "Unit test validators"
Task: "Unit test attachment-service"
```

---

## Parallel Example: User Story 3

```bash
# After T019, T020 (download route), run in parallel:
Task: "Add attachment display to idea detail"
Task: "Integration test attachment-route"
Task: "E2E test idea-attachment.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (attach and submit)
4. Complete Phase 4: US2 (validation)
5. **STOP and VALIDATE**: Test attachment flow end-to-end
6. Deploy/demo

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 → Submit with validated attachment (MVP!)
3. US3 → View and download attachment
4. Polish → Cleanup, coverage

### Suggested MVP Scope

**User Stories 1 & 2** — submit ideas with validated single-file attachment. User Story 3 (display/download) can follow as second increment.

---

## Notes

- [P] = different files, no dependencies
- [Story] maps task to user story for traceability
- JSDoc required on all functions, components, routes (Constitution)
- Tests required per Constitution (70% unit, 20% integration, 10% E2E)
- Commit after each task or logical group
- Verify tests fail before implementing
- `uploads/` must stay in `.gitignore`
