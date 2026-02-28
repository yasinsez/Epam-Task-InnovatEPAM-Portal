# Research: Draft Management

**Feature**: 010-draft-management | **Phase**: 0 | **Date**: 2026-02-28

All NEEDS CLARIFICATION items from Technical Context have been resolved via existing project constitution, codebase analysis, and spec requirements.

---

## 1. Draft Storage: Idea with DRAFT Status vs Separate Draft Model

**Decision**: Add `DRAFT` to `IdeaStatus` enum. Use the existing `Idea` model for drafts. Ideas with `status: DRAFT` are drafts; they are filtered out of evaluator/admin views and submitter "submitted ideas" list.

**Rationale**:
- Reuses existing schema (title, description, categoryId, dynamicFieldValues, attachments)
- Attachments already use `ideas/<ideaId>/` path; no new storage pattern
- On submit: change status to SUBMITTED, set `submittedAt` (already exists); no data migration
- `idea-service.ts` already has `SubmissionStats.drafts` (currently 0); trivial to wire
- Simpler than a separate Draft table with duplicated structure

**Alternatives considered**:
- **Separate Draft model**: Allows optional title/description/categoryId natively but duplicates Idea structure and requires DraftAttachment model, new API surface, and conversion logic. Rejected for added complexity.
- **LocalStorage/client-only drafts**: Spec requires server persistence ("return later", "navigate away"); rejected.

---

## 2. Partial Data: Empty Required Fields for Drafts

**Decision**: Use placeholders for drafts when fixed fields are empty:
- **title**: Store `""` in DB; Idea.title is `String` (non-null). Use placeholder `"Untitled draft"` for display when empty. On save, store `title.trim() || "Untitled draft"` so DB always has a non-empty string.
- **description**: Store `""`; display as empty. Valid per Prisma (empty string allowed).
- **categoryId**: Make `categoryId` optional for drafts via schema change: `categoryId String?` with migration. When null, submitters see "Select category" on reopen. On submit, validation requires categoryId.

**Rationale**:
- Spec FR-001: "without requiring validation of required fields"; FR-003: "partial data is allowed"
- Minimal schema change: only `categoryId` becomes optional. Migration: `ALTER COLUMN "categoryId" DROP NOT NULL` with default for existing rows (keep current value).
- Existing ideas always have categoryId; only new drafts with status DRAFT may have null.
- Display logic: `title || "Untitled draft"`; `description || ""`; category dropdown shows "--" when null.

**Alternatives considered**:
- **All optional**: Would require `title String?`, `description String?`—larger migration and many code changes. Rejected.
- **Sentinel category "Draft"**: Pollutes category list; rejected.

---

## 3. Attachment Storage for Draft Ideas

**Decision**: Use existing `ideas/<ideaId>/` path. Draft ideas have an `id` like any idea; `saveAttachmentFile(ideaId, file)` works unchanged. No new path (e.g. `drafts/`) needed.

**Rationale**:
- `attachment-service.ts` already takes `ideaId`; draft ideas have ids
- On discard: `deleteIdeaWithCleanup` (or equivalent) removes idea + cascade deletes attachments + deletes files
- Spec: "Discarded drafts MUST have their orphaned attachments cleaned up"

---

## 4. Form Configuration Changes (Draft Load)

**Decision**: Load draft with current form configuration. Map stored `dynamicFieldValues` to current field definitions by field `id`. Display values for fields that still exist; ignore keys for removed fields (preserved in JSON for history but not rendered). New fields appear empty. No versioning of form config per draft.

**Rationale**:
- Spec edge case: "Values for fields that still exist are restored; values for removed fields are preserved for historical purposes but not displayed. New fields appear empty."
- `createSubmissionSchema` from current config validates on submit only; for draft save we skip or use relaxed schema

---

## 5. Draft Limit (10 per User) Enforcement

**Decision**: Enforce in API layer before create. On `POST /api/drafts` (create) or equivalent: `const count = await prisma.idea.count({ where: { userId, status: 'DRAFT' } }); if (count >= 10) return 400`. Same check when saving a new draft (not when updating existing).

**Rationale**:
- Spec FR-008: "maximum number of drafts per user (e.g., 10)"
- Simple count query; no additional tables

---

## 6. Save Draft vs Submit Validation

**Decision**: Two code paths:
- **Save draft**: Accept partial data. Skip `SubmitIdeaSchema` required-field validation. Use relaxed schema: `title` and `description` optional (allow empty); `categoryId` optional. Validate only: non-empty payload shape, attachment limits (from UploadConfig), no XSS in strings. Store as-is.
- **Submit**: Full validation. If submitting from draft, load draft, merge form data, run full `SubmitIdeaSchema` + dynamic field validation. If valid, update idea (status→SUBMITTED, submittedAt→now) or return 400 with field errors.

**Rationale**:
- Spec FR-010: "Validate required fields only when the submitter chooses Submit, not when they choose Save draft"
- Reuse existing validation for submit path; new relaxed path for save

---

## 7. API Design: Dedicated /api/drafts vs Extend /api/ideas

**Decision**: Add dedicated `/api/drafts` routes:
- `GET /api/drafts` — list current user's drafts (submitter only)
- `POST /api/drafts` — create draft (partial data)
- `GET /api/drafts/[id]` — get draft by id (owner only)
- `PATCH /api/drafts/[id]` — update draft (owner only)
- `DELETE /api/drafts/[id]` — discard draft (owner only)
- `POST /api/drafts/[id]/submit` — convert draft to idea (validates, then updates status)

**Rationale**:
- Clear separation: drafts are a different resource from "submitted ideas"
- `/api/ideas` GET continues to exclude drafts for evaluators; submitters can filter `?status=submitted` or have separate "My Drafts" that calls `/api/drafts`
- RESTful; easy to document in contracts

**Alternatives considered**:
- Extend POST /api/ideas with `?action=saveDraft`: Works but mixes concerns; dedicated routes clearer.

---

## 8. Draft List Display Fields

**Decision**: Show `title || "Untitled draft"`, `updatedAt` (last updated). Optional: `createdAt`. No category in list unless we add it (spec says "title or placeholder, last updated date").

**Rationale**:
- Spec: "identifying info (e.g., title or 'Untitled draft', last updated date)"
- Minimal fields keep list simple

---

## 9. Concurrent Edit (Last-Save-Wins)

**Decision**: No optimistic locking. Each `PATCH /api/drafts/[id]` overwrites. If user has draft open in two tabs and saves in both, the last request wins. No conflict detection.

**Rationale**:
- Spec: "Last-save-wins. If the user saves in one tab, the other tab's state may be stale"
- Simpler implementation; acceptable for v1
