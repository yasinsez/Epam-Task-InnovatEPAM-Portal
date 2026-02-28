# Research: Multi-Media Support

**Feature**: 009-multi-media-support | **Phase**: 0 | **Date**: 2026-02-28

All NEEDS CLARIFICATION items from Technical Context have been resolved via existing project constitution, codebase analysis, and spec clarifications.

---

## 1. Multi-File Upload UX (React/FormData)

**Decision**: Use single `<input type="file" multiple>` with controlled state array; FormData for multipart submit.

**Rationale**:
- Native `multiple` attribute supports multiple file selection in one action
- FormData already used for idea submission (`src/app/api/ideas/route.ts`); extend to `attachment[]` field
- No new dependency (e.g., react-dropzone); keeps bundle size down
- Existing `IdeaAttachmentInput` is single-file; replace with multi-file variant that maintains add/remove UX

**Alternatives considered**:
- react-dropzone: adds dependency; native input sufficient for v1
- Chunked/resumable uploads: out of scope; files under 10MB each

---

## 2. Extension + MIME Validation Implementation

**Decision**: Validate both file extension and `Content-Type` header (from `File.type`). Use extension→MIME mapping from DB config; reject if actual MIME does not match allowed mapping for that extension.

**Rationale**:
- Spec FR-004: "both must match the allowed mapping"
- Current implementation (`src/lib/validators.ts`, `attachment.ts`) already uses `MIME_BY_EXTENSION`; extend to config-driven mapping
- `File.type` is browser-declared; server trusts it for v1 (no magic-bytes sniffing per spec)

**Alternatives considered**:
- Magic bytes (file-type package): spec defers to extension+MIME; adds dependency
- Extension only: spec requires MIME check; rejected

---

## 3. Admin Upload Configuration Storage

**Decision**: New `UploadConfiguration` model (singleton or versioned row). Fields: `allowedExtensions`, `mimeByExtension` (JSON), `maxFileSizeBytes`, `maxTotalSizeBytes`, `maxFileCount`. Editable via admin API + admin UI page.

**Rationale**:
- Spec: "stored in database", "editable via admin settings/config page"
- FormConfiguration pattern exists; UploadConfiguration is simpler (single active config)
- JSON for `mimeByExtension` allows flexible extension→MIME mapping

**Alternatives considered**:
- Env vars: spec requires DB + admin UI; rejected
- Separate rows per setting: overkill; single config row sufficient

---

## 4. Attachment Model Migration (1:1 → 1:N)

**Decision**: Remove `ideaId` unique constraint from Attachment; add `displayOrder` (Int, default 0) for deterministic ordering. Migrate existing single attachment to new schema (one Attachment per idea that has attachment). Backward compat: ideas with single attachment remain viewable as-is.

**Rationale**:
- Current schema: `ideaId String @unique` enforces 1:1
- Migration: drop unique; existing data stays valid (each idea has 0 or 1 attachment)
- New submissions create multiple Attachment records per idea

**Alternatives considered**:
- New "Attachment2" model: migration complexity; rejected
- Keep 1:1 and add "Attachments" separate table: redundant; rejected

---

## 5. Download/View API for Multiple Attachments

**Decision**: New route `GET /api/ideas/[id]/attachments/[attachmentId]` for per-attachment download. Legacy `GET /api/ideas/[id]/attachment` retained for backward compat: if idea has exactly one attachment, redirect or serve it; otherwise 404.

**Rationale**:
- Each attachment has its own URL for download/open
- Legacy route keeps old links/bookmarks working for single-file ideas
- Access control (owner/evaluator/admin) unchanged

**Alternatives considered**:
- Single route with query param `?attachmentId=`: less RESTful
- Zip bundle for all: out of scope; spec says "download or open each attachment"

---

## 6. Image Thumbnails / Inline Preview

**Decision**: For image MIME types (JPEG, PNG, GIF), render inline `<img src={url}>` with `Content-Disposition: inline` in idea detail. Optional: client-side resize via CSS `max-width/max-height`. No server-side thumbnail generation in v1.

**Rationale**:
- Spec: "thumbnail or inline preview when practical"
- Inline img is simplest; browser handles display
- Server-side thumbnails (sharp/jimp) add dependency and processing; defer if needed

**Alternatives considered**:
- Server-generated thumbnails: adds dependency; deferred
- Placeholder icon for all: spec prefers preview when feasible

---

## 7. Filename Sanitization and Duplicate Handling

**Decision**: Store files as `uuid.ext` (no original filename in path). `originalFileName` in DB for display. Duplicate user filenames: display as "document.pdf", "document (2).pdf" using array index or disambiguation logic in UI.

**Rationale**:
- Current pattern: `randomUUID() + ext`; preserves uniqueness
- Spec: "Each attachment is stored with a unique identifier; display can show original filename with disambiguation"
- Sanitize for display: `replace(/[^\w.-]/g, '_')` (already in attachment route)

---

## 8. Allowed Types for v1 (Documents, Images, Spreadsheets)

**Decision**: Extend current list. Add: `.doc`, `.xls`, `.xlsx`. Keep: `.pdf`, `.docx`, `.png`, `.jpg`, `.jpeg`, `.gif`. Default config reflects these; admin can restrict via UI.

**Rationale**:
- Spec FR-002: documents (PDF, DOC, DOCX), images (JPEG, PNG, GIF), spreadsheets (XLS, XLSX)
- Current constants have DOCX, no DOC/XLS/XLSX; add them
- MIME mappings: `application/msword` (DOC), `application/vnd.ms-excel` (XLS), `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (XLSX)

---

## 9. Default Limits (When No Config in DB)

**Decision**: Seed or default: `maxFileCount: 10`, `maxFileSizeBytes: 10 * 1024 * 1024`, `maxTotalSizeBytes: 50 * 1024 * 1024`. If no row exists, use these in code until admin creates config.

**Rationale**:
- Spec assumptions: 10 files, 10MB per file, 50MB total
- Bootstrap: DB seed creates initial UploadConfiguration row
