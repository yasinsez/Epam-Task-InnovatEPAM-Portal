# API Contract: Drafts

**Feature**: 010-draft-management  
**Base Path**: `/api/drafts`  
**Authentication**: Required (NextAuth session)  
**Role**: Submitter only (403 for evaluator/admin)  
**CORS**: Same-origin only

---

## Overview

Drafts API allows submitters to create, list, get, update, and discard idea drafts. Drafts are in-progress submissions; they are converted to submitted ideas via the submit endpoint.

---

## 1. List Drafts

**Method**: GET  
**Path**: `/api/drafts`  
**Query**: `page`, `pageSize` (optional; default page=1, pageSize=15)

### Success (200)

```json
{
  "success": true,
  "drafts": [
    {
      "id": "clx...",
      "title": "Untitled draft",
      "updatedAt": "2026-02-28T10:30:00Z",
      "createdAt": "2026-02-28T09:00:00Z",
      "attachmentCount": 2
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 15,
    "totalCount": 3,
    "totalPages": 1
  }
}
```

### Error Responses

- **401**: Unauthenticated
- **403**: User is evaluator or admin (drafts are submitter-only)

---

## 2. Create Draft

**Method**: POST  
**Path**: `/api/drafts`  
**Content-Type**: `application/json` or `multipart/form-data` (when attachments)

### Request Body (JSON)

Relaxed validation (partial data allowed):

```json
{
  "title": "string (optional, default 'Untitled draft')",
  "description": "string (optional, default '')",
  "categoryId": "string (optional, null allowed)",
  "dynamicFieldValues": "object (optional)"
}
```

### Request Body (Multipart)

- `title`, `description`, `categoryId` as form fields
- `dynamicFieldValues` as JSON string
- `attachments` or `attachments[]` for files (same as ideas API)

### Validation (Create)

- **Not validated**: required-field rules (title length, description length, categoryId)
- **Validated**: attachment count/size/types per UploadConfig; max 10 drafts per user

### Success (201)

```json
{
  "success": true,
  "message": "Draft saved",
  "draft": {
    "id": "clx...",
    "title": "Untitled draft",
    "description": "",
    "categoryId": null,
    "dynamicFieldValues": {},
    "status": "DRAFT",
    "createdAt": "2026-02-28T10:00:00Z",
    "updatedAt": "2026-02-28T10:00:00Z",
    "attachments": []
  }
}
```

### Error Responses

- **400**: Draft limit reached (10 per user), or attachment validation failed
- **401**: Unauthenticated
- **403**: Not submitter

---

## 3. Get Draft

**Method**: GET  
**Path**: `/api/drafts/[id]`

### Success (200)

```json
{
  "success": true,
  "draft": {
    "id": "clx...",
    "title": "My draft idea",
    "description": "Work in progress...",
    "categoryId": "cat_001",
    "category": { "id": "cat_001", "name": "Process Improvement" },
    "dynamicFieldValues": { "field_1": "value" },
    "status": "DRAFT",
    "createdAt": "2026-02-28T09:00:00Z",
    "updatedAt": "2026-02-28T10:30:00Z",
    "attachments": [
      { "id": "att_1", "originalFileName": "diagram.pdf", "fileSizeBytes": 1024, "mimeType": "application/pdf" }
    ]
  }
}
```

### Error Responses

- **404**: Draft not found or not owner
- **401**: Unauthenticated
- **403**: Not submitter

---

## 4. Update Draft

**Method**: PATCH  
**Path**: `/api/drafts/[id]`  
**Content-Type**: `application/json` or `multipart/form-data`

Same payload shape as create. Last-save-wins; no conflict detection.

### Success (200)

```json
{
  "success": true,
  "message": "Draft updated",
  "draft": { ... }
}
```

### Error Responses

- **400**: Attachment validation failed
- **404**: Draft not found or not owner
- **401**: Unauthenticated
- **403**: Not submitter

---

## 5. Discard Draft

**Method**: DELETE  
**Path**: `/api/drafts/[id]`

Permanently removes draft and its attachments (filesystem cleanup).

### Success (200)

```json
{
  "success": true,
  "message": "Draft discarded"
}
```

### Error Responses

- **404**: Draft not found or not owner
- **401**: Unauthenticated
- **403**: Not submitter

---

## 6. Submit Draft

**Method**: POST  
**Path**: `/api/drafts/[id]/submit`  
**Content-Type**: `application/json` (optional body for any final edits; can omit to submit as-is)

Converts draft to submitted idea. Full validation (title, description, category, dynamic fields) applied. If valid, updates idea: status→SUBMITTED, submittedAt→now.

### Success (200)

```json
{
  "success": true,
  "message": "Idea submitted successfully",
  "idea": {
    "id": "clx...",
    "title": "My idea",
    "status": "SUBMITTED",
    "submittedAt": "2026-02-28T11:00:00Z",
    ...
  }
}
```

### Error Responses

- **400**: Validation failed (required fields, attachments); `details` object with field-level errors
- **404**: Draft not found or not owner
- **401**: Unauthenticated
- **403**: Not submitter
