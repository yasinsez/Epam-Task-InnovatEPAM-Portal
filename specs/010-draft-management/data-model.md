# Data Model: Draft Management

**Feature**: 010-draft-management | **Phase**: 1 | **Date**: 2026-02-28

## Entity Overview

| Entity | Purpose | Key Changes |
|--------|---------|-------------|
| **Idea** | Extended to support drafts | Add DRAFT to IdeaStatus; categoryId optional for drafts |
| **IdeaStatus** | Enum for idea lifecycle | Add DRAFT value |
| **Attachment** | No change | Reused for draft ideas (ideas/<ideaId>/) |

---

## 1. IdeaStatus Enum (Modified)

**Current**:
```
enum IdeaStatus {
  SUBMITTED
  UNDER_REVIEW
  ACCEPTED
  REJECTED
}
```

**New**:
```
enum IdeaStatus {
  DRAFT       // NEW: in-progress, submitter-only, excluded from evaluation
  SUBMITTED
  UNDER_REVIEW
  ACCEPTED
  REJECTED
}
```

**Migration**: Add `DRAFT` value to enum. No existing rows have DRAFT; new drafts use DRAFT.

---

## 2. Idea Model (Modified)

**Changes**:
- `status`: Can be `DRAFT` (new)
- `categoryId`: Becomes optional (`String?`) for drafts only. Existing ideas retain categoryId; new drafts may have `null` when user has not selected a category.
- `category`: Relation becomes optional (`Category?`) when categoryId is null.

**Updated schema**:
```prisma
model Idea {
  id                   String      @id @default(cuid())
  title                String      @db.VarChar(100)     // Store "Untitled draft" when empty on save
  description          String      @db.Text             // Can be ""
  sanitizedTitle       String      @db.VarChar(100)
  sanitizedDescription String      @db.Text
  categoryId           String?     // Optional for drafts
  category             Category?   @relation(fields: [categoryId], references: [id])
  userId               String
  user                 User        @relation(...)
  submittedAt          DateTime    @default(now())      // For drafts: creation time; on submit: overwritten
  createdAt            DateTime    @default(now())
  updatedAt            DateTime    @updatedAt
  status               IdeaStatus  @default(SUBMITTED)  // DRAFT for drafts
  dynamicFieldValues   Json?
  attachments          Attachment[]
  evaluation           Evaluation?

  @@index([userId])
  @@index([userId, status])  // NEW: efficient draft count and list
  @@index([categoryId])
  @@index([submittedAt])
  @@index([userId, submittedAt])
}
```

**Validation rules**:
- **Draft save**: title/description may be empty (store "" or "Untitled draft"); categoryId may be null
- **Submit**: title min 5, description min 20, categoryId required (same as SubmitIdeaSchema)
- **Draft limit**: Max 10 ideas with status DRAFT per userId

**State transitions**:
- Create draft: status=DRAFT, categoryId nullable, title/description as provided (or placeholders)
- Save draft: update in place; no status change
- Submit draft: status→SUBMITTED, submittedAt→now; full validation before transition
- Discard draft: delete idea + cascade attachments + cleanup files

---

## 3. Attachment (No Schema Change)

Draft ideas use the same Attachment model and `ideas/<ideaId>/` storage path. On draft discard, `deleteIdeaWithCleanup` removes the idea and cascades attachment deletion; files are deleted via `deleteAttachmentFile`.

---

## 4. Relationship Diagram

```
User ──< Idea (status: DRAFT | SUBMITTED | ...)
           ├── category?: Category (optional when categoryId null)
           └── attachments: Attachment[]

Filtering:
- getIdeasForUser (submitted list): where status != DRAFT (or status in [SUBMITTED, ...])
- getDraftsForUser: where userId = X AND status = DRAFT
```

---

## 5. Migration Strategy

1. **Add DRAFT to IdeaStatus enum**:
   ```sql
   ALTER TYPE "IdeaStatus" ADD VALUE 'DRAFT';
   ```

2. **Make categoryId optional**:
   ```sql
   ALTER TABLE "Idea" ALTER COLUMN "categoryId" DROP NOT NULL;
   ```
   - Existing rows all have categoryId; no backfill needed
   - New drafts may insert with categoryId: null

3. **Add index for draft queries**:
   ```sql
   CREATE INDEX "Idea_userId_status_idx" ON "Idea"("userId", "status");
   ```

4. **Update Category relation**: In Prisma, change `category Category` to `category Category?` and `categoryId` to `categoryId?`.

5. **Code updates**: All consumers of `idea.category` must handle null (e.g. `idea.category?.name ?? '—'`). Draft list does not require category.

---

## 6. Draft-Specific Constraints

| Rule | Implementation |
|------|----------------|
| Max 10 drafts/user | Check `count({ where: { userId, status: 'DRAFT' } })` before create |
| Submitter-only visibility | All draft APIs require role=submitter; filter by userId |
| No evaluation workflow | Ideas with status DRAFT excluded from evaluator/admin lists |
| Attachments on discard | Cascade delete + filesystem cleanup via deleteIdeaWithCleanup |
