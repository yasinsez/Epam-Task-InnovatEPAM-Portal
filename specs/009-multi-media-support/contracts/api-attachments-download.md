# API Contract: Attachment Download (GET /api/ideas/[id]/attachments/[attachmentId])

**Feature**: 009-multi-media-support  
**Endpoint**: `GET /api/ideas/:id/attachments/:attachmentId`  
**Authentication**: Required (NextAuth session)  
**CORS**: Same-origin only

---

## Overview

Returns the file content of a specific attachment. Access control: idea owner, evaluator, or admin only. For image types, `Content-Disposition: inline` allows inline display; others use `attachment` for download.

---

## Request Schema

**Method**: GET  
**Path**: `/api/ideas/:id/attachments/:attachmentId`  
**Params**:
- `id`: Idea ID (cuid)
- `attachmentId`: Attachment ID (cuid)

---

## Response Schema

### Success (HTTP 200)

**Headers**:
```
Content-Type: <attachment.mimeType>
Content-Disposition: inline; filename="<sanitized>" | attachment; filename="<sanitized>"
Content-Length: <fileSizeBytes>
Cache-Control: private, no-cache
```

**Body**: Raw file bytes (binary)

**Content-Disposition**:
- Images (mimeType starts with `image/`): `inline` for preview
- Others: `attachment` for download

**Filename sanitization**: Replace `[^\w.-]` with `_`

---

## Error Responses

**404 - Idea not found**:
```json
{
  "success": false,
  "error": "Idea not found"
}
```

**404 - Attachment not found or not linked to idea**:
```json
{
  "success": false,
  "error": "Attachment not found"
}
```

**403 - Access denied**:
```json
{
  "success": false,
  "error": "Access denied"
}
```

**404 - File unavailable (missing on disk)**:
```json
{
  "success": false,
  "error": "Attachment unavailable"
}
```

---

## Legacy Route (Backward Compatibility)

`GET /api/ideas/:id/attachment` (no attachmentId) remains supported for ideas with exactly one attachment. If idea has multiple attachments, returns 404 with "This idea has multiple attachments; use /attachments/:attachmentId".
