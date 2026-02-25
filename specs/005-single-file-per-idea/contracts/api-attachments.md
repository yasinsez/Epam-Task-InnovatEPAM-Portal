# API Contract: Attachment Download (GET /api/ideas/[id]/attachment)

**Feature**: 005-single-file-per-idea  
**Endpoint**: `GET /api/ideas/:id/attachment`  
**Authentication**: Required (NextAuth session)  
**CORS**: Same-origin only

---

## Overview

Returns the file content of an idea's attachment. The user must have access to view the idea (per existing idea visibility rules). Response includes appropriate `Content-Type` and `Content-Disposition` headers for download/view.

---

## Request Schema

**Method**: GET  
**Path**: `/api/ideas/[id]/attachment`  
**Headers**:
```
Authorization: Bearer <session_token> (via NextAuth cookie)
```

**Path Parameters**:
- `id`: Idea ID (CUID)

---

## Response Schema

### Success Response (HTTP 200 OK)

**Headers**:
```
Content-Type: <mimeType from Attachment>
Content-Disposition: attachment; filename="<originalFileName>"
Content-Length: <fileSizeBytes>
Cache-Control: private, no-cache
```

**Body**: Raw file bytes (binary)

### Error Response - Idea Not Found (HTTP 404 Not Found)

```json
{
  "success": false,
  "error": "Idea not found"
}
```

### Error Response - No Attachment (HTTP 404 Not Found)

**When**: Idea exists but has no attachment

```json
{
  "success": false,
  "error": "This idea has no attachment"
}
```

### Error Response - Access Denied (HTTP 403 Forbidden)

**When**: User is not authorized to view the idea (e.g., idea belongs to another user and access rules restrict)

```json
{
  "success": false,
  "error": "Access denied"
}
```

### Error Response - Authentication Required (HTTP 401 Unauthorized)

```json
{
  "success": false,
  "error": "Authentication required"
}
```

### Error Response - Server Error (HTTP 500)

**When**: File not found on disk (orphan Attachment) or I/O error

```json
{
  "success": false,
  "error": "Failed to retrieve attachment"
}
```

---

## Processing Order

1. Verify NextAuth session
2. Parse idea `id` from URL
3. Fetch Idea with Attachment (include) from Prisma
4. If Idea not found → 404
5. If Idea has no Attachment → 404 "This idea has no attachment"
6. Check access: user can view this idea (same rules as idea detail view)
7. If access denied → 403
8. Resolve file path: `UPLOADS_BASE_PATH` + `Attachment.storedPath`
9. If file not found on disk → 500 (log error)
10. Stream file with correct headers
11. Return 200 with file body

---

## Access Control

- Follow existing idea visibility rules (e.g., submitter sees own ideas; evaluators/admins may see all)
- Attachment download MUST NOT bypass idea access checks
- Do not expose `storedPath` or filesystem paths to client

---

## Implementation Notes

- Use `NextResponse` with body stream; set `Content-Type` from `Attachment.mimeType`
- Set `Content-Disposition: attachment; filename="<originalFileName>"` — use `originalFileName` for display; ensure it's safe (no path chars)
- Consider `inline` vs `attachment` for images (e.g., PNG, JPG, GIF) — optional: use `inline` for images so they display in browser; `attachment` for PDF/DOCX to force download
