# Tasks: Smart Submission Forms (Dynamic Fields)

**Input**: Design documents from `/specs/001-smart-submission-forms/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project**: Next.js full-stack at repo root
- **Source**: `src/` (app/, components/, lib/)
- **Tests**: `tests/` (unit/, integration/, contract/, e2e/)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and schema scaffolding

- [ ] T001 Add FormConfiguration, FormFieldDefinition models and FormFieldType enum to prisma/schema.prisma
- [ ] T002 Add dynamicFieldValues Json? column to Idea model in prisma/schema.prisma
- [ ] T003 [P] Add Form Configuration tab link to src/app/admin/AdminTabs.tsx (href="/admin/form-config")
- [ ] T004 Create src/lib/utils/dynamic-schema.ts with createSubmissionSchema(fieldDefinitions) factory per research.md
- [ ] T005 Create src/lib/services/form-config-service.ts with getActiveConfig and saveConfig functions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database migration and shared utilities that MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Run Prisma migration: `npx prisma migrate dev --name add_smart_submission_forms`
- [ ] T007 Add seed for one FormConfiguration with zero FormFieldDefinitions in prisma/seed.mjs (minimal default)
- [ ] T008 Implement createSubmissionSchema in src/lib/utils/dynamic-schema.ts mapping fieldType → Zod primitives with required/optional and constraints
- [ ] T009 Implement form-config-service: getActiveConfig (returns config with fields ordered by displayOrder), saveConfig (replace-all, last-write-wins)
- [ ] T010 Add FormConfiguration.updatedById FK to User and FormConfigAudit or AuthLog entry on config save per data-model.md

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 - Admin Configures Submission Form Fields (Priority: P1) 🎯 MVP

**Goal**: Admins can add, edit, reorder, and remove form field definitions. Configuration applies to all new submissions.

**Independent Test**: Log in as admin → Admin → Form Configuration → add/edit/reorder/remove fields → save → verify config persisted.

### Implementation for User Story 1

- [ ] T011 [US1] Create GET /api/admin/form-config route in src/app/api/admin/form-config/route.ts (require admin role)
- [ ] T012 [US1] Create PUT /api/admin/form-config route with Zod validation for fields array per contracts/api-form-config.md
- [ ] T013 [US1] Add PUT body validation using field definition constraints (label 1–100, options for selects, min ≤ max for number)
- [ ] T014 [US1] Create admin Form Configuration page at src/app/admin/form-config/page.tsx
- [ ] T015 [US1] Implement FormConfigEditor client component: list fields, add/edit/remove/reorder via up-down buttons
- [ ] T016 [US1] Wire FormConfigEditor to PUT /api/admin/form-config on save; show success/error feedback
- [ ] T017 [US1] Log form config change to AuthLog (action: "FORM_CONFIG_UPDATED", metadata: formConfigId) on save

**Checkpoint**: User Story 1 complete — admins can configure form fields; submitters see minimal default until config added

---

## Phase 4: User Story 2 - Submitter Fills Dynamic Submission Form (Priority: P2)

**Goal**: Submitters see configured fields on the submission form and can submit ideas with dynamic field values validated per type and required status.

**Independent Test**: Log in as submitter → Submit Idea → fill fixed + dynamic fields → submit → verify idea created with correct dynamicFieldValues.

### Implementation for User Story 2

- [ ] T018 [P] [US2] Create DynamicFieldRenderer component in src/components/DynamicFieldRenderer.tsx (renders input by fieldType: text, longText, number, singleSelect, multiSelect, checkbox, date)
- [ ] T019 [US2] Extend SubmitIdeaForm in src/components/SubmitIdeaForm.tsx to fetch form config and render dynamic fields via DynamicFieldRenderer
- [ ] T020 [US2] Extend POST /api/ideas in src/app/api/ideas/route.ts to accept dynamicFieldValues in body
- [ ] T021 [US2] Validate dynamicFieldValues on POST using createSubmissionSchema from current form config in src/app/api/ideas/route.ts
- [ ] T022 [US2] Persist dynamicFieldValues to Idea.dynamicFieldValues in idea creation flow
- [ ] T023 [US2] Handle multipart/form-data: parse dynamicFieldValues JSON or keyed params when attachment present
- [ ] T024 [US2] Return 400 with field-level validation errors for dynamic fields per contracts/api-ideas-dynamic-fields.md

**Checkpoint**: User Story 2 complete — submitters can submit ideas with dynamic fields; validation enforced

---

## Phase 5: User Story 3 - View Submitted Ideas with Dynamic Field Values (Priority: P3)

**Goal**: Viewers see dynamic field values in list and detail views with configured labels; historical values preserved when config changes.

**Independent Test**: Submit idea with dynamic fields → view in list → view in detail → verify all values and labels display; change config → verify older idea still shows historical values.

### Implementation for User Story 3

- [ ] T025 [US3] Extend idea-service getIdeasForUser and getIdeaForDetail in src/lib/services/idea-service.ts to include dynamicFieldValues
- [ ] T026 [US3] Extend GET /api/ideas response to include dynamicFieldValues per idea in src/app/api/ideas/route.ts
- [ ] T027 [US3] Extend GET /api/ideas/[id] response to include dynamicFieldValues and dynamicFieldLabels in src/app/api/ideas/[id]/route.ts
- [ ] T028 [US3] Build dynamicFieldLabels map from current FormConfiguration for detail view; use "Unknown field" for historical keys
- [ ] T029 [US3] Extend IdeaListItem in src/components/IdeaListItem.tsx to display dynamic field values (truncate long values, e.g. 50 chars)
- [ ] T030 [US3] Extend idea detail page in src/app/ideas/[id]/page.tsx to show dynamic field values with labels (full values, no truncation)
- [ ] T031 [US3] Ensure historical ideas with removed/renamed fields still display values by key when config changed

**Checkpoint**: All user stories complete — full flow: admin configures → submitter submits → viewers see values

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tests, validation, and documentation

- [ ] T032 [P] Add contract test for GET/PUT /api/admin/form-config in tests/contract/api-form-config.test.ts
- [ ] T033 [P] Add integration tests for api/admin/form-config and api/ideas with dynamic payloads in tests/integration/
- [ ] T034 [P] Add unit tests for form-config-service in tests/unit/lib/services/form-config-service.test.ts
- [ ] T035 [P] Add unit tests for dynamic-schema in tests/unit/lib/utils/dynamic-schema.test.ts
- [ ] T036 Add E2E test smart-submission-forms.spec.ts: admin configures, submitter submits, viewer sees in tests/e2e/
- [ ] T037 Run quickstart.md validation and fix any issues
- [ ] T038 [P] Update docs if needed; ensure JSDoc on new functions/components

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — no dependency on US2/US3
- **User Story 2 (Phase 4)**: Depends on Foundational; needs form config (US1) for full flow but can develop against seeded config
- **User Story 3 (Phase 5)**: Depends on Foundational + US2 (ideas must have dynamicFieldValues to display)
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

| Story | Blocks | Can Start After |
|-------|--------|-----------------|
| US1 | US2 (submit form needs config), US3 (labels) | Foundational |
| US2 | US3 (detail needs submitted data) | Foundational |
| US3 | — | Foundational + US2 |

### Within Each User Story

- Models/schema before services
- Services before API routes
- API routes before UI components
- Core implementation before polish

### Parallel Opportunities

- T003, T004, T005 can run in parallel within Phase 1
- T018 (DynamicFieldRenderer) can start early in Phase 4
- T032, T033, T034, T035 can run in parallel in Phase 6
- US1 and US2 can be developed in parallel (different devs) after Foundational; US3 after US2

---

## Parallel Example: User Story 1

```bash
# After T010 complete:
Task T011: "Create GET /api/admin/form-config route"
Task T014: "Create admin Form Configuration page" (can stub API initially)
Task T015: "Implement FormConfigEditor client component"
```

## Parallel Example: User Story 2

```bash
# After T021:
Task T018: "Create DynamicFieldRenderer component"
Task T019: "Extend SubmitIdeaForm" (can run in parallel with T018)
Task T020: "Extend POST /api/ideas"
```

## Parallel Example: Phase 6

```bash
Task T032: "Contract test api-form-config"
Task T033: "Integration tests"
Task T034: "Unit test form-config-service"
Task T035: "Unit test dynamic-schema"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Admin can configure form; minimal default works
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Admin form config → Test → MVP baseline
3. US2 → Submitter dynamic form → Test → Full submission flow
4. US3 → List/detail display → Test → Complete feature
5. Polish → Tests, docs, quickstart validation

### Suggested MVP Scope

- **MVP**: Phases 1–3 (Setup + Foundational + US1)
- Delivers: Admins can define form fields; submitters see minimal default (title, description, category) until config added
- Next: US2 adds submitter experience; US3 adds display

---

## Summary

| Metric | Value |
|--------|-------|
| Total tasks | 38 |
| US1 tasks | 7 (T011–T017) |
| US2 tasks | 7 (T018–T024) |
| US3 tasks | 7 (T025–T031) |
| Setup/Foundational | 10 (T001–T010) |
| Polish | 7 (T032–T038) |

**Format validation**: All tasks use checklist format `- [ ] [TaskID] [P?] [Story?] Description with file path`.
