# Research: Blind Review (Anonymous Evaluation)

**Feature**: 012-blind-review | **Date**: 2026-02-28

## 1. Display-Layer Masking vs Persistence

**Decision**: Persist `evaluatorId` in Evaluation and StageTransition; mask identity at display layer based on `blindReviewEnabled` and user role.

**Rationale**:
- FR-005 requires internal evaluator reference for audit and data integrity; FR-001/002 forbid exposure to submitters/non-admin users.
- Masking at the service layer (where `getIdeaForDetail` and evaluation responses are built) keeps a single source of truth; UI never receives evaluator identity when masking applies.
- Persisting evaluatorId allows admin-audit and dispute resolution without schema changes.

**Alternatives considered**:
- **Separate audit table**: Overkill; evaluation.evaluatorId already exists and is sufficient.
- **Omit evaluatorId when blind review on**: Rejected—audit requires persistence; only display changes.

---

## 2. Blind Review Configuration (Feature Flag)

**Decision**: Use environment variable `NEXT_PUBLIC_BLIND_REVIEW_ENABLED` (or server-only `BLIND_REVIEW_ENABLED`) for MVP. Optional DB-backed `BlindReviewConfig` for admin UI toggle in a later iteration.

**Rationale**:
- Spec allows system-wide config; per-campaign/per-stage is out of scope.
- Env var is simplest, requires no migration, and aligns with existing env patterns (`NEXT_PUBLIC_*` for public, no prefix for server-only).
- Server-only var preferred so client cannot infer blind-review state for side-channel attacks.

**Alternatives considered**:
- **DB table from start**: Adds migration and admin UI; defer until admin-toggle is required.
- **Hardcoded true**: Not configurable; violates FR-007.

---

## 3. Admin-Audit Visibility

**Decision**: Optional. When `BLIND_REVIEW_ADMIN_AUDIT_ENABLED` is true (and blind review is on), admins see evaluator identity; submitters and non-admin evaluators never see it. MVP may ship with blind review only (no admin-audit); add admin-audit when needed.

**Rationale**:
- Spec FR-008 says system MAY support admin-audit; not required for initial release.
- Env var `BLIND_REVIEW_ADMIN_AUDIT_ENABLED` keeps implementation simple; admin-only code path checks `role === 'admin'` and this flag.
- Submitters never see evaluator identity regardless of admin-audit (FR-008).

**Alternatives considered**:
- **Admin audit required**: Spec explicitly marks it optional.
- **Per-user admin opt-in**: Out of scope; system-wide config sufficient.

---

## 4. Generic Display Label

**Decision**: Use `"Reviewed"` or `"Evaluated"` as generic label when masking evaluator identity. Avoid `"Reviewed by Anonymous"` to reduce redundancy if multiple evaluations exist.

**Rationale**:
- FR-004 specifies generic label like "Evaluated" or "Reviewed by Anonymous".
- Shorter "Reviewed" or "Evaluated" is cleaner; "by Anonymous" can be implied.
- When blind review off, keep current behavior: `evaluatorDisplayName` (name/email or "Administrator").

**Alternatives considered**:
- **"Anonymous Reviewer"**: More verbose; "Reviewed" sufficient.
- **Localized strings**: Defer; use English label for MVP.

---

## 5. Stage Transitions and Evaluator Attribution

**Decision**: StageTransition records retain `evaluatorId` for audit. If stage transition comments are displayed in the UI, they must be shown without evaluator attribution when blind review is enabled. Current UI only shows `completedStageNames` (stage names); no evaluator in stage display. Future stage-history UI must apply same masking.

**Rationale**:
- Spec User Story 4, acceptance scenario 4: "stage transition comments exist... shown without evaluator attribution."
- Today `StageProgressDisplay` shows stage names only; no transition comments in UI. When/if stage transition comments are added, masking applies at that display point.

**Alternatives considered**:
- **Remove evaluatorId from StageTransition**: Rejected—audit needs it.
- **Store anonymized evaluator in StageTransition**: Unnecessary; display-layer masking sufficient.

---

## 6. Retroactive Non-Exposure (FR-009)

**Decision**: When blind review is disabled, past evaluations performed while it was on MUST NOT retroactively expose evaluator identity. Implementation: do not rely on "was blind review on at evaluation time"; instead, when displaying, apply current blind-review config. If blind review is ON now, mask. If OFF, show identity. FR-009 says: "evaluations performed while blind review was enabled" stay anonymous. Simplest approach: when blind review is ON, always mask regardless of when evaluation occurred. When OFF, show identity. This satisfies FR-009 (no retroactive exposure when turning OFF) because we never store "evaluation was done under blind review"—we only store evaluatorId. The spec says: "Past evaluations remain anonymous" when blind review is turned off. So we need: once an evaluation was created with blind review on, it stays masked even after blind review is turned off. That requires storing a flag `evaluatedUnderBlindReview` on Evaluation (and possibly StageTransition) at creation time.

**Revised Decision**: Add optional `evaluatedUnderBlindReview Boolean?` to Evaluation. When blind review is ON at evaluation time, set true. When displaying: if `evaluatedUnderBlindReview === true`, always mask (even if blind review is now OFF). If false or null, use current blind-review config. This satisfies FR-009.

**Rationale**:
- FR-009: "System MUST NOT retroactively expose evaluator identity for evaluations performed while blind review was enabled, even if blind review is later disabled."
- Without a flag, we cannot know if an evaluation was performed under blind review. Storing the flag at creation time is the only reliable approach.

**Alternatives considered**:
- **No flag; always use current config**: Would retroactively expose when turning OFF—violates FR-009.
- **Migration to backfill flag**: For existing evaluations before blind review: set `evaluatedUnderBlindReview = false` (or null). New evaluations get the flag set correctly.
