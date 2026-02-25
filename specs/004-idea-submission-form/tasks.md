# Tasks: Idea Submission Form

**Input**: Design documents from `/specs/004-idea-submission-form/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api-ideas.md, quickstart.md

**Tests**: Included per plan.md requirements (70% unit, 20% integration, 10% E2E, 80% line coverage minimum)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic database structure

- [x] T001 Verify project structure matches plan.md (Next.js 14+ App Router, TypeScript 5.x, Prisma ORM)
- [x] T002 Create Prisma migration file for Category and Idea models in prisma/migrations/[timestamp]_add_idea_category_models/migration.sql
- [x] T003 Add Category model to prisma/schema.prisma with fields: id, name, slug, description, order, isActive, timestamps
- [x] T004 Add Idea model to prisma/schema.prisma with fields: id, title, description, sanitizedTitle, sanitizedDescription, categoryId, userId, status, submittedAt, timestamps
- [x] T005 Add indexes to prisma/schema.prisma for Idea model (userId, categoryId, submittedAt, userId+submittedAt)
- [x] T006 Add User model extension to prisma/schema.prisma (ideas relation)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Run database migration: npx prisma migrate dev --name add_idea_category_models
- [x] T008 Seed Category table with 4 predefined categories (Process Improvement, Technology, Cost Reduction, Culture & Engagement)
- [x] T009 [P] Create base validator utilities in src/lib/validators.ts with SubmitIdeaSchema (Zod schema for title, description, categoryId)
- [x] T010 [P] Create sanitization utilities in src/lib/sanitizers.ts with sanitizeText function (strip HTML/special chars)
- [x] T011 [P] Verify error utilities exist in src/lib/utils/errors.ts (ValidationError, NotFoundError classes)
- [x] T012 Generate Prisma client: npx prisma generate

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Submit an Idea (Priority: P1) 🎯 MVP

**Goal**: Enable authenticated users to submit an idea with title, description, and category. Upon success, show confirmation and clear the form.

**Independent Test**: Navigate to /ideas/submit, fill all fields with valid data, submit, verify success message displays and form clears.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T013 [P] [US1] Create unit test for SubmitIdeaSchema validation in tests/unit/lib/validators.test.ts (valid submission test)
- [x] T014 [P] [US1] Create unit test for sanitizeText function in tests/unit/lib/sanitizers.test.ts (HTML/special char stripping)
- [x] T015 [P] [US1] Create contract test for POST /api/ideas endpoint in tests/contract/api-ideas.test.ts (request/response schema validation)
- [x] T016 [P] [US1] Create integration test for POST /api/ideas in tests/integration/api/ideas/route.test.ts (successful submission with mocked Prisma and NextAuth)

### Implementation for User Story 1

- [x] T017 [US1] Implement POST /api/ideas route in src/app/api/ideas/route.ts (authentication check, validation, category verification, sanitization, Prisma create, 201 response)
- [x] T018 [US1] Create SubmitIdeaForm component in src/components/SubmitIdeaForm.tsx (controlled form with title, description, category fields, onChange handlers, onSubmit handler)
- [x] T019 [US1] Implement form submission logic in src/components/SubmitIdeaForm.tsx (fetch /api/ideas, handle success with message display and form reset)
- [x] T020 [US1] Create ideas submission page in src/app/ideas/submit/page.tsx (authentication check, fetch active categories from Prisma, render SubmitIdeaForm)
- [x] T021 [US1] Add page metadata to src/app/ideas/submit/page.tsx (title: "Submit an Idea", description for SEO)

### E2E Test for User Story 1

- [x] T022 [US1] Create E2E test in tests/e2e/idea-submission.spec.ts (complete user journey: login → navigate to form → fill fields → submit → verify success)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can submit ideas and see success confirmation

---

## Phase 4: User Story 2 - Form Validation (Priority: P1)

**Goal**: Validate all form fields before submission. Show clear error messages for invalid inputs and prevent submission until all fields are valid.

**Independent Test**: Attempt to submit form with empty fields, too-short title, too-long description, no category. Verify each shows specific error message and prevents submission.

### Tests for User Story 2

- [x] T023 [P] [US2] Add unit test for title length validation in tests/unit/lib/validators.test.ts (test min 5, max 100 characters)
- [x] T024 [P] [US2] Add unit test for description length validation in tests/unit/lib/validators.test.ts (test min 20, max 2000 characters)
- [x] T025 [P] [US2] Add unit test for categoryId validation in tests/unit/lib/validators.test.ts (test required, non-empty)
- [x] T026 [P] [US2] Add integration test for validation errors in tests/integration/api/ideas/route.test.ts (verify 400 response with details object)

### Implementation for User Story 2

- [x] T027 [US2] Add client-side validation error display in src/components/SubmitIdeaForm.tsx (errors state object, error message rendering below each field)
- [x] T028 [US2] Add error clearing on field change in src/components/SubmitIdeaForm.tsx (clear field error when user starts typing)
- [x] T029 [US2] Add validation error handling for API responses in src/components/SubmitIdeaForm.tsx (parse 400 response details, update errors state)
- [x] T030 [US2] Add Zod error handling in src/app/api/ideas/route.ts (catch ZodError, format error details by field path, return 400)
- [x] T031 [US2] Add category existence validation in src/app/api/ideas/route.ts (verify category exists and isActive=true before submission)

**Checkpoint**: At this point, validation is complete - form shows specific error messages for all invalid inputs

---

## Phase 5: User Story 3 - Category Selection (Priority: P1)

**Goal**: Display all available categories in a dropdown selector. Selected category is submitted with the idea.

**Independent Test**: Open form, click category dropdown, verify all 4 predefined categories appear. Select each category and verify selection is reflected.

### Tests for User Story 3

- [x] T032 [P] [US3] Add integration test for category fetching in tests/integration/api/ideas/route.test.ts (verify only active categories are used)
- [x] T033 [P] [US3] Add E2E test for category dropdown in tests/e2e/idea-submission.spec.ts (verify all categories appear, selection works)

### Implementation for User Story 3

- [x] T034 [US3] Add category dropdown rendering in src/components/SubmitIdeaForm.tsx (map categories prop to option elements with key, value, label)
- [x] T035 [US3] Add category change handler in src/components/SubmitIdeaForm.tsx (update formData.categoryId on select change)
- [x] T036 [US3] Verify category fetch in src/app/ideas/submit/page.tsx (ensure Prisma query filters isActive=true and orders by order field)
- [x] T037 [US3] Add category display in API response in src/app/api/ideas/route.ts (include category name in success response via Prisma include)

**Checkpoint**: Categories are displayed and selectable - selected category is submitted and returned in response

---

## Phase 6: User Story 4 - Submission Error Handling (Priority: P2)

**Goal**: When submission fails, preserve form data and show clear error message. Allow up to 3 retries with 1-second cooldown between attempts.

**Independent Test**: Mock server error (500), attempt submission, verify error message appears and form data is preserved. Verify retry logic triggers automatically.

### Tests for User Story 4

- [x] T038 [P] [US4] Add integration test for server error handling in tests/integration/api/ideas/route.test.ts (mock Prisma error, verify 500 response)
- [x] T039 [P] [US4] Add E2E test for retry logic in tests/e2e/idea-submission.spec.ts (mock 500 error, verify retry attempts and final error message)

### Implementation for User Story 4

- [x] T040 [US4] Add error state management in src/components/SubmitIdeaForm.tsx (submitError state for error messages)
- [x] T041 [US4] Add retry counter state in src/components/SubmitIdeaForm.tsx (retryCount state, initialize to 0)
- [x] T042 [US4] Implement retry logic in src/components/SubmitIdeaForm.tsx (detect 500 errors, increment retry count, wait 1s, retry up to 3 times)
- [x] T043 [US4] Add error message display in src/components/SubmitIdeaForm.tsx (render submitError in alert div with role="alert")
- [x] T044 [US4] Add max retry message in src/components/SubmitIdeaForm.tsx (after 3 failed retries, show "Please contact support" message)
- [x] T045 [US4] Add server error handling in src/app/api/ideas/route.ts (catch unexpected errors, log to console, return 500 with user-friendly message)

**Checkpoint**: Error handling is complete - users can retry after failures and see clear error messages

---

## Phase 7: User Story 5 - Accessibility Compliance (Priority: P1)

**Goal**: Ensure form complies with WCAG 2.1 Level AA. All fields are keyboard navigable, properly labeled, and compatible with screen readers.

**Independent Test**: Navigate form with keyboard only (Tab/Shift+Tab), verify focus indicators appear and flow is logical. Use screen reader (NVDA/JAWS) to verify labels and errors are announced.

### Tests for User Story 5

- [x] T046 [P] [US5] Create accessibility test in tests/e2e/idea-submission.spec.ts (keyboard navigation test: Tab through all fields in order)
- [x] T047 [P] [US5] Add focus indicator test in tests/e2e/idea-submission.spec.ts (verify visible focus outline with sufficient contrast)
- [x] T048 [P] [US5] Add ARIA attributes test in tests/e2e/idea-submission.spec.ts (verify aria-required, aria-describedby on fields with errors)

### Implementation for User Story 5

- [x] T049 [US5] Add semantic HTML labels in src/components/SubmitIdeaForm.tsx (label elements with htmlFor attribute linking to input id)
- [x] T050 [US5] Add ARIA required attributes in src/components/SubmitIdeaForm.tsx (aria-required="true" on all required fields)
- [x] T051 [US5] Add ARIA error associations in src/components/SubmitIdeaForm.tsx (aria-describedby pointing to error message id when error exists)
- [x] T052 [US5] Add role="alert" to success/error messages in src/components/SubmitIdeaForm.tsx (ensure screen reader announces messages)
- [x] T053 [US5] Add required field indicators in src/components/SubmitIdeaForm.tsx (asterisk spans with class="required" next to labels)
- [x] T054 [US5] Add keyboard navigation support in src/components/SubmitIdeaForm.tsx (verify tab order: title → description → category → submit)
- [x] T055 [US5] Add loading state ARIA in src/components/SubmitIdeaForm.tsx (aria-busy="true" on submit button during submission)
- [x] T056 [US5] Add CSS for focus indicators in src/app/globals.css or component styles (visible outline, minimum 2px, 3:1 contrast ratio)
- [x] T057 [US5] Add CSS for text contrast in src/app/globals.css or component styles (ensure 4.5:1 contrast ratio for all text)

**Checkpoint**: Accessibility is complete - form is fully keyboard navigable and screen reader compatible

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final touches, documentation, and comprehensive testing

- [x] T058 [P] Add loading spinner component in src/components/SubmitIdeaForm.tsx (display during isSubmitting state)
- [x] T059 [P] Add form field disabling during submission in src/components/SubmitIdeaForm.tsx (disable all inputs when isSubmitting=true)
- [x] T060 [P] Add JSDoc documentation to all functions in src/lib/validators.ts (document SubmitIdeaSchema with @example)
- [x] T061 [P] Add JSDoc documentation to sanitizeText in src/lib/sanitizers.ts (document parameters and return with @param, @returns, @example)
- [x] T062 [P] Add JSDoc documentation to POST handler in src/app/api/ideas/route.ts (document endpoint, parameters, responses)
- [x] T063 [P] Add JSDoc documentation to SubmitIdeaForm component in src/components/SubmitIdeaForm.tsx (document props and behavior)
- [x] T064 Add navigation link to ideas submission page in src/components/Navigation.tsx or equivalent (link to /ideas/submit with label "Submit Idea")
- [x] T065 [P] Run test suite and verify coverage: npm run test:unit && npm run test:integration && npm run test:e2e
- [x] T066 [P] Verify ≥80% line coverage and ≥75% branch coverage per plan.md requirements
- [ ] T067 Run accessibility validation with axe or WAVE tool on /ideas/submit page
- [ ] T068 Run quickstart.md validation (follow all steps in quickstart.md and verify feature works end-to-end)
- [x] T069 Code cleanup and formatting: npx prettier --write src/ tests/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T006) - BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Foundational completion (T007-T012) - MVP foundation
- **Phase 4 (US2)**: Depends on Phase 3 completion (T013-T022) - Adds validation to working form
- **Phase 5 (US3)**: Depends on Phase 3 completion (T013-T022) - Can run in parallel with Phase 4
- **Phase 6 (US4)**: Depends on Phase 3 completion (T013-T022) - Can run in parallel with Phases 4-5
- **Phase 7 (US5)**: Depends on Phase 3 completion (T013-T022) - Can run in parallel with Phases 4-6
- **Polish (Phase 8)**: Depends on all user story phases (T013-T057)

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (T012) - No dependencies on other stories
- **User Story 2 (P1)**: Depends on US1 core form implementation (T018) - Adds validation layer
- **User Story 3 (P1)**: Depends on US1 core form and page (T018, T020) - Enhances category handling
- **User Story 4 (P2)**: Depends on US1 submission logic (T019) - Adds error recovery
- **User Story 5 (P1)**: Depends on US1 form component (T018) - Adds accessibility attributes

### Within Each User Story

- Tests (T013-T016, T023-T026, etc.) MUST be written and FAIL before implementation
- Each user story follows: Tests → Core Implementation → Integration Tests
- Tests within a story marked [P] can run in parallel
- Implementation tasks proceed sequentially unless marked [P]

### Parallel Opportunities

**Phase 1 (Setup)**: T003, T004, T005, T006 can run in parallel (different sections of schema.prisma)

**Phase 2 (Foundational)**: T009, T010, T011 can run in parallel (different utility files)

**Phase 3 (US1 Tests)**: T013, T014, T015, T016 can run in parallel (different test files)

**Phase 4 (US2 Tests)**: T023, T024, T025, T026 can run in parallel (different test cases)

**Phase 5 (US3 Tests)**: T032, T033 can run in parallel (different test types)

**Phase 6 (US4 Tests)**: T038, T039 can run in parallel (different test types)

**Phase 7 (US5 Tests)**: T046, T047, T048 can run in parallel (different accessibility aspects)

**Phase 8 (Polish)**: T058, T059, T060, T061, T062, T063, T065, T066 can run in parallel (different files)

**After Foundational Phase**: User Stories 2, 3, 4, 5 can be worked on in parallel by different developers (after US1 is complete)

---

## Parallel Example: User Story 1

```bash
# Write all tests for User Story 1 together (ensure they FAIL):
Task T013: Unit test for SubmitIdeaSchema validation
Task T014: Unit test for sanitizeText function  
Task T015: Contract test for POST /api/ideas
Task T016: Integration test for POST /api/ideas

# After tests fail, implement in sequence:
Task T017: API route (POST /api/ideas)
Task T018: Form component (SubmitIdeaForm)
Task T019: Form submission logic
Task T020: Page component (ideas/submit)
Task T021: Page metadata

# Finally, E2E validation:
Task T022: E2E test for complete workflow
```

---

## Parallel Example: After Foundational Phase

```bash
# If you have multiple developers, these can proceed in parallel:
Developer A: Phase 3 (User Story 1) - T013 through T022
Developer B: Start writing tests for Phase 4 (User Story 2) - T023-T026 (will need to wait for T018 to complete implementation)
Developer C: Start writing tests for Phase 7 (User Story 5) - T046-T048 (will need to wait for T018 to complete implementation)

# Alternatively, sequential priority order:
Complete Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 7 (US5) → Phase 6 (US4) → Phase 8
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T012) ← CRITICAL BLOCKER
3. Complete Phase 3: User Story 1 (T013-T022)
4. **STOP and VALIDATE**: Test form end-to-end, verify idea submission works
5. Deploy/demo if ready (users can now submit ideas!)

### Incremental Delivery

1. **Foundation Ready**: Complete Setup + Foundational (T001-T012)
2. **MVP Release**: Add US1 (T013-T022) → Test independently → Deploy/Demo ✅ Core submission works
3. **Enhanced Validation**: Add US2 (T023-T031) → Test independently → Deploy/Demo ✅ Better error messages
4. **Category Polish**: Add US3 (T032-T037) → Test independently → Deploy/Demo ✅ Better category UX
5. **Accessibility**: Add US5 (T049-T057) → Test independently → Deploy/Demo ✅ WCAG 2.1 AA compliant
6. **Error Recovery**: Add US4 (T040-T045) → Test independently → Deploy/Demo ✅ Robust error handling
7. **Final Polish**: Add Phase 8 (T058-T069) → Full validation → Final Deploy ✅ Production ready

Each phase adds value without breaking previous functionality.

### Parallel Team Strategy

With 3+ developers:

1. **All together**: Complete Setup + Foundational (T001-T012)
2. **Once T012 completes**:
   - **Developer A**: Phase 3 (US1) - Core submission (T013-T022)
   - **Developer B**: Write tests for US2, US3 (T023-T026, T032-T033)
   - **Developer C**: Write tests for US5 (T046-T048)
3. **Once T022 completes** (US1 MVP done):
   - **Developer A**: Phase 6 (US4) - Error handling (T038-T045)
   - **Developer B**: Phase 4 (US2) - Validation (T027-T031)
   - **Developer C**: Phase 7 (US5) - Accessibility (T049-T057)
4. **Once majority complete**:
   - **Developer A**: Phase 5 (US3) - Category enhancements (T034-T037)
   - **Everyone**: Phase 8 (Polish) - Parallel cleanup tasks

---

## Notes

- **[P] tasks**: Different files, no dependencies - safe to parallelize
- **[Story] label**: Maps task to specific user story for traceability
- **Tests first**: Write tests, ensure they FAIL, then implement to make them PASS
- **Each user story**: Should be independently completable and testable
- **Commit strategy**: Commit after each task or logical group of [P] tasks
- **Checkpoints**: Stop at any checkpoint to validate story independently before proceeding
- **Coverage target**: ≥80% line coverage, ≥75% branch coverage per plan.md
- **Accessibility**: WCAG 2.1 Level AA compliance is non-negotiable (US5)
- **Migrations**: Always use `npx prisma migrate dev` - never modify schema without migration
- **JSDoc**: Required on all functions per plan.md constitution

