# Research: Multi-Stage Review

**Feature**: 011-multi-stage-review | **Phase**: 0 | **Date**: 2026-02-28

All NEEDS CLARIFICATION items from Technical Context have been resolved via existing project constitution, codebase analysis, and spec requirements.

---

## 1. Stage Storage: New Models vs Embedded Configuration

**Decision**: Add `ReviewStage` model with `name`, `displayOrder`, optional `description`. Stage configuration is system-wide; one ordered list applies to all ideas. `StageConfiguration` as singleton (first record) or ordered `ReviewStage` rows; we use ordered rows for flexibility.

**Rationale**:
- Spec: "Admins can create, edit, reorder, and remove stages"; "ordered list of stages"
- Prisma handles ordering via `displayOrder` integer; reordering = update displayOrder values
- Separate model allows audit, per-stage metadata, and future extensibility (e.g., stage-specific roles)
- Simpler than embedded JSON config that requires custom migration logic

**Alternatives considered**:
- **Single JSON config row**: Simpler schema but harder to query and reorder; Prisma JSON queries less ergonomic. Rejected.
- **Per-category pipelines**: Spec explicitly states "per-category or per-campaign pipelines are out of scope."

---

## 2. Idea-to-Stage Mapping: currentStageId vs Stage History Only

**Decision**: Add `currentStageId` (optional FK to `ReviewStage`) on Idea. When null and no custom stages exist, use default workflow (spec 007). When stages exist, new ideas get `currentStageId` = first stage. Add `StageTransition` model for history (fromStageId, toStageId, ideaId, evaluatorId, comments, createdAt).

**Rationale**:
- Spec FR-003: "assign each submitted idea to the first configured stage"; FR-006: "display current stage"
- `currentStageId` gives O(1) current stage lookup; no need to infer from transition history
- `StageTransition` satisfies FR-009: "persist stage transitions with timestamps and optional comments"
- Fallback: when `currentStageId` is null and no stages configured, evaluation-service uses existing submitted→under_review→accept/reject flow

**Alternatives considered**:
- **Infer from StageTransition only**: Requires computing "latest transition" or "current" from history; more complex queries. Rejected.
- **Status enum per stage**: Would explode IdeaStatus; stages are dynamic. Rejected.

---

## 3. Default Workflow (Zero Stages) vs Require Stages

**Decision**: When no `ReviewStage` rows exist, treat as default workflow. Ideas with `status` SUBMITTED/UNDER_REVIEW/ACCEPTED/REJECTED and `currentStageId = null` use existing evaluation-service behavior. When stages exist, new ideas get `currentStageId` = first stage; evaluators advance or accept/reject at final stage.

**Rationale**:
- Spec FR-007: "zero stages must fall back to default evaluation workflow (spec 007)"
- Spec User Story 4: "If no custom stages are configured, the system falls back to the existing evaluation workflow"
- Backward compatibility: existing ideas remain valid; new ideas in "no stages" mode behave as today

---

## 4. Stage Removal Constraint: Block vs Reassign

**Decision**: Block removal of a stage that has one or more ideas with `currentStageId` = that stage. Return clear error: "Cannot remove stage: X ideas are currently in this stage. Reassign them first." No automatic reassignment.

**Rationale**:
- Spec FR-011: "prevent removal of a stage that contains one or more ideas unless those ideas are first reassigned"
- Edge case: "What happens when an admin removes a stage that has ideas currently in it? → System prevents removal or requires reassigning"
- Reassignment UI can be added later (admin reassigns idea to another stage); for MVP we block and inform

**Alternatives considered**:
- **Auto-reassign to next/prev stage**: Risk of unintended workflow changes; admin should explicitly choose target. Rejected for MVP.

---

## 5. Concurrency: Advance from Same Stage (First-Wins)

**Decision**: Use optimistic check: before advancing, verify idea still has `currentStageId` = expected stage. Use Prisma transaction; if another request advanced the idea first, `updateMany` returns count=0 → return 409 "This idea has already been advanced."

**Rationale**:
- Spec FR-008: "prevent advancing an idea that has already been advanced from that stage (first successful action wins)"
- Spec edge case: "two evaluators try to advance same idea simultaneously → first wins; second sees 'This idea has already been advanced'"
- Same pattern as evaluation-service `evaluateIdea` first-wins (returns null on conflict)

---

## 6. Reordering Stages: Impact on Ideas In Pipeline

**Decision**: Stages use stable `id`; ideas reference `currentStageId`. When admin reorders, we update `displayOrder` on stages. Ideas keep `currentStageId`; they remain in the same logical stage. "Next stage" is computed by `displayOrder` (stage with displayOrder = currentOrder+1). No automatic move of ideas.

**Rationale**:
- Spec edge case: "admin reorders stages and an idea is in the middle → Idea retains its logical position; stage references updated to reflect new ordering"
- Keeping `currentStageId` stable means no data migration on reorder
- "Next stage" = stage where displayOrder = currentStage.displayOrder + 1; "final stage" = max(displayOrder)

---

## 7. Maximum Stages Limit

**Decision**: Enforce a reasonable limit of 20 stages. Reject create when count >= 20. Configurable via constant (e.g., `MAX_REVIEW_STAGES = 20`) for easy adjustment.

**Rationale**:
- Spec assumption: "Maximum number of stages: assumed reasonable limit (e.g., 10–20) to prevent abuse"
- Prevents abuse (admin creates hundreds of stages); 20 covers typical pipelines (Initial → Technical → Legal → Final = 4)

---

## 8. API Design: Stage Config vs Advance

**Decision**:
- **Stage config**: `GET/POST /api/admin/review-stages`, `PATCH/DELETE /api/admin/review-stages/[stageId]`. Reorder via `PATCH` with `displayOrder` in body; or `POST /reorder` with ordered ids.
- **Advance**: `POST /api/ideas/[id]/advance-stage` with optional `comments` (1–2000 chars). For final stage, keep existing `POST /api/ideas/[id]/evaluate` (accept/reject with comments).

**Rationale**:
- Spec: admins configure; evaluators advance
- Advance is different from evaluate: advance = move to next stage; evaluate = accept/reject at final stage
- Reuse evaluate endpoint for final-stage decision; advance for non-final stages

---

## 9. Submitter Stage Visibility

**Decision**: Include `currentStage` (name, position e.g. "2 of 4") and optional `stageHistory` (completed stages) in idea detail API when fetchable. Submitters see "Stage 2 of 4: Technical Review" and optionally "Initial Screening ✓ → Technical Review (current)".

**Rationale**:
- Spec User Story 3: "Submitters can see which stage their idea is in and how far it has progressed"
- Acceptance: "current stage (e.g., 'Stage 1 of 3: Initial Screening')"; "path completed (e.g., Initial Screening ✓ → Technical Review ✓ → Final Decision)"
