# Data Model: Multi-Stage Review

**Feature**: 011-multi-stage-review | **Phase**: 1 | **Date**: 2026-02-28

## Entity Overview

| Entity | Purpose | Key Changes |
|--------|---------|-------------|
| **ReviewStage** | Configurable step in review pipeline | NEW model |
| **StageTransition** | Record of idea moving between stages | NEW model |
| **Idea** | Extended with current stage reference | Add `currentStageId` (optional FK) |
| **Evaluation** | No change | Reused for final accept/reject |

---

## 1. ReviewStage (New)

```prisma
model ReviewStage {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(100)
  description String?  @db.VarChar(500)
  displayOrder Int     @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  ideasInStage     Idea[]
  transitionsFrom  StageTransition[] @relation("FromStage")
  transitionsTo   StageTransition[] @relation("ToStage")

  @@index([displayOrder])
}
```

**Validation**:
- `name`: 1–100 chars, required
- `displayOrder`: Non-negative integer; unique across stages; used for ordering (0 = first)
- `description`: Optional, max 500 chars

**Constraints**:
- Maximum 20 stages (enforced in application layer)
- Cannot delete stage with ideas where `currentStageId` = that stage

---

## 2. StageTransition (New)

```prisma
model StageTransition {
  id           String   @id @default(cuid())
  ideaId       String
  idea         Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  fromStageId  String?
  fromStage    ReviewStage? @relation("FromStage", fields: [fromStageId], references: [id], onDelete: SetNull)
  toStageId    String?
  toStage      ReviewStage? @relation("ToStage", fields: [toStageId], references: [id], onDelete: SetNull)
  comments     String?  @db.Text  // 1–2000 chars when provided
  evaluatorId  String?
  evaluator    User?    @relation(fields: [evaluatorId], references: [id], onDelete: SetNull)
  createdAt    DateTime @default(now())

  @@index([ideaId])
  @@index([evaluatorId])
  @@index([createdAt])
}
```

**Notes**:
- `fromStageId` null when advancing from first stage (idea just submitted)
- `toStageId` null when final accept/reject (transition recorded via Evaluation)
- For intermediate advances: both fromStageId and toStageId set
- `comments`: Optional for advance; required for final evaluate (per Evaluation model)
- Max 2000 chars when present (per spec FR-010)

**User relation**: Add `stageTransitions StageTransition[]` to User model.

---

## 3. Idea (Modified)

```prisma
model Idea {
  // ... existing fields ...
  currentStageId  String?
  currentStage    ReviewStage? @relation(fields: [currentStageId], references: [id], onDelete: SetNull)
  stageTransitions StageTransition[]

  // ... existing relations ...
}
```

**Semantics**:
- `currentStageId` null: Idea uses default workflow (spec 007); status SUBMITTED/UNDER_REVIEW/ACCEPTED/REJECTED
- `currentStageId` set: Idea is in multi-stage pipeline; status can remain SUBMITTED or UNDER_REVIEW until final accept/reject
- New idea with stages configured: `currentStageId` = id of first stage (displayOrder=0)
- New idea with no stages: `currentStageId` = null; behavior as today

**Index**: `@@index([currentStageId])` for stage removal check and listing ideas by stage.

---

## 4. Evaluation (Unchanged)

Evaluation model remains for final accept/reject. When idea is in final stage and evaluator accepts/rejects:
1. Create Evaluation (decision, comments, evaluatorId)
2. Update Idea: status → ACCEPTED/REJECTED, currentStageId → SetNull (or leave for history)
3. Optionally create StageTransition from final stage to "end" (toStageId null) for audit

Simpler: Evaluation records final decision; StageTransition records advance-from-stage-X. At final stage, evaluator uses evaluate endpoint; no separate "transition to end" needed if we consider Evaluation the terminal record.

---

## 5. State Transitions

### Default workflow (no stages)
- Submit idea → status SUBMITTED, currentStageId null
- Start review → status UNDER_REVIEW
- Accept/Reject → status ACCEPTED/REJECTED, Evaluation created

### Multi-stage workflow (stages exist)
- Submit idea → status SUBMITTED, currentStageId = first stage
- Advance (non-final) → create StageTransition, update currentStageId to next stage
- Advance (final) → N/A; at final stage, evaluator uses evaluate (accept/reject)
- Accept/Reject at final stage → status ACCEPTED/REJECTED, Evaluation created, currentStageId can stay (historical) or set null

---

## 6. Relationship Diagram

```
ReviewStage (ordered by displayOrder)
  ├── ideasInStage: Idea[]         (currentStageId)
  ├── transitionsFrom: StageTransition[]
  └── transitionsTo: StageTransition[]

Idea
  ├── currentStage?: ReviewStage    (optional; null = default workflow)
  └── stageTransitions: StageTransition[]

StageTransition
  ├── idea: Idea
  ├── fromStage?: ReviewStage
  ├── toStage?: ReviewStage
  └── evaluator?: User

User
  └── stageTransitions: StageTransition[]
```

---

## 7. Migration Strategy

1. **Create ReviewStage** model and table
2. **Create StageTransition** model and table
3. **Add currentStageId** to Idea (nullable FK)
4. **Add stageTransitions** relation to User

```bash
npx prisma migrate dev --name multi_stage_review
```

No backfill: existing ideas keep currentStageId null and use default workflow.

---

## 8. Stage-Specific Constraints

| Rule | Implementation |
|------|----------------|
| Max 20 stages | `prisma.reviewStage.count()` before create; reject if >= 20 |
| Cannot delete stage with ideas | `prisma.idea.count({ where: { currentStageId } }) > 0` → block |
| First stage for new ideas | When stages exist: `currentStageId = stage where displayOrder = min(displayOrder)` |
| Next stage | Stage where displayOrder = currentStage.displayOrder + 1 |
| Final stage | Stage where displayOrder = max(displayOrder) |
| Reorder | Update displayOrder on affected stages; ideas keep currentStageId (same logical stage) |
