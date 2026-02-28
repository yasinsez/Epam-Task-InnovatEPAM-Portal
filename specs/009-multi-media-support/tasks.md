# Tasks: Multi-Media Support (Multiple File Types)

**Input**: Design documents from `/specs/009-multi-media-support/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Included per plan.md (TDD, Constitution Check). Write tests first, ensure they FAIL before implementation.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single Next.js app**: `src/`, `prisma/`, `tests/` at repository root
- Backend: `src/app/api/`, `src/lib/services/`
- Frontend: `src/components/`, `src/app/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure project structure and uploads directory for multi-file support

- [ ] T001 Create uploads directory structure and ensure `uploads/ideas/` exists per plan in project root
- [ ] T002 [P] Add UploadConfiguration defaults to `src/lib/constants/attachment.ts` (fallback when no DB config)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, upload config service, and admin API/UI. MUST complete before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Migration

- [ ] T003 Add UploadConfiguration model and User.uploadConfigurationsBy relation in `prisma/schema.prisma`
- [ ] T004 Modify Attachment model: remove `@unique` from ideaId, add `displayOrder Int @default(0)` in `prisma/schema.prisma`
- [ ] T005 Modify Idea model: change `attachment Attachment?` to `attachments Attachment[]` in `prisma/schema.prisma`
- [ ] T006 Run `npx prisma migrate dev --name multi_media_support` and add UploadConfiguration seed in `prisma/seed.mjs`

### Upload Config Service & API

- [ ] T007 Create `getUploadConfig` and `updateUploadConfig` in `src/lib/services/upload-config-service.ts`
- [ ] T008 Create GET handler in `src/app/api/admin/upload-config/route.ts` (admin role required)
- [ ] T009 Create PUT handler in `src/app/api/admin/upload-config/route.ts` with Zod validation per `contracts/api-upload-config.md`

### Admin UI

- [ ] T010 Create `/admin/upload-config` page with form in `src/app/admin/upload-config/page.tsx`
- [ ] T011 Add "Upload Settings" tab link to `src/app/admin/AdminTabs.tsx`

**Checkpoint**: Foundation ready — upload config API/UI functional; user story implementation can begin

---

## Phase 3: User Story 1 - Submitter Attaches Multiple Files (Priority: P1) 🎯 MVP

**Goal**: Submitter can attach multiple files (documents, images, spreadsheets) to idea submission. Add, remove, or replace files before submit. Validation enforces config-driven limits.

**Independent Test**: Submit idea with 2–3 files (doc + image + spreadsheet); verify all stored and associated; try disallowed type/size and verify rejection.

### Tests for User Story 1 (TDD — write first, ensure FAIL)

- [ ] T012 [P] [US1] Unit test for `validateAttachments` in `tests/unit/lib/validators.test.ts`
- [ ] T013 [P] [US1] Unit test for `upload-config-service` in `tests/unit/lib/services/upload-config-service.test.ts`
- [ ] T014 [US1] Integration test for POST /api/ideas with multiple attachments in `tests/integration/api/ideas/route.test.ts`
- [ ] T015 [P] [US1] Contract test for POST /api/ideas multi-attachment response shape in `tests/contract/api-ideas-multi-attachment.test.ts`

### Implementation for User Story 1

- [ ] T016 [US1] Add `validateAttachments(files, config)` to `src/lib/validators.ts` per `data-model.md` (count, per-file size, total size, extension, MIME)
- [ ] T017 [US1] Update `src/lib/services/attachment-service.ts` for multi-file save (saveAttachmentFile per file, return array of Attachment records)
- [ ] T018 [US1] Update POST `src/app/api/ideas/route.ts`: fetch config, normalize `attachment`/`attachments` to File[], validate, create Idea then each attachment per `contracts/api-ideas-multi-attachment.md`
- [ ] T019 [US1] Update `IdeaAttachmentInput` for multi-file: `value: File[]`, `onChange: (files: File[]) => void`, `config: UploadConfigDisplay` in `src/components/IdeaAttachmentInput.tsx`
- [ ] T020 [US1] Update `SubmitIdeaForm` to use `files: File[]` state and append each to FormData as `attachments`/`attachments[]` in `src/components/SubmitIdeaForm.tsx`
- [ ] T021 [US1] Update `getIdeaForDetail` and idea creation to use `attachments` array in `src/lib/services/idea-service.ts`

**Checkpoint**: User Story 1 complete — multi-file submission works, validated against config

---

## Phase 4: User Story 2 - Viewer Sees and Accesses All Attachments (Priority: P2)

**Goal**: Viewers see all attachments with filename, type, size. Download or open each. Image previews inline when feasible.

**Independent Test**: Submit idea with multiple files; view as submitter/evaluator/admin; verify list, download links, image previews; verify empty state when no attachments.

### Tests for User Story 2

- [ ] T022 [P] [US2] Integration test for GET /api/ideas/[id]/attachments/[attachmentId] in `tests/integration/api/ideas/attachments-route.test.ts`
- [ ] T023 [P] [US2] Contract test for attachment download response in `tests/contract/api-attachments-download.test.ts`

### Implementation for User Story 2

- [ ] T024 [US2] Create GET handler in `src/app/api/ideas/[id]/attachments/[attachmentId]/route.ts` per `contracts/api-attachments-download.md` (access control, Content-Disposition inline for images)
- [ ] T025 [US2] Update legacy `src/app/api/ideas/[id]/attachment/route.ts`: if exactly 1 attachment, serve; else 404 with message to use per-attachment URL
- [ ] T026 [P] [US2] Create `IdeaAttachmentsList` component with props per `contracts/component-interfaces.ts` in `src/components/IdeaAttachmentsList.tsx`
- [ ] T027 [US2] Update idea detail page to use `IdeaAttachmentsList` with `idea.attachments` in `src/app/ideas/[id]/page.tsx`
- [ ] T028 [US2] Update `deleteIdeaWithCleanup` to delete all attachment files for `idea.attachments` in `src/lib/services/idea-service.ts` and `src/lib/services/attachment-service.ts`

**Checkpoint**: User Story 2 complete — viewers can list, download, and preview attachments

---

## Phase 5: User Story 3 - Limits and Validation Clear to Users (Priority: P3)

**Goal**: Submitters see allowed types, per-file limit, total limit, max count before and during upload. Validation errors are specific (type, size, count).

**Independent Test**: Check form shows limits; upload invalid file and verify specific error message; reach count limit and verify prevention message.

### Implementation for User Story 3

- [ ] T029 [US3] Display allowed types, per-file limit, total limit, max file count in `IdeaAttachmentInput` label/help text from config in `src/components/IdeaAttachmentInput.tsx`
- [ ] T030 [US3] Ensure validation errors in API and validators return specific messages per `contracts/api-ideas-multi-attachment.md` (type, per-file size, total size, count)
- [ ] T031 [US3] Add client-side prevention when file count limit reached in `IdeaAttachmentInput` with clear message in `src/components/IdeaAttachmentInput.tsx`

**Checkpoint**: User Story 3 complete — limits visible, errors specific, count limit enforced

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: E2E coverage, backward compat, documentation

- [ ] T032 [P] E2E test: multi-file submit → view → download each in `tests/e2e/idea-multi-attachment.spec.ts`
- [ ] T033 [P] E2E test: admin change upload config → verify validation enforces in `tests/e2e/admin-upload-config.spec.ts`
- [ ] T034 Update `IdeaListItem` and list views to use `attachments.length` (or `hasAttachment`) in `src/components/IdeaListItem.tsx` and related
- [ ] T035 Run quickstart.md validation: manual submit with 2–3 files, view, download; admin change config; verify limits
- [ ] T036 [P] JSDoc for new functions/components per plan constitution in `src/lib/services/upload-config-service.ts`, `src/components/IdeaAttachmentsList.tsx`, `src/components/IdeaAttachmentInput.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 2 (Phase 4)**: Depends on Foundational; uses attachments from US1
- **User Story 3 (Phase 5)**: Depends on US1 (IdeaAttachmentInput); can overlap with US2
- **Polish (Phase 6)**: Depends on US1, US2, US3 complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no other story dependency
- **User Story 2 (P2)**: After Foundational — independently testable with US1 data
- **User Story 3 (P3)**: After US1 — enhances US1 components

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Models/migration before services
- Services before API routes
- API before UI components

### Parallel Opportunities

- Phase 1: T002 [P] can run with T001
- Phase 2: T003–T005 (schema); T007–T009 (service + API); T010–T011 (admin UI) — some parallel within phase
- Phase 3: T012, T013, T015 [P]; T019, T020 have sequential deps
- Phase 4: T022, T023 [P]; T026 [P]
- Phase 5: T029, T030, T031 can overlap
- Phase 6: T032, T033, T036 [P]

---

## Parallel Example: User Story 1

```bash
# Launch tests for User Story 1 (write first):
Task T012: "Unit test for validateAttachments in tests/unit/lib/validators.test.ts"
Task T013: "Unit test for upload-config-service in tests/unit/lib/services/upload-config-service.test.ts"
Task T015: "Contract test in tests/contract/api-ideas-multi-attachment.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Submit idea with 2+ files, verify storage and validation
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Config API/UI ready
2. Add US1 → Multi-file submit → MVP
3. Add US2 → View/download attachments
4. Add US3 → Clear limits and errors
5. Polish → E2E, docs

### Parallel Team Strategy

- Team completes Setup + Foundational together
- After Foundational: Developer A (US1), Developer B (US2), Developer C (US3)
- US3 can start after US1 components exist

---

## Summary

| Phase | Task Count | Description |
|-------|------------|-------------|
| Phase 1: Setup | 2 | Directory, constants |
| Phase 2: Foundational | 9 | DB, service, API, admin UI |
| Phase 3: US1 | 10 | Multi-file submit (tests + impl) |
| Phase 4: US2 | 7 | View, download, list |
| Phase 5: US3 | 3 | Clear limits and errors |
| Phase 6: Polish | 5 | E2E, backward compat, docs |
| **Total** | **36** | |

**Suggested MVP scope**: Phases 1–3 (User Story 1)
**Independent test criteria**: Per story checkpoints above
**Format validation**: All tasks use `- [ ] [T###] [P?] [US?] Description with file path`
