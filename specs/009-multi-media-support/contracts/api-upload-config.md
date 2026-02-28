# API Contract: Upload Configuration (Admin)

**Feature**: 009-multi-media-support  
**Endpoints**: `GET /api/admin/upload-config`, `PUT /api/admin/upload-config`  
**Authentication**: Required (NextAuth session, role: ADMIN)  
**Content-Type**: `application/json`  
**CORS**: Same-origin only

---

## Overview

Allows admins to view and edit upload configuration: allowed file types, per-file size limit, total size limit per idea, and maximum file count. Changes apply prospectively to new uploads only.

---

## GET /api/admin/upload-config

### Request

**Method**: GET  
**Path**: `/api/admin/upload-config`  
**Headers**: Authorization via NextAuth cookie

### Response (HTTP 200)

```json
{
  "success": true,
  "config": {
    "maxFileCount": 10,
    "maxFileSizeBytes": 10485760,
    "maxTotalSizeBytes": 52428800,
    "allowedExtensions": [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".gif", ".xls", ".xlsx"],
    "mimeByExtension": {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  }
}
```

**404 - No config exists** (should not occur after seed): Return default config in code.

---

## PUT /api/admin/upload-config

### Request

**Method**: PUT  
**Path**: `/api/admin/upload-config`  
**Body**:
```json
{
  "maxFileCount": 10,
  "maxFileSizeBytes": 10485760,
  "maxTotalSizeBytes": 52428800,
  "allowedExtensions": [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".gif", ".xls", ".xlsx"],
  "mimeByExtension": {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  }
}
```

### Validation Rules (Zod)

| Field | Type | Validation |
|-------|------|------------|
| maxFileCount | number | Integer, 1–50 |
| maxFileSizeBytes | number | Integer, 1–100*1024*1024 (100 MB) |
| maxTotalSizeBytes | number | Integer, 1–500*1024*1024 (500 MB) |
| allowedExtensions | string[] | Non-empty, each element matches `^\.[a-z0-9]+$` |
| mimeByExtension | Record<string, string> | Keys must be in allowedExtensions; values valid MIME |

---

### Success (HTTP 200)

```json
{
  "success": true,
  "config": { ... }
}
```

### Error (HTTP 400)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": { ... }
}
```

### Error (HTTP 403)

```json
{
  "success": false,
  "error": "Admin access required"
}
```
