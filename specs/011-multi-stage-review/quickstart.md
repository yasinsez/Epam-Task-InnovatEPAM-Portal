# Quickstart: Multi-Stage Review

**Feature**: 011-multi-stage-review  
**Audience**: Developers implementing configurable stages and stage advancement  
**Time to Complete**: ~8–12 hours for implementation + testing

---

## 1. Prerequisites

- Idea, Evaluation, User models exist
- `POST /api/ideas/[id]/evaluate` and `start-review` routes exist
- EvaluationForm component and idea detail page exist
- NextAuth session and RBAC (requireRole for admin/evaluator) working
- Spec 007 evaluation workflow implemented

---

## 2. Database Changes

### 2.1 Add ReviewStage Model

```prisma
model ReviewStage {
  id           String   @id @default(cuid())
  name         String   @db.VarChar(100)
  description  String?  @db.VarChar(500)
  displayOrder Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  ideasInStage     Idea[]
  transitionsFrom  StageTransition[] @relation("FromStage")
  transitionsTo    StageTransition[] @relation("ToStage")

  @@index([displayOrder])
}
```

### 2.2 Add StageTransition Model

```prisma
model StageTransition {
  id          String       @id @default(cuid())
  ideaId      String
  idea        Idea         @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  fromStageId String?
  fromStage   ReviewStage? @relation("FromStage", fields: [fromStageId], references: [id], onDelete: SetNull)
  toStageId   String?
  toStage     ReviewStage? @relation("ToStage", fields: [toStageId], references: [id], onDelete: SetNull)
  comments    String?      @db.Text
  evaluatorId String?
  evaluator   User?        @relation(fields: [evaluatorId], references: [id], onDelete: SetNull)
  createdAt   DateTime     @default(now())

  @@index([ideaId])
  @@index([evaluatorId])
}
```

Add to User: `stageTransitions StageTransition[]`

### 2.3 Extend Idea Model

```prisma
model Idea {
  // ... existing fields
  currentStageId   String?
  currentStage     ReviewStage? @relation(fields: [currentStageId], references: [id], onDelete: SetNull)
  stageTransitions StageTransition[]
}
```

### 2.4 Migration

```bash
npx prisma migrate dev --name multi_stage_review
```

---

## 3. Stage Service

### 3.1 Create `src/lib/services/stage-service.ts`

```typescript
/** List all stages ordered by displayOrder */
export async function getStages(): Promise<StageSummary[]>;

/** Create stage; enforce max 20; assign displayOrder */
export async function createStage(data: StageCreateInput): Promise<ReviewStage>;

/** Update stage (name, description, displayOrder) */
export async function updateStage(stageId: string, data: StageUpdateInput): Promise<ReviewStage>;

/** Delete stage; reject if ideas in stage */
export async function deleteStage(stageId: string): Promise<void>;

/** Get first stage (for new ideas) */
export async function getFirstStage(): Promise<ReviewStage | null>;

/** Get next stage by displayOrder */
export async function getNextStage(currentStage: ReviewStage): Promise<ReviewStage | null>;

/** Check if stage is final */
export async function isFinalStage(stageId: string): Promise<boolean>;
```

---

## 4. Evaluation Service Extensions

### 4.1 Extend `evaluation-service.ts`

```typescript
/** Advance idea from current stage to next. Returns null if already advanced (409 case). */
export async function advanceIdeaToNextStage(
  ideaId: string,
  evaluatorId: string,
  comments?: string
): Promise<AdvanceResult | null>;
```

Logic:
1. Load idea with currentStage
2. If no stages configured or currentStageId null → return null (use default flow)
3. If idea in final stage → return null (caller should use evaluate)
4. Get next stage
5. In transaction: create StageTransition, update idea.currentStageId, optionally status→UNDER_REVIEW
6. First-wins: if updateMany count=0 due to race, return null

### 4.2 Idea Creation (Submit)

When idea is submitted: if stages exist, set `currentStageId = firstStage.id`.

---

## 5. API Routes

### 5.1 Create `src/app/api/admin/review-stages/route.ts`

- **GET**: List stages (admin only)
- **POST**: Create stage (admin only; max 20)

See `contracts/api-review-stages.md`.

### 5.2 Create `src/app/api/admin/review-stages/[stageId]/route.ts`

- **PATCH**: Update stage (name, description, displayOrder)
- **DELETE**: Delete stage (block if ideas in stage)

### 5.3 Create `src/app/api/ideas/[id]/advance-stage/route.ts`

- **POST**: Advance idea to next stage (evaluator/admin)

See `contracts/api-advance-stage.md`.

---

## 6. Validation

### 6.1 Add schemas in `src/lib/validators.ts`

```typescript
export const stageCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const stageUpdateSchema = stageCreateSchema.partial();

export const advanceStageSchema = z.object({
  comments: z.string().max(2000).optional(),
});
```

---

## 7. Component Changes

### 7.1 Admin: Stage Config UI

- Route: `/dashboard/admin/stages` or under existing admin area
- List stages with name, order, idea count
- Add / Edit / Delete / Reorder (drag or up-down buttons)
- Create `StageConfigForm` component

### 7.2 Evaluator: Advance vs Evaluate

- In `EvaluationForm` or idea detail: when idea has currentStage and not final stage → show "Advance to Next Stage" button + optional comments
- When in final stage → show existing Accept/Reject with required comments
- When no stages → show existing single-stage flow (Start review → Accept/Reject)

### 7.3 Submitter: Stage Progress

- Create `StageProgressDisplay` component
- Show "Stage X of Y: Stage Name" and optional "Stage1 ✓ → Stage2 ✓ → Stage3 (current)"
- Use in idea detail page for submitter view

---

## 8. Idea Service Updates

- `getIdeaById` / list: include `currentStage` with name and position
- `getIdeasForEvaluator`: include stage info; optionally filter by stage

---

## 9. Default Workflow (No Stages)

- When `getStages()` returns empty: new ideas get `currentStageId = null`
- Evaluator sees standard Start review → Accept/Reject flow
- No advance-stage button shown
- Idea list/detail show status only (no stage)

---

## 10. Testing

### Unit

- `stage-service.test.ts` — CRUD, getFirstStage, getNextStage, isFinalStage, delete block
- `evaluation-service.test.ts` — advanceIdeaToNextStage, first-wins
- `validators.test.ts` — stage schemas

### Integration

- `api/admin/review-stages/route.test.ts` — GET, POST, 403, max 20
- `api/admin/review-stages/[stageId]/route.test.ts` — PATCH, DELETE (block when ideas in stage)
- `api/ideas/[id]/advance-stage/route.test.ts` — advance, 409, 400 when final stage

### E2E

- Admin configures 3 stages; reorders; removes empty stage
- Submitter submits idea; evaluator advances through stages; accepts at final stage
- Submitter sees stage progress on idea detail
- No stages: submit idea, evaluate as today (default flow)

---

## 11. Run and Verify

```bash
npx prisma migrate dev --name multi_stage_review
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
```

Manual: admin adds stages; evaluator advances idea; submitter sees progress; remove stages and verify default flow still works.
