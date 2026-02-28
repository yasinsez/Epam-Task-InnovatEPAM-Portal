# Data Model: Smart Submission Forms

**Feature**: 001-smart-submission-forms  
**Date**: 2026-02-28

## Overview

This feature extends the existing Idea submission system with configurable dynamic fields. The data model adds form configuration entities and extends the Idea model to store dynamic field values.

## Entity Relationship Summary

```
FormConfiguration (1) ----< FormFieldDefinition (many)
       |
       +-- updatedBy -> User (optional)

Idea (existing) --[dynamicFieldValues JSONB]--> keyed by FormFieldDefinition.id
```

## Entities

### FormConfiguration

The single active submission form configuration. One active row at a time.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | cuid | PK | Unique identifier |
| updatedAt | DateTime | required | Last modification timestamp |
| updatedById | String? | FK → User.id, nullable | Admin who last updated (for audit) |

**Relations**: `formFieldDefinitions` (1:N), `updatedBy` (N:1 User, optional)

**Business Rules**:
- Only one FormConfiguration row is semantically "active"; use `isActive` boolean or convention (e.g., single row). Recommendation: single row, no `isActive` needed for Phase 1.
- On save, replace all FormFieldDefinitions for this config (delete + insert or upsert).

---

### FormFieldDefinition

A single configurable field in the submission form. Belongs to FormConfiguration.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | cuid | PK | Unique identifier; used as key in Idea.dynamicFieldValues |
| formConfigurationId | String | FK → FormConfiguration.id | Parent config |
| label | String | 1–100 chars | Display label |
| fieldType | Enum | See below | Data type |
| required | Boolean | default false | Whether field is required |
| displayOrder | Int | default 0 | Sort order (lower = earlier) |
| options | Json? | optional | For single-select, multi-select: array of option strings |
| minValue | Float? | optional | For number: min |
| maxValue | Float? | optional | For number: max |
| maxLength | Int? | optional | For text/longText: max characters |

**FieldType Enum**:
- `TEXT` — single-line text
- `LONG_TEXT` — multiline
- `NUMBER`
- `SINGLE_SELECT` — dropdown; `options` required
- `MULTI_SELECT` — checkboxes or multi-select; `options` required
- `CHECKBOX` — boolean
- `DATE` — date picker (stored as ISO string)

**Validation Rules**:
- `options` max 50 items (single/multi-select)
- `label` 1–100 chars
- `maxLength` default 10000 for LONG_TEXT if unspecified
- Number: if both min/max provided, min ≤ max
- Display order: unique per config optional; ties broken by id

**Relations**: `formConfiguration` (N:1)

---

### Idea (Extended)

Existing model; add one new column.

| New Field | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| dynamicFieldValues | Json? | optional | Map of fieldDefinitionId → value (string, number, boolean, string[], or ISO date string) |

**Storage Format** (JSONB):
```json
{
  "clx123abc": "Short text value",
  "clx456def": 42,
  "clx789ghi": ["opt1", "opt2"],
  "clx000jkl": true,
  "clx111mno": "2026-02-28T00:00:00.000Z"
}
```

Keys are FormFieldDefinition ids at submission time. Values match field type:
- TEXT, LONG_TEXT: string
- NUMBER: number
- CHECKBOX: boolean
- SINGLE_SELECT: string (one option)
- MULTI_SELECT: string[] (array of options)
- DATE: ISO 8601 date string

**Backward Compatibility**: Existing ideas have `dynamicFieldValues = null` or `{}`; they remain viewable (FR-008).

---

### FormConfigAudit (Optional)

Minimal audit log for config changes. Can be folded into existing AuthLog if metadata supports it.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | cuid | PK | |
| userId | String? | FK → User, nullable | Who made the change |
| action | String | e.g. "CONFIG_UPDATED" | Action type |
| timestamp | DateTime | default now() | When |

Alternatively: add `FormConfiguration.updatedById` + `updatedAt` and log to AuthLog with `action: "FORM_CONFIG_UPDATED"`, `metadata: { formConfigId }`.

---

## State Transitions

### Form Configuration

- **Initial**: Seed migration creates one FormConfiguration with zero FormFieldDefinitions → minimal default form (title, description, category only).
- **Admin edits**: Add/edit/remove/reorder FormFieldDefinitions; save replaces config. Last-write-wins.

### Idea Submission

- **Submit**: Validate fixed fields + dynamic fields against current FormConfiguration. Insert Idea with `dynamicFieldValues` JSON. Existing attachment flow unchanged.
- **Config change after submit**: No migration of existing ideas; historical values remain in JSONB, displayed by key. Removed fields: show value with "(no longer in form)" or similar if desired.

---

## Validation Summary

| Context | Rules |
|---------|-------|
| FormFieldDefinition | label 1–100; options ≤50; min ≤ max for number |
| Submission (client + server) | Required fields present; type match; constraints (min, max, maxLength, enum) |
| Display | Truncate in list; full in detail; handle missing config for historical keys |

---

## Migration Strategy

1. Add `FormConfiguration` and `FormFieldDefinition` tables.
2. Add `dynamicFieldValues Json?` to Idea.
3. Seed one FormConfiguration with no fields (minimal default).
4. Add `FormConfigAudit` or use AuthLog per research decision.
