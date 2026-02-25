# API Contract: Evaluate Idea (POST /api/ideas/[id]/evaluate)

**Feature**: 007-evaluation-workflow  
**Endpoint**: `POST /api/ideas/:id/evaluate`  
**Authentication**: Required (NextAuth session)  
**Authorization**: Admin or Evaluator only  
**CORS**: Same-origin only

---

## Overview

Allows an admin or evaluator to accept or reject an idea with required comments. Updates idea status to ACCEPTED or REJECTED and creates an Evaluation record. Enforces first-wins concurrency: if another admin has already evaluated the idea, returns 409 Conflict.

---

## Request Schema

**Method**: POST  
**Path**: `/api/ideas/[id]`  
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
  "decision": "ACCEPTED",
  "comments": "This idea aligns well with our innovation goals. We will schedule a follow-up discussion."
}
```

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `decision` | string | Yes | "ACCEPTED" \| "REJECTED" | Evaluation outcome |
| `comments` | string | Yes | 1–2000 chars, non-empty | Explanation for the decision |

---

## Response Schema

### Success Response (HTTP 200 OK)

```json
{
  "success": true,
  "idea": {
    "id": "cm123abc4d5e6f7",
    "status": "ACCEPTED",
    "evaluation": {
      "decision": "ACCEPTED",
      "comments": "This idea aligns well with our innovation goals.",
      "evaluatedAt": "2026-02-25T15:00:00Z",
      "evaluatorDisplayName": "Admin User"
    }
  }
}
```

---

## Error Responses

### HTTP 400 Bad Request (validation error)

- Missing or invalid `decision`
- Missing or empty `comments`
- `comments` exceeds 2000 characters

```json
{
  "success": false,
  "error": "Comments are required and must be between 1 and 2000 characters"
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

### HTTP 409 Conflict (already evaluated)

When the idea has already been accepted or rejected by another admin:

```json
{
  "success": false,
  "error": "This idea has already been evaluated"
}
```

### HTTP 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to evaluate idea"
}
```

---

## Processing Order

1. Verify NextAuth session → 401 if missing
2. Resolve user role → 403 if not admin or evaluator
3. Fetch idea by id; check access (owner, evaluator, admin) → 404 if not found/denied
4. Verify idea status is SUBMITTED or UNDER_REVIEW → 409 if ACCEPTED or REJECTED
5. Parse and validate body (Zod: decision enum, comments 1–2000) → 400 if invalid
6. In transaction: create Evaluation; update Idea.status
7. If concurrent update (another tx already evaluated) → 409
8. Return 200 with updated idea and evaluation

---

## Access Control

- **Admin / Evaluator**: Can evaluate
- **Submitter**: 403 (cannot evaluate own or others’ ideas)
- **Unauthenticated**: 401
