# API Contract: Form Configuration (Admin)

**Feature**: 001-smart-submission-forms  
**Endpoints**: `GET /api/admin/form-config`, `PUT /api/admin/form-config`  
**Authentication**: Required (NextAuth session, admin role)  
**CORS**: Same-origin only

---

## Overview

Admins manage the submission form field definitions via this API. One active configuration exists; PUT replaces the entire config (last-write-wins).

---

## GET /api/admin/form-config

Returns the current form configuration with all field definitions, ordered by `displayOrder`.

### Request

**Method**: GET  
**Path**: `/api/admin/form-config`  
**Headers**: NextAuth session cookie

### Response (HTTP 200 OK)

```json
{
  "success": true,
  "formConfig": {
    "id": "cfg_abc123",
    "updatedAt": "2026-02-28T10:00:00.000Z",
    "updatedById": "user_456",
    "fields": [
      {
        "id": "fld_def456",
        "label": "Department",
        "fieldType": "SINGLE_SELECT",
        "required": true,
        "displayOrder": 0,
        "options": ["Engineering", "Product", "Operations"],
        "minValue": null,
        "maxValue": null,
        "maxLength": null
      },
      {
        "id": "fld_ghi789",
        "label": "Estimated Impact",
        "fieldType": "NUMBER",
        "required": false,
        "displayOrder": 1,
        "options": null,
        "minValue": 0,
        "maxValue": 10,
        "maxLength": null
      }
    ]
  }
}
```

### Field Definition Shape

| Field | Type | Description |
|-------|------|-------------|
| id | string | CUID; used as key in Idea.dynamicFieldValues |
| label | string | Display label (1–100 chars) |
| fieldType | enum | TEXT, LONG_TEXT, NUMBER, SINGLE_SELECT, MULTI_SELECT, CHECKBOX, DATE |
| required | boolean | Whether field is required |
| displayOrder | number | Sort order (lower = earlier) |
| options | string[] \| null | For SINGLE_SELECT, MULTI_SELECT; max 50 items |
| minValue | number \| null | For NUMBER |
| maxValue | number \| null | For NUMBER |
| maxLength | number \| null | For TEXT, LONG_TEXT |

### Empty Config (HTTP 200 OK)

When no dynamic fields configured:

```json
{
  "success": true,
  "formConfig": {
    "id": "cfg_abc123",
    "updatedAt": "2026-02-28T10:00:00.000Z",
    "updatedById": null,
    "fields": []
  }
}
```

### Error Responses

**401 Unauthorized**: No session  
**403 Forbidden**: User is not admin  
**500 Internal Server Error**: Database or server error

---

## PUT /api/admin/form-config

Replaces the entire form configuration. Last-write-wins; no conflict detection.

### Request

**Method**: PUT  
**Path**: `/api/admin/form-config`  
**Content-Type**: `application/json`

**Body**:
```json
{
  "fields": [
    {
      "label": "Department",
      "fieldType": "SINGLE_SELECT",
      "required": true,
      "displayOrder": 0,
      "options": ["Engineering", "Product"]
    },
    {
      "label": "Impact Score",
      "fieldType": "NUMBER",
      "required": false,
      "displayOrder": 1,
      "minValue": 1,
      "maxValue": 5
    }
  ]
}
```

### Field Input (no `id` for new; `id` for edit if supporting partial update)

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| label | string | Yes | 1–100 chars |
| fieldType | enum | Yes | See above |
| required | boolean | No | default false |
| displayOrder | number | No | default 0 |
| options | string[] | For select types | max 50 items |
| minValue | number | No | For NUMBER |
| maxValue | number | No | For NUMBER; min ≤ max |
| maxLength | number | No | For text types; default 10000 for LONG_TEXT |

### Response (HTTP 200 OK)

```json
{
  "success": true,
  "message": "Form configuration updated",
  "formConfig": { /* same shape as GET */ }
}
```

### Error Responses

**400 Bad Request** — Validation errors:
```json
{
  "success": false,
  "details": {
    "fields[0].label": ["Label must be 1–100 characters"],
    "fields[1].options": ["Options required for SINGLE_SELECT"]
  }
}
```

**401/403/500**: Same as GET

---

## Access Control

- Only users with role `ADMIN` may call these endpoints.
- Submitters and evaluators receive 403.
