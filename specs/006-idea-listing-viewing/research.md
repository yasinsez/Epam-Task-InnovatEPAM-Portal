# Research: Idea Listing and Viewing

**Feature**: 006-idea-listing-viewing  
**Date**: 2026-02-25  
**Phase**: 0 – Outline & Research

---

## 1. Server-Side Pagination with Prisma + Next.js

### Decision

Use Prisma `skip`/`take` with `orderBy: { submittedAt: 'desc' }` and return `{ ideas, totalCount, page, pageSize, totalPages }` in the API response. Page and pageSize validated with Zod; out-of-range page numbers normalized to nearest valid (0/negative → 1; beyond last → last page).

### Rationale

- Prisma cursor-based pagination is better for infinite scroll; offset-based suits page navigation (Next/Prev, page numbers).
- `skip`/`take` align with "page N of M" UX and existing `orderBy submittedAt desc` index.
- Spec requires "15 ideas per page" and "normalize out-of-range to nearest valid page".

### Alternatives Considered

- **Cursor pagination**: Better for infinite scroll; spec requires page-based navigation.
- **Client-side pagination**: Rejected; not scalable beyond ~100 ideas.

---

## 2. Skeleton Loading Placeholder

### Decision

Use CSS-only skeleton components (pulse animation via Tailwind `animate-pulse`) matching list and detail layouts. No extra dependencies.

### Rationale

- Spec: "Skeleton placeholder mimicking list/detail layout while loading."
- Tailwind provides `animate-pulse`; sufficient for MVP.
- Avoids `react-loading-skeleton` or similar packages per "no new packages unless necessary."

### Alternatives Considered

- **react-loading-skeleton**: Extra dependency; overkill for fixed layouts.
- **Spinner only**: Spec explicitly asks for layout-mimicking skeleton.

---

## 3. Role-Based Visibility Query

### Decision

Use a single Prisma query with `where` built from `userId` and role:
- Submitter: `where: { userId }`
- Evaluator/Admin: `where: {}` (no filter; all submitted ideas)

### Rationale

- Matches spec FR-001: submitters see own; evaluators/admins see all.
- Single query path; no separate "my ideas" vs "all ideas" endpoints.
- `getUserRole(userId)` already available in codebase.

### Alternatives Considered

- **Separate routes** (`/api/ideas` vs `/api/ideas/mine`): More endpoints; spec describes unified list with role-based visibility.

---

## 4. Category Filter (P3)

### Decision

Optional `categoryId` query param on `GET /api/ideas`. When present, add `where: { categoryId }` to Prisma query. Filter uses active and inactive categories (existing ideas may reference inactive categories).

### Rationale

- Spec FR-014/FR-015: filter by category; clear to restore full list.
- Query param keeps API stateless and bookmarkable.
- Category filter uses same `categoryId` as Idea model.

### Alternatives Considered

- **Multiple categories**: Spec says single category filter; keep single `categoryId` for MVP.

---

## 5. Submitter Display Name for Evaluators/Admins

### Decision

Include `user: { select: { name: true, email: true } }` when fetching idea for detail. Display: `user.name || user.email` (spec: "display name only; fall back to email if name is empty").

### Rationale

- Spec FR-006: show submitter display name for evaluators/admins.
- `User.name` is nullable; `User.email` is required fallback.
- Only include in detail; list does not show submitter (spec).

---

## 6. Back Navigation to List

### Decision

Change idea detail "Back" link from `/ideas/submit` to `/ideas` (or dynamic referrer) so users return to the idea list.

### Rationale

- Spec FR-009: "provide a way for users to navigate back from detail view to the idea list."
- Current implementation links to "Back to Submit Idea"; spec requires back to list.
- `/ideas` will be the canonical list route.

---

## Summary

All technical unknowns resolved. No NEEDS CLARIFICATION items remain.
