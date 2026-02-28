# API Contract: Idea Submission with Multiple Attachments (POST /api/ideas)

**Feature**: 009-multi-media-support  
**Endpoint**: `POST /api/ideas`  
**Authentication**: Required (NextAuth session)  
**Content-Type**: `multipart/form-data`  
**CORS**: Same-origin only  
**Extends**: [api-ideas-upload.md](../../005-single-file-per-idea/contracts/api-ideas-upload.md)

---

## Overview

The `POST /api/ideas` endpoint accepts multiple file attachments via `multipart/form-data`. Attachments are validated against admin-configured limits (file count, per-file size, total size) and allowed types. All validation rules apply prospectively; config is fetched at request time.

---

## Request Schema

**Method**: POST  
**Path**: `/api/ideas`  
**Headers**:
```
Content-Type: multipart/form-data; boundary=<boundary>
```

**Body** (multipart/form-data fields):

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `title` | string | Yes | 5-100 chars, trim | Idea title |
| `description` | string | Yes | 20-2000 chars, trim | Idea description |
| `categoryId` | string | Yes | Non-empty, valid category | Category ID |
| `attachment` | File | No | Per config | Single file (legacy client) |
| `attachments` | File[] | No | Per config | Multiple files (use `attachments[]` or repeated `attachments` field) |

**File field handling**: Client MAY send either `attachment` (single) or `attachments` (multiple). Server normalizes to array; legacy single `attachment` is supported for backward compat.

---

## Validation Rules (Config-Driven)

Fetched from `UploadConfiguration` at request time:
- **maxFileCount**: Maximum attachments per idea (default 10)
- **maxFileSizeBytes**: Per-file limit (default 10 MB)
- **maxTotalSizeBytes**: Total size limit per idea (default 50 MB)
- **allowedExtensions**: e.g. `[".pdf",".doc",".docx",".png",".jpg",".jpeg",".gif",".xls",".xlsx"]`
- **mimeByExtension**: Map `{ ".pdf": "application/pdf", ... }`

Per FR-004: Both extension and MIME (Content-Type from upload) must match the allowed mapping.

---

## Validation Error Responses (HTTP 400)

**File count exceeded**:
```json
{
  "success": false,
  "error": "Maximum file count exceeded. Maximum is 10 files per idea"
}
```

**Per-file size exceeded**:
```json
{
  "success": false,
  "error": "File 'filename.pdf' exceeds the per-file size limit (max 10 MB)"
}
```

**Total size exceeded**:
```json
{
  "success": false,
  "error": "Total attachment size exceeds 50 MB limit"
}
```

**File type not allowed**:
```json
{
  "success": false,
  "error": "File type not allowed. Accepted formats: PDF, DOC, DOCX, PNG, JPG, GIF, XLS, XLSX"
}
```

**Extension/MIME mismatch**:
```json
{
  "success": false,
  "error": "File type validation failed: extension and MIME type must match allowed mapping"
}
```

---

## Success Response (HTTP 201)

```json
{
  "success": true,
  "message": "Your idea has been submitted successfully",
  "idea": {
    "id": "cm9lk4m2kd8f9g0",
    "title": "Implement AI-powered document processing",
    "categoryId": "cat_002",
    "category": { "id": "cat_002", "name": "Technology" },
    "userId": "user_456",
    "submittedAt": "2026-02-28T15:45:00Z",
    "attachments": [
      {
        "id": "att_001",
        "originalFileName": "design-mockup.png",
        "fileSizeBytes": 524288,
        "mimeType": "image/png"
      },
      {
        "id": "att_002",
        "originalFileName": "summary.docx",
        "fileSizeBytes": 204800,
        "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      }
    ]
  }
}
```

**Without attachments**:
```json
{
  "success": true,
  "idea": {
    "id": "...",
    "attachments": []
  }
}
```

---

## Processing Order

1. Verify NextAuth session
2. Fetch active UploadConfiguration
3. Parse formData
4. Extract title, description, categoryId (existing validation)
5. Extract `attachment` and/or `attachments` into normalized File array
6. Validate count ≤ maxFileCount
7. For each file: validate size, extension, MIME
8. Validate total size ≤ maxTotalSizeBytes
9. Create Idea, then each attachment (file write + Attachment record)
10. On failure after Idea create: delete Idea and any partial files
11. Return 201 with idea and attachments array
