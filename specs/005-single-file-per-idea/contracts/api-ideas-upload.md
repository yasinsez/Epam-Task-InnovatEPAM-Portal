# API Contract: Idea Submission with File Attachment (POST /api/ideas)

**Feature**: 005-single-file-per-idea  
**Endpoint**: `POST /api/ideas`  
**Authentication**: Required (NextAuth session)  
**Content-Type**: `multipart/form-data`  
**CORS**: Same-origin only

---

## Overview

The existing `POST /api/ideas` endpoint is extended to accept optional file attachments via `multipart/form-data`. When a file is included, it is validated (size ≤ 25 MB, type in PDF/DOCX/PNG/JPG/GIF), stored on the local filesystem, and an Attachment record is created and linked to the Idea.

---

## Request Schema

**Method**: POST  
**Path**: `/api/ideas`  
**Headers**:
```
Content-Type: multipart/form-data; boundary=<boundary>
Authorization: Bearer <session_token> (via NextAuth cookie)
```

**Body** (multipart/form-data fields):

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `title` | string | Yes | 5-100 chars, trim | Idea title |
| `description` | string | Yes | 20-2000 chars, trim | Idea description |
| `categoryId` | string | Yes | Non-empty, valid category | Category ID |
| `attachment` | File | No | Max 25 MB; PDF, DOCX, PNG, JPG, GIF | Optional file attachment |

### File Validation Rules

- **Max size**: 25 MB (26,214,400 bytes)
- **Allowed types**: PDF, DOCX, PNG, JPG, GIF
- **MIME mapping**: Validated against allowed extension→MIME map
- **Empty files**: Rejected with "File is empty" or "Please select a valid file"
- **Replace behavior**: If user selects a second file before submit, client replaces the first (only one file in form)

### Client-Side Pre-validation

- Check file size before upload
- Check file extension against allowed list
- Display clear errors: "File too large (max 25 MB)", "File type not supported. Accepted: PDF, DOCX, PNG, JPG, GIF"

---

## Response Schema

### Success Response (HTTP 201 Created)

**With attachment**:
```json
{
  "success": true,
  "message": "Your idea has been submitted successfully",
  "idea": {
    "id": "cm9lk4m2kd8f9g0",
    "title": "Implement AI-powered document processing",
    "description": "We should explore AI tools...",
    "categoryId": "cat_002",
    "category": { "id": "cat_002", "name": "Technology" },
    "userId": "user_456",
    "submittedAt": "2026-02-25T15:45:00Z",
    "createdAt": "2026-02-25T15:45:00Z",
    "attachment": {
      "id": "att_cm123xyz",
      "originalFileName": "design-mockup.png",
      "fileSizeBytes": 524288,
      "mimeType": "image/png"
    }
  }
}
```

**Without attachment** (unchanged from 004):
```json
{
  "success": true,
  "message": "Your idea has been submitted successfully",
  "idea": {
    "id": "cm9lk4m2kd8f9g0",
    "title": "...",
    "attachment": null
  }
}
```

### Error Response - File Validation (HTTP 400)

**File too large**:
```json
{
  "success": false,
  "error": "File is too large. Maximum size is 25 MB"
}
```

**Unsupported file type**:
```json
{
  "success": false,
  "error": "File type not supported. Accepted formats: PDF, DOCX, PNG, JPG, GIF"
}
```

**Empty file**:
```json
{
  "success": false,
  "error": "File is empty. Please select a valid file"
}
```

### Error Response - Other (HTTP 400, 401, 500)

Same as [api-ideas.md](../../004-idea-submission-form/contracts/api-ideas.md) for validation, category, auth, and server errors.

---

## Processing Order

1. Verify NextAuth session
2. Parse `formData()` from request
3. Extract and validate title, description, categoryId (existing validation)
4. Extract optional `attachment` file
5. If file present: validate size, type, non-empty
6. Verify category exists and is active
7. Sanitize title/description
8. Create Idea in database
9. If file present: write to filesystem, create Attachment, link to Idea
10. On any failure after step 8: delete Idea (rollback)
11. Return 201 with idea (including attachment metadata if present)

---

## Implementation Notes

- Use `request.formData()` to parse multipart body
- File field name: `attachment` (match form input `name="attachment"`)
- Store file with `attachment-service.saveAttachment(ideaId, file)`
- Transaction: Idea create → file write → Attachment create; rollback Idea on failure
