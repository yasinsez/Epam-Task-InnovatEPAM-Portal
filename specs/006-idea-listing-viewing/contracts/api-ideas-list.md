# API Contract: Idea List (GET /api/ideas)

**Feature**: 006-idea-listing-viewing  
**Endpoint**: `GET /api/ideas`  
**Authentication**: Required (NextAuth session)  
**CORS**: Same-origin only

---

## Overview

Returns a paginated list of ideas visible to the authenticated user. Submitters see only their own ideas; evaluators and admins see all submitted ideas. Supports optional category filter and pagination parameters.

---

## Request Schema

**Method**: GET  
**Path**: `/api/ideas`  
**Headers**:
```
Authorization: Bearer <session_token> (via NextAuth cookie)
```

**Query Parameters**:

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|--------------|
| `page` | number | No | 1 | 1-based page number; normalized if out of range |
| `pageSize` | number | No | 15 | Items per page (1–100) |
| `categoryId` | string | No | - | Filter by category ID; omit for all |

---

## Response Schema

### Success Response (HTTP 200 OK)

```json
{
  "success": true,
  "ideas": [
    {
      "id": "cm123abc4d5e6f7",
      "title": "Implement automated code review tool",
      "category": { "id": "cat_001", "name": "Process Improvement" },
      "submittedAt": "2026-02-25T14:30:00Z",
      "hasAttachment": true
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 15,
    "totalCount": 42,
    "totalPages": 3
  }
}
```

### Pagination Metadata

| Field | Type | Description |
|-------|------|-------------|
| `page` | number | Current page (1-based) |
| `pageSize` | number | Items per page |
| `totalCount` | number | Total ideas matching filter |
| `totalPages` | number | Total number of pages |

### Idea List Item

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Idea ID (CUID) |
| `title` | string | Idea title |
| `category` | object | `{ id, name }` |
| `submittedAt` | string | ISO 8601 date |
| `hasAttachment` | boolean | Whether idea has attachment |

---

## Error Responses

### HTTP 401 Unauthorized

```json
{
  "success": false,
  "error": "Authentication required"
}
```

### HTTP 400 Bad Request (invalid params)

When `page` or `pageSize` fail validation (e.g., negative, non-integer):

```json
{
  "success": false,
  "error": "Invalid pagination parameters"
}
```

### HTTP 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to load ideas"
}
```

---

## Processing Order

1. Verify NextAuth session
2. Resolve user role via `getUserRole(userId)`
3. Build `where` clause: submitter → `{ userId }`; evaluator/admin → `{}`
4. If `categoryId` present: add `{ categoryId }` to where (optionally validate category exists)
5. Parse and validate `page`, `pageSize`; normalize page if out of range
6. Execute `findMany` with `orderBy: { submittedAt: 'desc' }`, `skip`, `take`
7. Execute `count` for totalCount
8. Return 200 with ideas and pagination

---

## Page Normalization

- `page` < 1 → use 1
- `page` > totalPages → use totalPages
- Non-integer or NaN → use 1

---

## Access Control

- Submitter: `where: { userId }`
- Evaluator/Admin: `where: {}` (all submitted ideas; no status filter in MVP)
