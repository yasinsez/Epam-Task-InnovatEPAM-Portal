# Quickstart: Multi-Media Support (Multiple File Types)

**Feature**: 009-multi-media-support  
**Audience**: Developers implementing multi-file attachments and upload config  
**Time to Complete**: ~8–12 hours for implementation + testing

---

## 1. Prerequisites

- Feature 005 (single-file attachment) must be complete
- Idea, Attachment, Category models exist
- `POST /api/ideas` accepts multipart formData with single attachment
- Admin layout and tabs exist (`/admin`, `/admin/users`, `/admin/form-config`)

---

## 2. Database Changes

### 2.1 Add UploadConfiguration Model

```prisma
model UploadConfiguration {
  id                 String   @id @default(cuid())
  maxFileCount       Int      @default(10)
  maxFileSizeBytes   Int      @default(10485760)
  maxTotalSizeBytes  Int      @default(52428800)
  allowedExtensions  Json     // ["pdf","doc","docx",...]
  mimeByExtension    Json     // { ".pdf": "application/pdf", ... }
  updatedAt          DateTime @updatedAt
  updatedById        String?
  updatedBy          User?    @relation(fields: [updatedById], references: [id], onDelete: SetNull)

  @@index([updatedAt])
}
```

Add to User: `uploadConfigurationsBy UploadConfiguration[]`

### 2.2 Modify Attachment and Idea

- Remove `@unique` from Attachment.ideaId
- Add `displayOrder Int @default(0)` to Attachment
- Change Idea: `attachment Attachment?` → `attachments Attachment[]`

### 2.3 Migration and Seed

```bash
npx prisma migrate dev --name multi_media_support
```

Add seed to create initial UploadConfiguration with defaults (see data-model.md).

---

## 3. Upload Config Service

### 3.1 Create `src/lib/services/upload-config-service.ts`

```typescript
/** Get active upload config (or defaults if none) */
export async function getUploadConfig(): Promise<UploadConfig>;

/** Update config (admin only); returns updated config */
export async function updateUploadConfig(data: UpdateUploadConfigInput, userId: string): Promise<UploadConfig>;
```

---

## 4. API Routes

### 4.1 Update `POST /api/ideas`

- Fetch upload config at start
- Parse FormData: accept both `attachment` (single) and `attachments`/`attachments[]` (multiple)
- Normalize to File array
- Validate: count, per-file size, total size, extension, MIME
- Create Idea, then for each file: saveAttachmentFile + prisma.attachment.create
- Return idea with `attachments` array (not `attachment`)

### 4.2 Create `GET /api/ideas/[id]/attachments/[attachmentId]/route.ts`

- Verify session, load Idea with attachments, check attachment belongs to idea
- Access control: owner, evaluator, or admin
- readAttachmentFile(storedPath), return with Content-Type and Content-Disposition

### 4.3 Legacy `GET /api/ideas/[id]/attachment`

- If idea has exactly 1 attachment: serve it (backward compat)
- If 0 or 2+: return 404 with message to use per-attachment URL

### 4.4 Create `GET /api/admin/upload-config` and `PUT /api/admin/upload-config`

- Admin role required
- See contracts/api-upload-config.md

---

## 5. Validation Updates

### 5.1 Update `src/lib/validators.ts`

- Add `validateAttachments(files: File[], config: UploadConfig)` returning `{ valid: true } | { valid: false, error: string }`
- Check count, per-file size, total size, extension, MIME per config

### 5.2 Constants

- Replace hardcoded constants with config-driven; keep fallback defaults in code for bootstrap

---

## 6. Component Changes

### 6.1 Replace `IdeaAttachmentInput` (single) with multi-file version

- `value: File[]`, `onChange: (files: File[]) => void`
- `config: UploadConfigDisplay` for limits and allowed types
- `accept` attribute from config; display limits in label/help text
- Add/remove files; show list with Remove button per file

### 6.2 Create `IdeaAttachmentsList`

- Props: `attachments: AttachmentDisplay[]`, `ideaId: string`, `showImagePreviews?: boolean`
- For each: filename, size, download link (`/api/ideas/[id]/attachments/[attachmentId]`)
- For images: inline `<img src={url}>` when showImagePreviews

### 6.3 Update `SubmitIdeaForm`

- State: `files: File[]` instead of `file: File | null`
- FormData: append each file (e.g. `attachments` or `attachments[]`)
- Fetch upload config (or pass from page) for validation display

### 6.4 Update idea detail page

- Replace single attachment block with `IdeaAttachmentsList`
- Pass `idea.attachments` (array); handle empty state

---

## 7. Admin UI

### 7.1 Create `/admin/upload-config` page

- Fetch config via GET; display form with inputs for maxFileCount, maxFileSizeBytes, maxTotalSizeBytes, allowedExtensions (editable list), mimeByExtension
- On save: PUT; show success/error message

### 7.2 Add tab to AdminTabs

- Link to `/admin/upload-config` (e.g. "Upload Settings")

---

## 8. Idea Service Updates

- `getIdeaForDetail`: include `attachments` (array) instead of `attachment`
- `getIdeasForUser`: `hasAttachment` = `attachments.length > 0` (or `!!attachments?.length`)
- `deleteIdeaWithCleanup`: delete all attachment files for idea.attachments

---

## 9. Testing

### Unit

- `upload-config-service.test.ts`
- `validators.test.ts` — multi-file validation
- `attachment-service.test.ts` — existing; extend if new functions

### Integration

- `api/ideas/route.test.ts` — multi-attachment submit
- `api/ideas/attachments/[attachmentId]/route.test.ts`
- `api/admin/upload-config/route.test.ts`

### E2E

- Multi-file submit → view → download each
- Admin: change limits → verify validation enforces

---

## 10. Run and Verify

```bash
npx prisma migrate dev --name multi_media_support
npm run test:unit
npm run test:integration
npm run test:e2e
```

Manual: submit idea with 2–3 files (doc + image + spreadsheet); view idea; download each; try invalid type/size; admin change config; verify new limits apply.
