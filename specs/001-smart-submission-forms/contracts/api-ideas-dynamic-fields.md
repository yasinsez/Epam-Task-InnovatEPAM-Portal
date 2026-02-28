# API Contract: Idea Submission & Listing (Dynamic Fields Extension)

**Feature**: 001-smart-submission-forms  
**Endpoints**: `POST /api/ideas`, `GET /api/ideas`, `GET /api/ideas/[id]`  
**Extends**: Existing contracts (004, 006, 007)

---

## POST /api/ideas (Extended)

### Request Body (Extended)

In addition to `title`, `description`, `categoryId`, `attachment`:

**Dynamic fields** (when form config has fields):

```json
{
  "title": "Improve Code Review",
  "description": "Add automated checks...",
  "categoryId": "cat_001",
  "dynamicFieldValues": {
    "fld_def456": "Engineering",
    "fld_ghi789": 4
  }
}
```

`dynamicFieldValues` is an object: key = FormFieldDefinition.id, value = type-appropriate value:
- TEXT, LONG_TEXT: string
- NUMBER: number
- CHECKBOX: boolean
- SINGLE_SELECT: string (one option)
- MULTI_SELECT: string[] (array of option strings)
- DATE: ISO 8601 date string

### Validation

- Required dynamic fields must be present and non-empty.
- Type must match (number for NUMBER, etc.).
- SINGLE_SELECT value must be in options; MULTI_SELECT values must be subsets of options.
- min/max, maxLength enforced per field definition.
- Unknown field IDs (not in current config) are ignored.
- Values for removed fields are discarded.

### Response (201) — Extended

```json
{
  "success": true,
  "message": "Your idea has been submitted successfully",
  "idea": {
    "id": "idea_123",
    "title": "...",
    "description": "...",
    "categoryId": "...",
    "category": { "id": "...", "name": "..." },
    "userId": "...",
    "status": "SUBMITTED",
    "submittedAt": "...",
    "attachment": { ... },
    "dynamicFieldValues": {
      "fld_def456": "Engineering",
      "fld_ghi789": 4
    }
  }
}
```

### Multipart Form-Data (with attachment)

When `Content-Type: multipart/form-data`, dynamic fields sent as:

- `dynamicFieldValues` — JSON string of the object, or
- Individual keys: `dynamicFieldValues[fld_def456]=Engineering`, etc. (implementation-dependent)

Server must parse and merge with fixed fields before validation.

---

## GET /api/ideas (Extended)

### Response — Idea List Item (Extended)

Each idea in `ideas` array may include `dynamicFieldValues`:

```json
{
  "id": "idea_123",
  "title": "...",
  "category": { "id": "...", "name": "..." },
  "submittedAt": "...",
  "hasAttachment": true,
  "dynamicFieldValues": {
    "fld_def456": "Engineering",
    "fld_ghi789": 4
  }
}
```

- Values truncated in list view per UI (e.g., 50 chars for long text).
- Historical fields (no longer in config): include in object; UI may show key or "Unknown field".

---

## GET /api/ideas/[id] (Extended)

### Response — Idea Detail (Extended)

```json
{
  "success": true,
  "idea": {
    "id": "...",
    "title": "...",
    "description": "...",
    "category": { ... },
    "submittedAt": "...",
    "status": "...",
    "attachment": { ... },
    "evaluation": { ... },
    "dynamicFieldValues": {
      "fld_def456": "Engineering",
      "fld_ghi789": 4
    }
  },
  "dynamicFieldLabels": {
    "fld_def456": "Department",
    "fld_ghi789": "Estimated Impact"
  }
}
```

`dynamicFieldLabels`: Map of fieldId → label from current config. For historical fields no longer in config, omit or use `"Unknown field"` / raw key.

---

## Error Handling

### 400 Validation — Dynamic Fields

```json
{
  "success": false,
  "details": {
    "dynamicFieldValues.fld_def456": ["Department is required"],
    "dynamicFieldValues.fld_ghi789": ["Must be between 0 and 10"]
  }
}
```

Validation errors mirror existing field-level format.
