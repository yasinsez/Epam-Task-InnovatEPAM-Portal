# API Contract: Review Stages (Admin)

**Feature**: 011-multi-stage-review  
**Base Path**: `/api/admin/review-stages`  
**Authentication**: Required (NextAuth session)  
**Role**: Admin only (403 for evaluator/submitter)  
**CORS**: Same-origin only

---

## Overview

Review stages API allows admins to create, list, update, reorder, and delete stages that define the multi-stage review pipeline. Stages have a name, optional description, and display order. System-wide; one pipeline for all ideas.

---

## 1. List Stages

**Method**: GET  
**Path**: `/api/admin/review-stages`

Returns stages ordered by `displayOrder` (ascending).

### Success (200)

```json
{
  "success": true,
  "stages": [
    {
      "id": "clx...",
      "name": "Initial Screening",
      "description": "Quick triage of submitted ideas",
      "displayOrder": 0,
      "ideaCount": 3
    },
    {
      "id": "cly...",
      "name": "Technical Review",
      "description": null,
      "displayOrder": 1,
      "ideaCount": 1
    },
    {
      "id": "clz...",
      "name": "Final Decision",
      "description": null,
      "displayOrder": 2,
      "ideaCount": 0
    }
  ]
}
```

### Error Responses

- **401**: Unauthenticated
- **403**: Not admin

---

## 2. Create Stage

**Method**: POST  
**Path**: `/api/admin/review-stages`  
**Content-Type**: `application/json`

### Request Body

```json
{
  "name": "string (required, 1-100 chars)",
  "description": "string (optional, max 500 chars)",
  "displayOrder": "number (optional; defaults to max+1)"
}
```

### Validation

- `name`: Required, 1–100 chars
- `description`: Optional, max 500 chars
- `displayOrder`: Optional; if omitted, append to end (max existing + 1). If provided, insert at position (shift others)
- Max 20 stages total; reject with 400 if limit reached

### Success (201)

```json
{
  "success": true,
  "message": "Stage created",
  "stage": {
    "id": "clx...",
    "name": "Technical Review",
    "description": "Deep technical assessment",
    "displayOrder": 1,
    "createdAt": "2026-02-28T10:00:00Z"
  }
}
```

### Error Responses

- **400**: Validation failed (name empty, too long, or 20-stage limit)
- **401**: Unauthenticated
- **403**: Not admin

---

## 3. Update Stage

**Method**: PATCH  
**Path**: `/api/admin/review-stages/[stageId]`  
**Content-Type**: `application/json`

### Request Body

```json
{
  "name": "string (optional, 1-100 chars)",
  "description": "string (optional, max 500 chars)",
  "displayOrder": "number (optional; reorder)"
}
```

At least one field required.

### Success (200)

```json
{
  "success": true,
  "message": "Stage updated",
  "stage": {
    "id": "clx...",
    "name": "Updated Name",
    "description": "Updated description",
    "displayOrder": 1,
    "updatedAt": "2026-02-28T11:00:00Z"
  }
}
```

### Error Responses

- **400**: Validation failed
- **404**: Stage not found
- **401**: Unauthenticated
- **403**: Not admin

---

## 4. Delete Stage

**Method**: DELETE  
**Path**: `/api/admin/review-stages/[stageId]`

### Validation

- Cannot delete if one or more ideas have `currentStageId` = this stage
- Return 400 with message: "Cannot remove stage: N ideas are currently in this stage. Reassign them first."

### Success (200)

```json
{
  "success": true,
  "message": "Stage removed"
}
```

### Error Responses

- **400**: Stage has ideas; cannot delete
- **404**: Stage not found
- **401**: Unauthenticated
- **403**: Not admin

---

## 5. Reorder Stages

**Method**: PATCH (or dedicated POST if preferred)

Reordering can be done via `PATCH` on each stage with new `displayOrder`, or via a batch endpoint.

**Option A**: `PATCH /api/admin/review-stages/[stageId]` with `displayOrder` — admin updates one at a time.

**Option B**: `POST /api/admin/review-stages/reorder` with body:

```json
{
  "stageIds": ["id1", "id2", "id3"]
}
```

Stages are ordered by array position; displayOrder set to 0, 1, 2, ...

**Recommendation**: Option A for MVP; Option B can be added for bulk reorder UX.
