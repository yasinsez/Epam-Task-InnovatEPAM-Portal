# API Contract: Assign Rating (POST /api/ideas/[id]/assign-rating)

**Feature**: 013-ideas-scoring  
**Endpoint**: `POST /api/ideas/:id/assign-rating`  
**Authentication**: Required (NextAuth session)  
**Authorization**: Admin or Evaluator only  
**CORS**: Same-origin only

---

## Overview

Allows an admin or evaluator to assign or update a 1–5 rating on an idea. Rating can be set before or during evaluation. Rating updates are blocked once the idea is accepted or rejected (status ACCEPTED or REJECTED).

---

## Request Schema

**Method**: POST  
**Path**: `/api/ideas/[id]/assign-rating`  
**Headers**:
```
Content-Type: application/json
Authorization: Bearer <session_token> (via NextAuth cookie)
```

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `id` | string | Idea ID (CUID) |

**Body** (JSON):
```json
{
  "rating": 4
}
```

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `rating` | number | Yes | 1–5 integer | Numeric score for the idea |

---

## Response Schema

### Success Response (HTTP 200 OK)

```json
{
  "success": true,
  "idea": {
    "id": "cm123abc4d5e6f7",
    "rating": 4,
    "ratingDisplay": "4/5",
    "ratingAssignedAt": "2026-02-28T15:00:00Z"
  }
}
```

---

## Error Responses

### HTTP 400 Bad Request (validation error)

- Missing or invalid `rating`
- `rating` outside 1–5 range

```json
{
  "success": false,
  "error": "Rating must be between 1 and 5"
}
```

### HTTP 401 Unauthorized

```json
{
  "success": false,
  "error": "Authentication required"
}
```

### HTTP 403 Forbidden (role check)

```json
{
  "success": false,
  "error": "Forbidden"
}
```

### HTTP 404 Not Found (idea not found or access denied)

```json
{
  "success": false,
  "error": "Idea not found"
}
```

### HTTP 409 Conflict (idea already accepted/rejected)

When the idea status is ACCEPTED or REJECTED, rating changes are not allowed:

```json
{
  "success": false,
  "error": "Rating cannot be changed after idea has been accepted or rejected"
}
```

### HTTP 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to assign rating"
}
```

---

## Processing Order

1. Verify NextAuth session → 401 if missing
2. Resolve user role → 403 if not admin or evaluator
3. Fetch idea by id; check access (evaluator, admin) → 404 if not found/denied
4. Verify idea status is SUBMITTED or UNDER_REVIEW → 409 if ACCEPTED or REJECTED
5. Parse and validate body (Zod: rating 1–5 integer) → 400 if invalid
6. Update Idea: set rating, ratingEvaluatorId, ratingAssignedAt
7. Return 200 with updated idea rating fields

---

## Access Control

- **Admin / Evaluator**: Can assign rating
- **Submitter**: 403 (cannot rate ideas)
- **Unauthenticated**: 401
