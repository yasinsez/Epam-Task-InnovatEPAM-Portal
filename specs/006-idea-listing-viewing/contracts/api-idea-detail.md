# API Contract: Idea Detail (GET /api/ideas/[id])

**Feature**: 006-idea-listing-viewing  
**Endpoint**: `GET /api/ideas/:id`  
**Authentication**: Required (NextAuth session)  
**CORS**: Same-origin only

---

## Overview

Returns full idea detail for an idea the user is allowed to view. Submitters see their own; evaluators and admins see all. For evaluators/admins, includes submitter display name (name or email).

---

## Request Schema

**Method**: GET  
**Path**: `/api/ideas/[id]`  
**Headers**:
```
Authorization: Bearer <session_token> (via NextAuth cookie)
```

**Path Parameters**:
- `id`: Idea ID (CUID)

---

## Response Schema

### Success Response (HTTP 200 OK)

**Submitter (owner)**:
```json
{
  "success": true,
  "idea": {
    "id": "cm123abc4d5e6f7",
    "title": "Implement automated code review tool",
    "description": "We should integrate an automated code review system...",
    "category": { "id": "cat_001", "name": "Process Improvement" },
    "submittedAt": "2026-02-25T14:30:00Z",
    "attachment": {
      "id": "att_cm123xyz",
      "originalFileName": "design-mockup.png",
      "fileSizeBytes": 524288,
      "mimeType": "image/png"
    }
  }
}
```

**Evaluator/Admin** (includes submitter):
```json
{
  "success": true,
  "idea": {
    "id": "cm123abc4d5e6f7",
    "title": "Implement automated code review tool",
    "description": "We should integrate an automated code review system...",
    "category": { "id": "cat_001", "name": "Process Improvement" },
    "submittedAt": "2026-02-25T14:30:00Z",
    "submitter": "Jane Smith",
    "attachment": {
      "id": "att_cm123xyz",
      "originalFileName": "design-mockup.png",
      "fileSizeBytes": 524288,
      "mimeType": "image/png"
    }
  }
}
```

- `submitter`: `user.name || user.email`; only present for evaluators/admins
- `attachment`: Omitted or null when idea has no attachment

---

## Error Responses

### HTTP 404 Not Found

```json
{
  "success": false,
  "error": "Idea not found"
}
```

### HTTP 403 Forbidden (access denied)

```json
{
  "success": false,
  "error": "Access denied"
}
```

### HTTP 401 Unauthorized

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

## Access Control

- Owner (idea.userId === sessionUserId): Full access
- Evaluator/Admin: Full access to all ideas
- Other submitters: 403

---

## Note on Server Components

The app currently uses a Server Component for `/ideas/[id]/page.tsx` that fetches directly via Prisma. The GET API route is optional if the page uses server-side data fetching. This contract documents the **logical** contract for idea detail data; implementation may use either API route or direct Prisma in Server Components.
