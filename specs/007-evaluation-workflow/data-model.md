# Data Model: Evaluation Workflow

**Feature**: 007-evaluation-workflow  
**Date**: 2026-02-25  
**Input**: spec.md, research.md

## Entity Overview

| Entity      | Change    | Description                                               |
|-------------|-----------|-----------------------------------------------------------|
| Idea        | Extended  | Status enum; optional Evaluation relation                  |
| IdeaStatus  | New enum  | SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED               |
| Evaluation  | New model | Decision, comments, evaluator reference, timestamp         |

---

## IdeaStatus Enum

```prisma
enum IdeaStatus {
  SUBMITTED
  UNDER_REVIEW
  ACCEPTED
  REJECTED
}
```

**Validation**:
- Default for new ideas: SUBMITTED (assigned at creation per spec 004).
- Valid transitions (per spec):
  - SUBMITTED → UNDER_REVIEW (on "Start evaluation" button; optional for MVP)
  - SUBMITTED → ACCEPTED | REJECTED (direct accept/reject)
  - UNDER_REVIEW → ACCEPTED | REJECTED
  - ACCEPTED, REJECTED: terminal; no re-evaluation in MVP.

---

## Idea (Extended)

| Field       | Type        | Constraint  | Notes                                      |
|-------------|-------------|-------------|--------------------------------------------|
| status      | IdeaStatus  | @default(SUBMITTED) | Replace current `String @default("SUBMITTED")` |
| evaluation  | Evaluation? | optional 1:1 | When evaluated; one evaluation per idea  |

**Migration**: Add `IdeaStatus` enum; change `status` column; add `evaluation` relation.

---

## Evaluation (New)

| Field       | Type     | Constraint  | Notes                                      |
|-------------|----------|-------------|--------------------------------------------|
| id          | String   | @id cuid    | Primary key                                |
| ideaId      | String   | @unique     | One evaluation per idea                    |
| idea        | Idea     | relation    | back-reference                             |
| decision    | String   | @db.VarChar(20) | "ACCEPTED" or "REJECTED"               |
| comments    | String   | @db.Text    | Required; max 2000 chars                    |
| evaluatorId | String?  |             | User who evaluated; SetNull if user deleted |
| evaluator   | User?    | relation    | For display; "Administrator" when null     |
| evaluatedAt | DateTime | @default(now()) | When decision was made                  |

**Validation**:
- comments: min 1, max 2000 characters (enforced at API with Zod).
- decision: exactly "ACCEPTED" or "REJECTED".
- ideaId: must exist; idea must be in SUBMITTED or UNDER_REVIEW before evaluation.

**Indexes**:
- `@@index([ideaId])` (implicit via unique)
- `@@index([evaluatorId])` (for "evaluations by user" queries if needed)

**Relations**:
- User model: add `evaluations Evaluation[]` if not exists.

---

## State Transitions (Idea)

```text
SUBMITTED ──(admin: Start evaluation)──► UNDER_REVIEW  (optional; FR-009)
SUBMITTED ──(admin: Accept + comments)──► ACCEPTED
SUBMITTED ──(admin: Reject + comments)──► REJECTED
UNDER_REVIEW ──(admin: Accept + comments)──► ACCEPTED
UNDER_REVIEW ──(admin: Reject + comments)──► REJECTED
ACCEPTED, REJECTED: no transitions (terminal)
```

---

## API / Service Types

**IdeaListItem** (extend existing):
- Add `status: IdeaStatus` (or display string).

**IdeaDetail** (extend existing):
- Add `status: IdeaStatus`
- Add `evaluation?: { decision: string; comments: string; evaluatedAt: Date; evaluatorDisplayName: string } | null`

**EvaluatePayload** (API):
- `decision: "ACCEPTED" | "REJECTED"`
- `comments: string` (1–2000 chars)
