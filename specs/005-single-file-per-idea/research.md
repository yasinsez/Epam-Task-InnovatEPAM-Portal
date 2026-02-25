# Research: Single File Attachment Per Idea

**Feature**: 005-single-file-per-idea  
**Created**: 2026-02-25  
**Phase 0 Output**

---

## 1. File Upload Handling in Next.js App Router

### Decision
Use `Request.formData()` to parse multipart/form-data in the POST handler. Do not use external libraries (e.g., Multer) for multipart parsing in Next.js API routes.

### Rationale
- Next.js 14+ and the Web Fetch API provide `request.formData()` natively
- App Router API routes receive standard `Request` objects
- `formData()` returns a `FormData` object; files are available as `File` instances
- No additional dependency; keeps bundle and attack surface small
- Works with `enctype="multipart/form-data"` form submissions from the client

### Alternatives Considered
- **Multer**: Node.js specific; requires different route handler setup; not needed when Fetch API handles multipart
- **Busboy/Formidable**: Lower-level; more code; `formData()` is simpler and built-in
- **Client upload to S3 then pass URL**: Overkill for local filesystem requirement; adds external dependency

---

## 2. Local Filesystem Storage for Uploads

### Decision
Store files in `uploads/ideas/<ideaId>/` with a safe filename derived from a UUID + original extension. Directory created on first write. Base path configurable via `UPLOADS_BASE_PATH` (default: `./uploads` relative to project root).

### Rationale
- Spec mandates local filesystem; no cloud storage
- Per-idea subdirectory isolates files and simplifies cleanup if idea is deleted
- UUID-based filename avoids collisions and path traversal (no user-controlled path segments)
- Configurable path supports different environments (e.g., `/var/uploads` in production)

### Security Measures
- Store only the relative path in the database (e.g., `ideas/<ideaId>/<uuid>.<ext>`)
- Never serve files by direct filesystem path from user input; use Attachment record to resolve path
- Ensure `uploads/` is in `.gitignore` and outside public static serving

### Alternatives Considered
- **Database BLOB**: Rejected; spec says local filesystem; BLOB increases DB size and complexity
- **Flat directory with hash**: Possible but per-idea directories improve organization and cleanup

---

## 3. File Type Validation (MIME vs Extension)

### Decision
Validate using both extension whitelist and MIME type. Server-side: check `file.type` (browser-provided MIME) and validate extension from `file.name`. Use a mapping of allowed extensions to allowed MIME types.

### Rationale
- Extension alone is forgeable; MIME from browser can be spoofed but provides defense in depth
- Spec: PDF, DOCX, PNG, JPG, GIF
- Mapping: `.pdf`→`application/pdf`, `.docx`→`application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `.png`→`image/png`, `.jpg`/`.jpeg`→`image/jpeg`, `.gif`→`image/gif`
- Reject if extension not in list OR MIME not in allowed set for that extension

### Alternatives Considered
- **Magic bytes (file signature)**: More robust but requires library (e.g., `file-type`); adds dependency; for internal portal, extension + MIME sufficient
- **Extension only**: Simpler but weaker; MIME adds little code and improves safety

---

## 4. Safe Filename and Path Handling

### Decision
Generate stored filename as `{uuid}.{ext}` where `ext` is lowercased and validated against allowed list. Original filename stored in Attachment.originalFileName for display. Never use user-provided filename for filesystem path.

### Rationale
- Prevents path traversal (e.g., `../../../etc/passwd`)
- Prevents overwriting (UUID ensures uniqueness)
- Display name preserved for user experience
- Max 255 chars for originalFileName in DB; truncate with ellipsis if needed for display

---

## 5. Transactional Consistency (Idea + Attachment)

### Decision
Create Idea first; on success, save file and create Attachment; if file save fails, delete the Idea (or use transaction if DB supports it; Prisma transactions do not cover filesystem). For simplicity: create Idea, then Attachment + file; on Attachment/file failure, delete Idea.

### Rationale
- Need Idea.id to create per-idea directory and Attachment.ideaId
- Prisma can wrap Idea + Attachment in a transaction, but file write is outside DB
- Acceptable: Create Idea, write file, create Attachment; on any failure after Idea create, delete Idea (rollback). Ensures no orphan Ideas with missing attachments.

### Alternatives Considered
- **Two-phase**: Upload file first to temp, then create Idea+Attachment, move file; more complex
- **Outbox pattern**: Overkill for this feature

---

## Summary of Resolved Items

| Topic | Resolution |
|-------|------------|
| Multipart parsing | `Request.formData()` |
| Storage location | `uploads/ideas/<ideaId>/<uuid>.<ext>` |
| Path configuration | `UPLOADS_BASE_PATH` env var |
| File type validation | Extension whitelist + MIME mapping |
| Filename safety | UUID + validated ext; original name in DB only for display |
| Idea + Attachment consistency | Create Idea → write file → create Attachment; rollback Idea on failure |
