# API Contract: Extended Idea Responses (Rating)

**Feature**: 013-ideas-scoring  
**Scope**: Additive changes to idea list and idea detail data  
**Input**: specs/007-evaluation-workflow contracts (api-ideas-extended-responses.md)

---

## Overview

Idea list and idea detail responses are extended with `rating`, `ratingDisplay`, and optionally `ratingAssignedAt`. The app uses Server Components that call `getIdeasForUser` and `getIdeaForDetail` directly; no new API routes for list/detail. This contract documents the extended data shape.

---

## Idea List Item (Extended)

Add to each idea in list response:

| Field | Type | Description |
|-------|------|-------------|
| `rating` | number \| null | 1–5 when set; null = not yet rated |
| `ratingDisplay` | string | "4/5" or "Not yet rated" (computed) |

**Example**:
```json
{
  "id": "cm123abc4d5e6f7",
  "title": "Implement automated code review tool",
  "category": { "id": "cat_001", "name": "Process Improvement" },
  "submittedAt": "2026-02-25T14:30:00Z",
  "hasAttachment": true,
  "status": "SUBMITTED",
  "rating": 4,
  "ratingDisplay": "4/5"
}
```

---

## Idea Detail (Extended)

Add to idea detail response:

| Field | Type | Description |
|-------|------|-------------|
| `rating` | number \| null | 1–5 when set; null = not yet rated |
| `ratingDisplay` | string | "4/5" or "Not yet rated" |
| `ratingAssignedAt` | string \| null | ISO 8601 when rating set; null otherwise |

**Example** (rated idea):
```json
{
  "id": "cm123abc4d5e6f7",
  "title": "Implement automated code review tool",
  "status": "UNDER_REVIEW",
  "rating": 4,
  "ratingDisplay": "4/5",
  "ratingAssignedAt": "2026-02-28T15:00:00Z",
  "evaluation": null
}
```

---

## Idea List Query (Optional Sort/Filter)

For `GET /api/ideas` (or equivalent service call), evaluators and admins may pass:

| Param | Type | Description |
|-------|------|-------------|
| `sortBy` | string | "ratingDesc" \| "ratingAsc" \| (default) |
| `minRating` | number | Filter: only ideas with rating >= value (1–5) |

**Sort behavior**:
- `ratingDesc`: Highest first; ideas without rating at end
- `ratingAsc`: Lowest first; ideas without rating at end
- Default: `submittedAt` desc (unchanged)

**Filter behavior**:
- `minRating=4`: Exclude ideas with no rating or rating < 4
