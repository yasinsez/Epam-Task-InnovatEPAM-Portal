# Quickstart: Single File Attachment Per Idea

**Feature**: 005-single-file-per-idea  
**Audience**: Developers implementing the attachment feature  
**Time to Complete**: ~4–6 hours for implementation + testing

---

## 1. Prerequisites

- Feature 004 (idea submission form) must be complete
- Idea and Category models exist in Prisma
- `POST /api/ideas` accepts JSON; will be extended for multipart

---

## 2. Database Setup

### 2.1 Create Prisma Migration

```bash
cd /Users/yasinsezgin/GitRepositories/Epam-Task-InnovatEPAM-Portal
npx prisma migrate dev --name add_attachment_model
```

Add to `prisma/schema.prisma`:

```prisma
model Attachment {
  id               String   @id @default(cuid())
  ideaId           String   @unique
  idea             Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  originalFileName String   @db.VarChar(255)
  storedPath       String   @unique @db.VarChar(500)
  fileSizeBytes    Int
  mimeType         String   @db.VarChar(100)
  createdAt        DateTime @default(now())

  @@index([ideaId])
  @@index([storedPath])
}

model Idea {
  // ... existing fields ...
  attachment Attachment?
}
```

### 2.2 Add uploads/ to .gitignore

```
uploads/
```

---

## 3. Constants and Validation

### 3.1 Create `src/lib/constants/attachment.ts`

```typescript
/** Max file size in bytes (25 MB) */
export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;

/** Allowed extensions (lowercase) */
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.png', '.jpg', '.jpeg', '.gif'] as const;

/** Extension → MIME type mapping */
export const MIME_BY_EXTENSION: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
};
```

### 3.2 Extend `src/lib/validators.ts`

Add file validation helper (Zod or manual):

```typescript
// Validate file: size, type, non-empty
// Return { valid: true } or { valid: false, error: string }
export function validateAttachmentFile(file: File): { valid: true } | { valid: false; error: string };
```

---

## 4. Attachment Service

### 4.1 Create `src/lib/services/attachment-service.ts`

```typescript
/**
 * Saves an uploaded file to the filesystem and returns the stored path.
 * @param ideaId - Idea ID for directory structure
 * @param file - The File from FormData
 * @returns Stored relative path (e.g., ideas/<ideaId>/<uuid>.<ext>)
 */
export async function saveAttachmentFile(ideaId: string, file: File): Promise<string>;

/**
 * Reads file bytes from the filesystem by stored path.
 * @param storedPath - Relative path from Attachment
 * @returns Buffer or null if not found
 */
export async function readAttachmentFile(storedPath: string): Promise<Buffer | null>;

/**
 * Deletes attachment file from filesystem (e.g., on Idea delete or replace).
 */
export async function deleteAttachmentFile(storedPath: string): Promise<void>;
```

- Base path from `process.env.UPLOADS_BASE_PATH || './uploads'`
- Directory: `uploads/ideas/<ideaId>/`
- Filename: `{uuid}.<ext>` (use crypto.randomUUID())

---

## 5. API Route Changes

### 5.1 Update `src/app/api/ideas/route.ts`

- Change to accept `multipart/form-data` when `Content-Type` contains `multipart`
- Use `request.formData()` to parse
- Extract `title`, `description`, `categoryId` as strings; `attachment` as File | null
- If attachment present: validate, create Idea, save file, create Attachment
- On failure after Idea create: delete Idea (rollback)
- Return 201 with idea including attachment metadata

### 5.2 Create `src/app/api/ideas/[id]/attachment/route.ts`

- GET handler: verify session, load Idea with Attachment, check access, stream file
- Set `Content-Type` and `Content-Disposition` from Attachment
- Return 404 if no attachment; 403 if access denied

---

## 6. Form Component Changes

### 6.1 Create `src/components/IdeaAttachmentInput.tsx`

- File input (`<input type="file" accept=".pdf,.docx,.png,.jpg,.jpeg,.gif" />`)
- Client-side validation (size, type) before submit
- Display selected file name; "Remove" button to clear
- Replace behavior: selecting new file replaces previous

### 6.2 Update `src/components/SubmitIdeaForm.tsx`

- Use `FormData` instead of JSON for submit when file present
- Add `IdeaAttachmentInput` to form
- Append file to FormData as `attachment` if selected
- Handle validation errors for file (display user-friendly messages)
- Preserve form data + file reference on submission failure (per spec)

---

## 7. Idea Detail View (if exists)

- If idea has attachment: show "Download attachment" link
- Link to `GET /api/ideas/[id]/attachment`
- Use `originalFileName` for link text

---

## 8. Environment Variables

```env
# Optional; defaults to ./uploads
UPLOADS_BASE_PATH=./uploads
```

---

## 9. Testing

### Unit Tests

- `tests/unit/lib/validators.test.ts` — file validation (size, type, empty)
- `tests/unit/lib/services/attachment-service.test.ts` — save/read/delete (mock fs)

### Integration Tests

- `tests/integration/api/ideas/route.test.ts` — multipart submission with file
- `tests/integration/api/ideas/attachment-route.test.ts` — GET download

### E2E Tests

- `tests/e2e/idea-attachment.spec.ts` — select file → submit → view idea → download

---

## 10. Run and Verify

```bash
# 1. Migration
npx prisma migrate dev --name add_attachment_model

# 2. Create uploads dir (if not exists)
mkdir -p uploads/ideas

# 3. Run tests
npm run test:unit
npm run test:integration
npm run test:e2e

# 4. Manual test
# - Go to /ideas/submit
# - Attach a PDF/PNG (valid)
# - Submit
# - View idea, click download
# - Try invalid file (e.g., .exe) — should reject
# - Try file > 25 MB — should reject
```

---

## Key Implementation Notes

1. **Transactional behavior**: Create Idea first; if file/Attachment save fails, delete Idea
2. **Path safety**: Never use user-provided filename for storage; use UUID + validated extension
3. **Access control**: Download route must enforce same visibility as idea detail
4. **Cleanup**: On Idea delete, remove Attachment record (cascade) and delete file from disk
5. **Replace**: When user selects new file before submit, client simply replaces; only one file in FormData

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| FormData not parsing | Ensure form has `enctype="multipart/form-data"`; use `fetch` with FormData body, not JSON |
| File not found on download | Check UPLOADS_BASE_PATH; ensure path joins correctly; verify file was saved |
| 404 on attachment | Verify Idea has attachment; check relation include in Prisma query |
| Access denied | Align download access with idea visibility; ensure session validated |
