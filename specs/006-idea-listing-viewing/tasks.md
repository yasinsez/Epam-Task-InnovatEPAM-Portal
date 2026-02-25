# Tasks: Idea Listing and Viewing

**Input**: Design documents from `specs/006-idea-listing-viewing/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Optional per spec; included per project Constitution (TDD, 70/20/10 pyramid).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: Next.js at repo root; `src/`, `prisma/`, `tests/` at repository root
- No schema changes; extends existing Idea, Category, Attachment, User models

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project structure and feature-specific setup

- [x] T001 Verify project structure per plan: `src/app/ideas/`, `src/components/`, `src/lib/services/idea-service.ts` exist and are ready for extension

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core service layer that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Add `getIdeasForUser(userId, role, options)` to `src/lib/services/idea-service.ts` with role-based visibility (submitter: own; evaluator/admin: all), `orderBy: submittedAt desc`, pagination (skip/take, page/pageSize), optional categoryId filter, page normalization (0/negative→1; beyond last→last page)
- [x] T003 Add `getIdeaForDetail(ideaId, userId, role)` to `src/lib/services/idea-service.ts` with access check and include `user: { select: { name: true, email: true } }` for evaluator/admin (submitter display: name \|\| email)

**Checkpoint**: Service layer ready — user story implementation can begin

---

## Phase 3: User Story 1 - View List of Ideas (Priority: P1) 🎯 MVP

**Goal**: An authenticated user can view a list of ideas they are allowed to access; submitters see own ideas; evaluators/admins see all; each item shows title, category, date, attachment indicator; empty state when no ideas; click navigates to detail.

**Independent Test**: Log in as submitter with ≥1 idea → navigate to /ideas → see ideas with title, category, date, attachment indicator → click → detail. Log in as evaluator → see all ideas.

### Implementation for User Story 1

- [x] T004 [P] [US1] Create `IdeaListSkeleton` component in `src/components/IdeaListSkeleton.tsx` using Tailwind `animate-pulse` to mimic list layout (N placeholder rows)
- [x] T005 [P] [US1] Create `IdeaListItem` component in `src/components/IdeaListItem.tsx` displaying title (link to `/ideas/[id]`), category name, formatted submission date, attachment indicator (icon or badge)
- [x] T006 [US1] Create idea list page in `src/app/ideas/page.tsx`: Server Component with searchParams (page, pageSize, categoryId), call `getIdeasForUser`, render IdeaListItem list, wrap with Suspense fallback IdeaListSkeleton, empty state "No ideas yet" (submitter) or "No ideas pending review" (evaluator/admin)
- [x] T007 [US1] Add GET handler to `src/app/api/ideas/route.ts`: session check, resolve role, parse query (page, pageSize, categoryId), call `getIdeasForUser`, return JSON per `contracts/api-ideas-list.md` (ideas array, pagination meta)
- [x] T008 [US1] Update `src/app/components/Navigation.tsx`: change "My Ideas" link from `/dashboard/submitter` to `/ideas`; change "Evaluation Queue" link from `/dashboard/evaluator` to `/ideas` (role-based visibility on same page)

**Checkpoint**: User can view idea list, click to detail, see empty state when appropriate

---

## Phase 4: User Story 2 - View Idea Detail (Priority: P1)

**Goal**: An authenticated user with access can view full idea content: title, description, category, date, submitter (evaluators/admins only), attachment with download; back navigation to list; no-attachment state; attachment error handling.

**Independent Test**: Navigate to idea from list or direct link → see full content, submitter for evaluator/admin → Back → list. Download attachment → success. Idea with no attachment → no section shown.

### Implementation for User Story 2

- [x] T009 [P] [US2] Create `IdeaDetailSkeleton` component in `src/components/IdeaDetailSkeleton.tsx` using Tailwind `animate-pulse` to mimic detail layout (title, meta, description block, attachment block)
- [x] T010 [US2] Update `src/app/ideas/[id]/page.tsx`: use `getIdeaForDetail` instead of direct Prisma; add "Submitted by: {name \|\| email}" for evaluator/admin; change back link from "Back to Submit Idea" (href `/ideas/submit`) to "Back to Ideas" (href `/ideas`); hide attachment section when no attachment; wrap with Suspense fallback IdeaDetailSkeleton
- [x] T011 [US2] Update `src/app/api/ideas/[id]/attachment/route.ts`: on `readAttachmentFile` failure or missing file, return 404 with error message "Attachment unavailable" (align with spec FR edge case)

**Checkpoint**: Idea detail shows all content, submitter for evaluator/admin, back to list, attachment download with error handling

---

## Phase 5: User Story 3 - Paginated List (Priority: P2)

**Goal**: When ideas exceed page size (15), show pagination controls (Next, Previous, page numbers); indicate current page and total; disable Prev on first page, Next on last page.

**Independent Test**: Populate >15 ideas → load list → see pagination controls → Next/Previous work; first page Prev disabled; last page Next disabled.

### Implementation for User Story 3

- [x] T012 [P] [US3] Create `PaginationControls` component in `src/components/PaginationControls.tsx` with props page, totalPages, totalCount, baseUrl (searchParams); render Prev/Next and page indicators; disable when on first/last page
- [x] T013 [US3] Add `PaginationControls` to `src/app/ideas/page.tsx` when totalPages > 1; wire page, totalPages, totalCount from getIdeasForUser result; build baseUrl with current categoryId

**Checkpoint**: Pagination works; out-of-range page normalizes to valid (per spec)

---

## Phase 6: User Story 4 - Filter by Category (Priority: P3)

**Goal**: Users can filter idea list by category; dropdown with all categories; apply filter → list updates; clear filter → full list restored; empty-state when filter yields no results.

**Independent Test**: Ideas in multiple categories → open list → select category → only matching ideas; clear filter → all ideas; filter with no matches → "No ideas in this category".

### Implementation for User Story 4

- [x] T014 [P] [US4] Create `CategoryFilter` component in `src/components/CategoryFilter.tsx`: fetch active categories via `prisma.category.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } })`; dropdown or select with "All" option; on change, navigate with updated categoryId searchParam
- [x] T015 [US4] Add `CategoryFilter` to `src/app/ideas/page.tsx`; pass categoryId from searchParams to `getIdeasForUser`; show "No ideas in this category" when filter applied and empty

**Checkpoint**: Category filter works; clearing restores full list

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, tests, and validation

- [x] T016 [P] Add JSDoc to `getIdeasForUser` and `getIdeaForDetail` in `src/lib/services/idea-service.ts` (@param, @returns, @throws)
- [x] T017 [P] Unit test: `getIdeasForUser` and `getIdeaForDetail` (visibility rules, pagination, page normalization) in `tests/unit/lib/services/idea-service.test.ts`
- [x] T018 [P] Integration test: GET /api/ideas (session, role visibility, pagination, 401) in `tests/integration/api/ideas/route.test.ts`
- [x] T019 E2E test: login → /ideas → see list → click idea → detail → Back to Ideas in `tests/e2e/idea-listing.spec.ts`
- [x] T020 Run quickstart.md validation (manual or automated smoke)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase
  - US1 and US2 can proceed in parallel after Foundational (different files)
  - US3 depends on US1 (extends list page)
  - US4 depends on US1 (extends list page)
- **Polish (Phase 7)**: Depends on desired user stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — no other story dependencies
- **US2 (P1)**: After Foundational — no other story dependencies
- **US3 (P2)**: After US1 (adds pagination to list page)
- **US4 (P3)**: After US1 (adds category filter to list page)

### Within Each User Story

- Models/components marked [P] can run in parallel
- Page depends on components and service
- US3 and US4 both extend the same list page; can be done in either order after US1

### Parallel Opportunities

- T004, T005 within US1 can run in parallel
- T009 within US2 is parallel
- T012, T014 (US3, US4 components) can run in parallel
- T016, T017, T018 (Polish) can run in parallel
- US1 and US2 can be worked on in parallel by different developers after Foundational

---

## Parallel Example: User Story 1

```bash
# Launch skeleton and list item in parallel:
Task T004: "Create IdeaListSkeleton in src/components/IdeaListSkeleton.tsx"
Task T005: "Create IdeaListItem in src/components/IdeaListItem.tsx"
```

---

## Parallel Example: User Story 2

```bash
# Skeleton can be built independently:
Task T009: "Create IdeaDetailSkeleton in src/components/IdeaDetailSkeleton.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (list)
4. Complete Phase 4: User Story 2 (detail)
5. **STOP and VALIDATE**: Test list and detail independently
6. Deploy/demo

### Incremental Delivery

1. Setup + Foundational → service ready
2. Add US1 → list works → Deploy (list MVP)
3. Add US2 → detail enhanced → Deploy (listing + viewing complete)
4. Add US3 → pagination → Deploy
5. Add US4 → category filter → Deploy
6. Polish (tests, docs)

### Parallel Team Strategy

- After Foundational: Developer A does US1, Developer B does US2
- After US1: Developer A does US3, Developer B does US4 (or same dev sequentially)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to user story for traceability
- Each user story is independently testable
- Server Components use `getIdeasForUser` directly; GET /api/ideas provides API option for client-side use
- Page normalization: 0/negative → 1; beyond last → last page (per spec)
- Empty states: submitter "No ideas yet"; evaluator/admin "No ideas pending review"; category filter "No ideas in this category"
