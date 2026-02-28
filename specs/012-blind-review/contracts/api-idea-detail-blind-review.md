# API Contract: Idea Detail — Blind Review Behavior

**Feature**: 012-blind-review  
**Scope**: Additive changes to idea detail display (extends specs/007-evaluation-workflow/contracts/api-ideas-extended-responses.md)  
**Input**: spec.md, data-model.md

---

## Overview

When blind review is enabled, the idea detail response's `evaluation.evaluatorDisplayName` is masked for submitters and non-admin users. The app uses Server Components calling `getIdeaForDetail`; no new API routes. This contract documents the blind-review-specific behavior.

---

## Evaluation Display Rules

| Condition | evaluatorDisplayName Value |
|-----------|----------------------------|
| Blind review OFF | Real evaluator name or email, or "Administrator" if user deactivated |
| Blind review ON, submitter or evaluator | Generic label: "Reviewed" (no identity) |
| Blind review ON, admin, admin-audit OFF | Generic label: "Reviewed" |
| Blind review ON, admin, admin-audit ON | Real evaluator name or email |
| evaluation.evaluatedUnderBlindReview === true | Always "Reviewed" (even if blind review later disabled) |

---

## Idea Detail (Blind Review Additive)

**evaluation** (when present):

| Field | Type | Blind Review Additive |
|-------|------|------------------------|
| evaluatorDisplayName | string | Masked per rules above; never exposes identity to submitters/non-admin when masking applies |
| evaluatedUnderBlindReview | boolean \| null | New; true = always mask; false/null = use current config |

**Example** (evaluated idea, blind review on, submitter viewing):
```json
{
  "evaluation": {
    "decision": "REJECTED",
    "comments": "Needs more technical detail.",
    "evaluatedAt": "2026-02-28T15:00:00Z",
    "evaluatorDisplayName": "Reviewed"
  }
}
```

---

## Stage Transitions (Future)

When stage transition comments are displayed in the UI, they MUST NOT include evaluator attribution when blind review applies. No API contract change until stage-history API exists.
