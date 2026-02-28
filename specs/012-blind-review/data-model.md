# Data Model: Blind Review (Anonymous Evaluation)

**Feature**: 012-blind-review | **Phase**: 1 | **Date**: 2026-02-28

## Entity Overview

| Entity | Change | Description |
|--------|-------|-------------|
| Evaluation | Extended | Add `evaluatedUnderBlindReview` flag for FR-009 |
| StageTransition | No schema change | Display logic masks evaluator when blind review on |
| BlindReviewConfig | Optional | Env vars for MVP; optional DB model later |

---

## 1. Evaluation (Extended)

Add field to record whether evaluation was performed while blind review was enabled (for FR-009 non-retroactive exposure).

```prisma
model Evaluation {
  // ... existing fields ...
  evaluatedUnderBlindReview Boolean? @default(null)
}
```

**Validation**:
- Set to `true` when blind review is enabled at evaluation creation time
- Set to `false` when blind review is disabled
- `null`: legacy evaluations (before blind review feature); treat as "show identity when blind review off"

**Migration**:
```sql
ALTER TABLE "Evaluation" ADD COLUMN "evaluatedUnderBlindReview" BOOLEAN;
-- Existing rows: null (backfill optional; null = legacy, show per current config when blind review off)
```

---

## 2. Display Logic (No Schema)

**Idea Detail / Evaluation Display**:
- When `evaluatedUnderBlindReview === true`: Always use generic label (e.g. "Reviewed"); never show evaluator identity to any user
- When `evaluatedUnderBlindReview === false` or `null`: If `blindReviewEnabled` and user is admin and `adminAuditEnabled`, show evaluator; else if blind review currently on, mask; else show identity

Simplified implementation:
- `shouldMaskEvaluator(evaluation, viewerRole, config)`: returns true if we must not show evaluator
  - If `evaluation.evaluatedUnderBlindReview === true` → always mask (FR-009)
  - Else if `config.blindReviewEnabled` and viewer is not admin-with-audit → mask
  - Else → do not mask

**StageTransition**:
- Same rule: if transition was created under blind review (future: optional flag), or if blind review is on and viewer is not admin-with-audit, do not include evaluator in any display. Current UI does not show stage evaluator; when added, apply masking.

---

## 3. Blind Review Configuration (MVP: Env Vars)

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `BLIND_REVIEW_ENABLED` | boolean | false | When true, evaluator identity is masked for submitters and non-admin users |
| `BLIND_REVIEW_ADMIN_AUDIT_ENABLED` | boolean | false | When true (and BLIND_REVIEW_ENABLED), admins can see evaluator identity |

**Resolution** (server-side):
- Read from `process.env`; default `false` if unset
- Use in `getIdeaForDetail`, evaluation service, and any future stage-transition display

---

## 4. API / Service Types

**IdeaDetail.evaluation** (extended):
- `evaluatorDisplayName`: string — Either real name/email, "Administrator", or generic "Reviewed" when masked
- `evaluatedUnderBlindReview`: boolean | null — For display logic

**BlindReviewConfig** (resolved at runtime):
```ts
type BlindReviewConfig = {
  enabled: boolean;
  adminAuditEnabled: boolean;
};
```

---

## 5. State Transitions

No new state transitions. Blind review only affects display; evaluation and stage-advance workflows unchanged.

---

## 6. Relationship Diagram

```
Evaluation
  ├── evaluatorId (persisted, never exposed when masking)
  ├── evaluatedUnderBlindReview (new)
  └── evaluator (relation; used only when admin-audit and not masking)

Display layer: evaluatorDisplayName = maskOrReal(evaluation, config, viewerRole)
```
