# Quickstart: Blind Review (Anonymous Evaluation)

**Feature**: 012-blind-review | **Branch**: `012-blind-review`

## Prerequisites

- Evaluation workflow (spec 007) implemented
- Optional: Multi-stage review (spec 011) implemented
- User roles (submitter, evaluator, admin) per spec 003

## Configuration

Set environment variables (default: blind review disabled):

```bash
# Enable blind review (masks evaluator identity for submitters and non-admin users)
BLIND_REVIEW_ENABLED=true

# Optional: Allow admins to see evaluator identity for auditing
BLIND_REVIEW_ADMIN_AUDIT_ENABLED=true
```

## Implementation Checklist

1. **Migration**: Add `evaluatedUnderBlindReview` to Evaluation model; run `npx prisma migrate dev`
2. **Config module**: Create `src/lib/config/blind-review.ts` to resolve env vars
3. **Idea service**: Update `getIdeaForDetail` to compute `evaluatorDisplayName` based on role, blind-review config, and `evaluatedUnderBlindReview`
4. **Evaluation service**: When creating evaluation, set `evaluatedUnderBlindReview` from current config
5. **Idea detail page**: Ensure "Evaluated by {evaluatorDisplayName}" uses masked value (already sourced from idea-service)
6. **Stage transitions**: If comments with evaluator are displayed later, apply same masking

## Verification

1. **Blind review ON**: As submitter, view evaluated idea → see "Reviewed" (no evaluator name)
2. **Blind review ON, admin-audit ON**: As admin, view evaluated idea → see evaluator name
3. **Blind review OFF**: As submitter, view evaluated idea → see evaluator name (or "Administrator")
4. **FR-009**: Turn blind review OFF after evaluations; submitters must not see evaluator for evaluations done when it was ON

## Key Files

- `src/lib/config/blind-review.ts` — `getBlindReviewConfig()`, env var resolution
- `src/lib/utils/blind-review.ts` — `shouldMaskEvaluator()`, masking logic
- `src/lib/services/idea-service.ts` — `getIdeaForDetail`, evaluatorDisplayName masking
- `src/lib/services/evaluation-service.ts` — `evaluateIdea`, set evaluatedUnderBlindReview
- `src/app/ideas/[id]/page.tsx` — Idea detail display (uses masked evaluatorDisplayName)
- `prisma/schema.prisma` — Evaluation.evaluatedUnderBlindReview

## Implementation Notes

- **Env vars**: `BLIND_REVIEW_ENABLED`, `BLIND_REVIEW_ADMIN_AUDIT_ENABLED` (values `true` or `1` for enabled)
- **Migration**: `20260228113949_add_evaluated_under_blind_review` adds nullable `evaluatedUnderBlindReview` to Evaluation
- **Verification (FR-009)**: For evaluations with `evaluatedUnderBlindReview=true`, identity is always masked regardless of current config
