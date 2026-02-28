# Research: Smart Submission Forms

**Feature**: 001-smart-submission-forms  
**Date**: 2026-02-28  
**Status**: Completed

## 1. Storage for Dynamic Field Values

### Decision

Use a **JSONB column `dynamicFieldValues`** on the `Idea` model to store submitted dynamic field values. Each key is the `FormFieldDefinition.id` (cuid) at submission time; each value is the submitted value (string, number, boolean, string array, or ISO date string depending on field type).

### Rationale

- **Historical preservation**: When a field is removed from config, its values remain in the JSONB; we can still display them by key. No FK to a possibly-deleted definition.
- **Flexibility**: New field types or constraints don't require migrations for value storage.
- **Query simplicity**: Prisma supports JSON filters; list/detail reads fetch one row with values.
- **Spec alignment**: FR-004 requires config and submitted data separate; FR-006 requires historical values preserved when config changes.

### Alternatives Considered

- **Normalized IdeaFieldValue table**: FK to Idea + fieldDefinitionId. Rejected because removing a field would orphan references; we'd need soft-deletes or nullable FKs complicating queries.
- **Single JSON document for entire form config**: Rejected for config—we need relational structure for reorder, audit, and select options.

---

## 2. Form Configuration Storage

### Decision

**Normalized tables**: `FormConfiguration` (single active row) + `FormFieldDefinition` (one per field, FK to config). Use `displayOrder` integer for ordering.

### Rationale

- **Reordering**: Update `displayOrder` without rewriting whole document.
- **Audit**: FR-011 requires "who, when" — we need `FormConfiguration.updatedAt` and `FormConfiguration.updatedById` (or audit log entry).
- **Select options**: Store as JSON array in `FormFieldDefinition.options` (or `optionsJson`) — max 50 items per spec; JSON sufficient.
- **Single active config**: One row in `FormConfiguration` with `isActive = true`; admin edits replace that row's fields.

### Alternatives Considered

- **Single JSON document**: Simpler but harder to audit, reorder, and query individual fields.
- **Versioned configs**: Spec says last-write-wins, no rollback — single active config sufficient.

---

## 3. Runtime Validation (Zod) from Field Definitions

### Decision

Build a **factory function** `createSubmissionSchema(fieldDefinitions)` that returns a Zod schema. For each field definition:

- Map type → Zod primitive: `text` → `z.string()`, `longText` → `z.string()`, `number` → `z.number()`, `singleSelect`/`multiSelect` → `z.enum()` or `z.array(z.enum())`, `checkbox` → `z.boolean()`, `date` → `z.string().datetime()` or `z.coerce.date()`.
- Apply `.optional()` when `required === false`.
- Apply `.min()`/`.max()` from validation constraints when present.
- Optional fields may be `undefined` or empty string; normalize before DB write.

### Rationale

- Constitution requires Zod for API validation.
- Existing `SubmitIdeaSchema` validates fixed fields; we extend with dynamic schema merged via `.and()` or `z.object().extend()`.
- Keeps validation logic centralized and type-safe.

### Alternatives Considered

- **Manual validation per request**: Error-prone; Zod provides structured error formatting already used in `/api/ideas`.
- **JSON Schema + ajv**: Adds dependency; Zod is already in use and integrates with TypeScript.

---

## 4. Admin Form Configuration UI Pattern

### Decision

**Server-rendered admin page** with client components for drag-and-drop reorder (optional in Phase 1) or simple up/down buttons. Form fields rendered as controlled inputs; save triggers `POST /api/admin/form-config` replacing entire config.

### Rationale

- Spec: last-write-wins; no conflict detection. Full replace is simplest.
- Existing admin uses tabs (`AdminTabs`); add "Form Configuration" tab.
- React + Tailwind align with current stack.

### Alternatives Considered

- **Real-time collaboration**: Spec explicitly rejects; last-write-wins.
- **External form builder library**: Adds weight; requirements are modest (max 25 fields, 7 types).

---

## 5. Display of Dynamic Fields in List/Detail

### Decision

- **List**: Fetch `dynamicFieldValues` with idea; render each configured field's label + value. Truncate long values (e.g., 50 chars) with tooltip or ellipsis.
- **Detail**: Full values, no truncation. Use configured labels; for removed fields, show raw key or "Unknown field" if label missing.

### Rationale

- Spec: "All dynamic fields" in list row; truncate or wrap. Detail shows full values with labels.
- Historical: If field removed, value still in JSONB; we can show "Field X (no longer configured): value" or similar.

---

## 6. Audit Log for Form Config Changes

### Decision

Extend existing `AuthLog` pattern or add `FormConfigAudit` table with `userId`, `action` (e.g., "CONFIG_UPDATED"), `timestamp`. Minimal: who and when. No diff storage.

### Rationale

- Spec: "Basic audit log – Record who changed the config and when; no detailed diff history."
- Reuse existing audit infra if present; else minimal new table.

---

## Summary of Resolved Items

| Topic | Decision |
|-------|----------|
| Dynamic value storage | JSONB on Idea |
| Form config storage | FormConfiguration + FormFieldDefinition tables |
| Validation | Zod schema generated from field definitions |
| Admin UI | Server-rendered + client components, full replace on save |
| List/Detail display | List: truncate; Detail: full; historical values by key |
| Audit | Basic who/when log |
