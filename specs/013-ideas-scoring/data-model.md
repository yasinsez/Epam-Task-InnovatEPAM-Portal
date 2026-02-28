# Data Model: Ideas Scoring System

**Feature**: 013-ideas-scoring | **Phase**: 1 | **Date**: 2026-02-28

## Entity Overview

| Entity | Change | Description |
|--------|--------|-------------|
| Idea | Extended | Add `rating`, `ratingEvaluatorId`, `ratingAssignedAt` |
| Evaluation | No change | Rating is separate from final decision |
| RatingService | New | Service for assign/validation logic |

---

## 1. Idea (Extended)

Add fields to store a single rating per idea with evaluator attribution and timestamp.

```prisma
model Idea {
  // ... existing fields ...
  rating             Int?       // 1-5, null = not yet rated
  ratingEvaluatorId  String?    // FK User; null if mock/system
  ratingAssignedAt   DateTime?  // Timestamp of last rating assignment

  ratingEvaluator    User?      @relation("IdeaRatingEvaluator", fields: [ratingEvaluatorId], references: [id], onDelete: SetNull)

  @@index([rating])             // For sort/filter by rating
}
```

**User** model needs inverse relation:

```prisma
model User {
  // ... existing fields ...
  ideasRated  Idea[] @relation("IdeaRatingEvaluator")
}
```

**Validation**:
- `rating`: 1–5 integer when set; null when no rating
- `ratingEvaluatorId`: User who last assigned the rating; optional for audit edge cases
- `ratingAssignedAt`: Set/updated when rating is assigned; used for display and audit

**State rules** (enforced in service layer):
- Rating can be set/updated only when `status` is SUBMITTED or UNDER_REVIEW
- When status becomes ACCEPTED or REJECTED, rating is immutable (FR-007)
- Last assignment wins until accept/reject (FR-006)

---

## 2. Migration

```sql
ALTER TABLE "Idea" ADD COLUMN "rating" INTEGER;
ALTER TABLE "Idea" ADD COLUMN "ratingEvaluatorId" TEXT;
ALTER TABLE "Idea" ADD COLUMN "ratingAssignedAt" TIMESTAMP(3);

CREATE INDEX "Idea_rating_idx" ON "Idea"("rating");

ALTER TABLE "Idea" ADD CONSTRAINT "Idea_ratingEvaluatorId_fkey"
  FOREIGN KEY ("ratingEvaluatorId") REFERENCES "User"("id") ON DELETE SET NULL;
```

---

## 3. API / Service Types

**Idea list item** (extended):

| Field | Type | Description |
|-------|------|-------------|
| `rating` | number \| null | 1–5 when set; null = not yet rated |
| `ratingDisplay` | string | "4/5" or "Not yet rated" (computed) |

**Idea detail** (extended):

| Field | Type | Description |
|-------|------|-------------|
| `rating` | number \| null | 1–5 when set; null = not yet rated |
| `ratingDisplay` | string | "4/5" or "Not yet rated" |
| `ratingAssignedAt` | string \| null | ISO 8601 when rating set; null otherwise |

---

## 4. State Transitions

| Idea Status | Rating Allowed |
|-------------|----------------|
| SUBMITTED | Assign, update |
| UNDER_REVIEW | Assign, update |
| ACCEPTED | Read-only; updates blocked |
| REJECTED | Read-only; updates blocked |
| DRAFT | No rating (ideas not in evaluation flow) |

---

## 5. Relationship Diagram

```
Idea
  ├── rating (Int? 1-5)
  ├── ratingEvaluatorId (FK User?)
  ├── ratingAssignedAt (DateTime?)
  └── ratingEvaluator (User?) — relation for display name

Display: ratingDisplay = rating != null ? `${rating}/5` : "Not yet rated"
```
