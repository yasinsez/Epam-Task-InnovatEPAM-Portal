---

description: "Task list for Authentication Landing Page implementation"
---

# Tasks: Authentication Landing Page

**Input**: Design documents from `/specs/008-auth-landing-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by plan.md (TDD + accessibility checks). Tests are included below.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shared types for this feature

- [ ] T001 Create type definitions in src/types/auth-landing.types.ts from specs/008-auth-landing-page/contracts/component-interfaces.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared styling foundation required by all stories

- [ ] T002 Add auth landing base styles (layout, buttons, links, focus-visible) in src/app/globals.css

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - New User Discovers Portal and Registers (Priority: P1) 

**Goal**: Unauthenticated users see a welcoming landing page and can reach `/auth/register` in one click.

**Independent Test**: Visit `/auth` unauthenticated, verify heading + Create Account button, click and confirm navigation to `/auth/register`.

### Tests for User Story 1

- [ ] T003 [P] [US1] Add unit tests for header + Create Account CTA and a11y check in tests/unit/app/auth/page.test.tsx
- [ ] T004 [P] [US1] Add e2e test for Create Account navigation in tests/e2e/auth-landing.spec.ts

### Implementation for User Story 1

- [ ] T005 [P] [US1] Implement AuthLandingHeader component in src/app/components/auth/AuthLandingHeader.tsx
- [ ] T006 [P] [US1] Implement PrimaryAuthButtons component in src/app/components/auth/PrimaryAuthButtons.tsx
- [ ] T007 [US1] Build `/auth` landing page with metadata, layout, and Create Account CTA in src/app/auth/page.tsx

**Checkpoint**: User Story 1 functional and independently testable

---

## Phase 4: User Story 2 - Existing User Accesses Login (Priority: P1)

**Goal**: Returning users can access `/auth/login` quickly and are redirected if already authenticated.

**Independent Test**: Visit `/auth` unauthenticated and click Sign In to reach `/auth/login`; visit `/auth` authenticated and confirm redirect to `/dashboard`.

### Tests for User Story 2

- [ ] T008 [US2] Extend unit tests for Sign In CTA in tests/unit/app/auth/page.test.tsx
- [ ] T009 [P] [US2] Add integration test for authenticated redirect in tests/integration/auth/landing-page.test.ts

### Implementation for User Story 2

- [ ] T010 [US2] Add authenticated redirect + loading state to src/app/auth/page.tsx
- [ ] T011 [US2] Ensure Sign In CTA routes to `/auth/login` in src/app/auth/page.tsx

**Checkpoint**: User Story 2 functional and independently testable

---

## Phase 5: User Story 3 - Cross-Linking Between Auth Forms (Priority: P2)

**Goal**: Users can switch between login and registration forms via clear cross-links.

**Independent Test**: Use the cross-links on login/register pages to navigate to the opposite form without errors.

### Tests for User Story 3

- [ ] T012 [P] [US3] Add unit tests for auth form cross-links in tests/unit/app/auth/auth-cross-links.test.tsx
- [ ] T013 [P] [US3] Add e2e test for login/register cross-link navigation in tests/e2e/auth-cross-links.spec.ts

### Implementation for User Story 3

- [ ] T014 [US3] Add "Don't have an account? Register" link in src/app/auth/login/page.tsx
- [ ] T015 [US3] Add "Already have an account? Sign in" link in src/app/auth/register/page.tsx

**Checkpoint**: User Story 3 functional and independently testable

---

## Phase 6: User Story 4 - Optional Password Reset Quick Access (Priority: P3)

**Goal**: Users can reach `/auth/forgot-password` directly from the landing page.

**Independent Test**: Visit `/auth` and click "Forgot Password?" to navigate to `/auth/forgot-password`.

### Tests for User Story 4

- [ ] T016 [US4] Extend unit tests for Forgot Password link in tests/unit/app/auth/page.test.tsx
- [ ] T017 [US4] Extend e2e auth landing test for Forgot Password link in tests/e2e/auth-landing.spec.ts

### Implementation for User Story 4

- [ ] T018 [P] [US4] Implement SecondaryAuthLinks component in src/app/components/auth/SecondaryAuthLinks.tsx
- [ ] T019 [US4] Wire "Forgot Password?" link on landing page in src/app/auth/page.tsx

**Checkpoint**: User Story 4 functional and independently testable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation updates

- [ ] T020 [P] Run quickstart validation steps in specs/008-auth-landing-page/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup
- **User Stories (Phase 3+)**: Depend on Foundational
- **Polish (Final Phase)**: Depends on completion of desired user stories

### User Story Dependencies (Order)

- **US1 (P1)**: Depends on Foundational
- **US2 (P1)**: Depends on US1 (reuses landing page structure)
- **US3 (P2)**: Depends on Foundational only
- **US4 (P3)**: Depends on US1 (landing page required)

---

## Parallel Execution Examples

### User Story 1

- T003 [US1] unit tests in tests/unit/app/auth/page.test.tsx
- T004 [US1] e2e test in tests/e2e/auth-landing.spec.ts
- T005 [US1] AuthLandingHeader component in src/app/components/auth/AuthLandingHeader.tsx
- T006 [US1] PrimaryAuthButtons component in src/app/components/auth/PrimaryAuthButtons.tsx

### User Story 2

- T009 [US2] integration test in tests/integration/auth/landing-page.test.ts

### User Story 3

- T012 [US3] unit tests in tests/unit/app/auth/auth-cross-links.test.tsx
- T013 [US3] e2e test in tests/e2e/auth-cross-links.spec.ts

### User Story 4

- T018 [US4] SecondaryAuthLinks component in src/app/components/auth/SecondaryAuthLinks.tsx

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Setup + Foundational phases
2. Implement User Story 1 and its tests
3. Validate User Story 1 independently

### Incremental Delivery

1. Add User Story 2 (Sign In + redirect)
2. Add User Story 3 (cross-links)
3. Add User Story 4 (forgot password quick access)
4. Run final quickstart validation
