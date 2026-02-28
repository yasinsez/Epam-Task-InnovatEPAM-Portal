# Data Model: Multi-Media Support

**Feature**: 009-multi-media-support | **Phase**: 1 | **Date**: 2026-02-28

## Entity Overview

| Entity | Purpose | Key Changes |
|--------|---------|-------------|
| **Attachment** | File associated with an idea | 1:1 → 1:N; remove `ideaId` unique |
| **Idea** | Extends to have many attachments | `attachment` → `attachments` relation |
| **UploadConfiguration** | Admin-configurable limits & types | **NEW** |

---

## 1. Attachment (Modified)

**Current** (single per idea):
```
Attachment: id, ideaId (unique), originalFileName, storedPath, fileSizeBytes, mimeType, createdAt
```

**New** (multiple per idea):
```
Attachment:
  id               String   @id @default(cuid())
  ideaId           String   # No longer @unique
  idea             Idea     @relation(...)
  originalFileName String   @db.VarChar(255)
  storedPath       String   @unique @db.VarChar(500)  # Path is still unique globally
  fileSizeBytes    Int
  mimeType         String   @db.VarChar(100)
  displayOrder     Int      @default(0)  # For deterministic ordering
  createdAt        DateTime @default(now())

  @@index([ideaId])
  @@index([storedPath])
```

**Validation rules** (from FR-002, FR-003, FR-004):
- Extension in allowed list (from UploadConfiguration)
- MIME type matches extension→MIME mapping
- Per-file size ≤ config max
- Total size of all attachments for idea ≤ config max
- File count ≤ config max

**State**: No state machine; created on upload, deleted on idea delete (cascade).

---

## 2. Idea (Relation Change)

**Before**: `attachment Attachment?` (optional 1:1)  
**After**: `attachments Attachment[]` (0:N)

**Migration**: Rename relation; existing single attachment becomes first element of `attachments`. Backward compat: ideas with one attachment display identically.

---

## 3. UploadConfiguration (New)

**Purpose**: Store admin-configurable upload limits and allowed file types. Single active row (singleton pattern).

```
UploadConfiguration:
  id                  String   @id @default(cuid())
  maxFileCount        Int      @default(10)
  maxFileSizeBytes    Int      @default(10485760)   # 10 MB
  maxTotalSizeBytes   Int      @default(52428800)    # 50 MB
  allowedExtensions   Json     # ["pdf","doc","docx",...] - without leading dot
  mimeByExtension     Json     # { ".pdf": "application/pdf", ... }
  updatedAt           DateTime @updatedAt
  updatedById         String?
  updatedBy           User?    @relation(...)

  @@index([updatedAt])
```

**Default values** (from spec assumptions):
- `maxFileCount`: 10
- `maxFileSizeBytes`: 10 * 1024 * 1024
- `maxTotalSizeBytes`: 50 * 1024 * 1024
- `allowedExtensions`: `["pdf","doc","docx","png","jpg","jpeg","gif","xls","xlsx"]`
- `mimeByExtension`: Standard MIME map for above

**Validation**: Admin UI enforces positive integers for sizes, non-empty arrays for extensions. Changes apply prospectively (new uploads only).

---

## 4. Relationship Diagram

```
User ──┬──< Idea ──< Attachment (1:N)
       │
       └── UploadConfiguration.updatedBy (optional)

Idea:
  - attachments: Attachment[]
  - (other existing fields unchanged)

Attachment:
  - idea: Idea
  - ideaId: String
```

---

## 5. Migration Strategy

1. **Create UploadConfiguration** table; seed with defaults.
2. **Modify Attachment**:
   - Drop `@@unique` on `ideaId`
   - Add `displayOrder Int @default(0)`
   - Rename Idea relation: `attachment` → `attachments`
3. **Update Idea**: `attachment Attachment?` → `attachments Attachment[]`
4. **Data**: No data transform needed; existing rows have single `ideaId`; schema change is additive for relation direction.
5. **Code**: Update all references from `idea.attachment` to `idea.attachments`; handle single-element array for backward compat where needed (legacy attachment route).
