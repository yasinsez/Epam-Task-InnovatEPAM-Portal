# Research: Evaluation Workflow

**Feature**: 007-evaluation-workflow  
**Date**: 2026-02-25  
**Input**: plan.md Technical Context, spec.md requirements

## 1. First-Wins Concurrency (Two Admins Evaluating Same Idea)

**Decision**: Use optimistic read-before-write in a transaction. Check idea status before updating; if already ACCEPTED or REJECTED, return 409 Conflict with message "This idea has already been evaluated."

**Rationale**:
- Spec mandates: "First successful submission wins; second admin sees 'This idea has already been evaluated' and their evaluation is discarded."
- No pessimistic locking or row-level locks; keeps implementation simple.
- Prisma `update` with `where: { id, status: { in: ['SUBMITTED','UNDER_REVIEW'] } }` returns 0 rows if another transaction already changed status; we can detect this and return 409.

**Alternatives Considered**:
- Pessimistic locking (`SELECT ... FOR UPDATE`): Rejected—adds complexity; spec says "no locking".
- Optimistic locking with version field: Rejected—overkill for single-status field; status check suffices.

**Implementation**: In `evaluateIdea` service: (1) fetch idea and verify status is SUBMITTED or UNDER_REVIEW; (2) in a transaction, re-fetch and update only if status unchanged; (3) if update affects 0 rows, return conflict.

---

## 2. API Pattern: Server Action vs API Route for Evaluation

**Decision**: Use `POST /api/ideas/[id]/evaluate` API route.

**Rationale**:
- Existing ideas API uses routes (`/api/ideas`, `/api/ideas/[id]/attachment`); consistency.
- `requireRole` from `role-guards.ts` fits route handlers.
- Zod validation at route layer; clear 400/403/409 responses.
- Client can call via `fetch`; idea detail page can use a form action or client-side fetch.

**Alternatives Considered**:
- Server Action: Rejected—project already uses API routes for mutations; Server Actions would mix patterns.
- Form POST to same page: Rejected—need JSON responses for conflict/validation errors; API route clearer.

---

## 3. Idea Status: Enum vs String

**Decision**: Use Prisma enum `IdeaStatus` with values SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED.

**Rationale**:
- Type safety; prevents invalid status values.
- Aligns with existing `UserRole` enum pattern in schema.
- Migration: change Idea.status from `String @default("SUBMITTED")` to `IdeaStatus @default(SUBMITTED)`.

**Alternatives Considered**:
- Keep String: Rejected—no type safety; typo risks.
- External enum in TypeScript only: Rejected—Prisma enum ensures DB consistency.

---

## 4. Evaluation Comments: Validation and Storage

**Decision**: Store comments in `Evaluation.comments` (Text, max 2000); validate with Zod at API boundary.

**Rationale**:
- Spec: 2000 char limit (matches idea description from spec 004).
- Single source of truth in Prisma; no redundant validation layer.
- Zod schema: `z.string().min(1).max(2000)` for required, non-empty comments.

**Alternatives Considered**:
- DB CHECK constraint: Rejected—Zod at API is sufficient; avoids DB-specific checks.
- Optional comments: Rejected—spec requires comments for accept/reject.

---

## 5. Deactivated Evaluator Display

**Decision**: When evaluator account is deactivated, show outcome and comments; evaluator identity as "Administrator" (or generic label) if user no longer exists.

**Rationale**:
- Spec: "The evaluation outcome and comments remain visible; evaluator identity may be anonymized or shown as 'Administrator' if needed."
- Implementation: `Evaluation` has `evaluatorId`; join `User`. If user deleted/deactivated, display "Administrator" in UI.
- Prisma: Use `onDelete: SetNull` for evaluatorId if we allow user deletion, or keep reference and check `user` existence when displaying.

**Alternatives Considered**:
- Hide evaluation if evaluator deleted: Rejected—spec says outcome and comments remain visible.
- Store evaluator name in Evaluation: Rejected—denormalization; prefer join + fallback label.
