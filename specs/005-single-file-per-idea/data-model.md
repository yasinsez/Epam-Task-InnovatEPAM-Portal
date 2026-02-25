# Data Model: Single File Attachment Per Idea

**Feature**: 005-single-file-per-idea  
**Created**: 2026-02-25  
**Version**: 1.0

## Overview

This feature extends the existing Idea model with an optional one-to-one relationship to an Attachment. The Attachment stores metadata; the actual file is stored on the local filesystem.

---

## Entity: Attachment (New)

Represents a single file attached to an Idea. At most one Attachment per Idea.

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (CUID) | Primary Key, unique | Unique identifier for the attachment |
| `ideaId` | String | Required, unique, Foreign Key → Idea.id | Reference to the idea |
| `originalFileName` | String | Required, max 255 chars | User-provided filename for display |
| `storedPath` | String | Required, max 500 chars | Relative path from uploads base (e.g., `ideas/<ideaId>/<uuid>.pdf`) |
| `fileSizeBytes` | Int | Required | File size at upload time |
| `mimeType` | String | Required, max 100 chars | MIME type (e.g., `application/pdf`) |
| `createdAt` | DateTime | Required, default: now() | Timestamp when attachment was created |

### Validation Rules

- **originalFileName**: 1-255 characters; sanitized for display (strip path separators)
- **storedPath**: Must match pattern `ideas/<cuid>/\w+\.<ext>`; extension must be in allowed list
- **fileSizeBytes**: Must be > 0 and ≤ 25 * 1024 * 1024 (25 MB)
- **mimeType**: Must be in allowed set: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/png`, `image/jpeg`, `image/gif`

### Relationships

- **Idea**: One-to-One (optional) — each Idea has at most one Attachment

### Indexes

- `(ideaId)` — unique; lookup attachment by idea
- `(storedPath)` — unique; avoid duplicate paths

### Allowed File Types

| Extension | MIME Type |
|-----------|-----------|
| .pdf | application/pdf |
| .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document |
| .png | image/png |
| .jpg, .jpeg | image/jpeg |
| .gif | image/gif |

### Sample Data

```
{
  id: "att_cm123xyz",
  ideaId: "cm9lk4m2kd8f9g0",
  originalFileName: "design-mockup.png",
  storedPath: "ideas/cm9lk4m2kd8f9g0/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png",
  fileSizeBytes: 524288,
  mimeType: "image/png",
  createdAt: "2026-02-25T16:00:00Z"
}
```

---

## Entity: Idea (Extended)

The existing Idea model gains an optional one-to-one relation to Attachment.

### New Relation

- **attachment**: One-to-One (optional) — Attachment|null

### Unchanged Fields

All existing Idea fields remain unchanged (title, description, categoryId, userId, status, etc.).

---

## Prisma Schema Additions

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

---

## State Transitions

### Attachment Lifecycle

1. **Create**: When user submits idea with file, Attachment is created after Idea and file write succeed
2. **Replace**: When user selects a new file (replace behavior), the old Attachment is deleted and file removed; new Attachment created on next submission
3. **Delete**: When Idea is deleted, Attachment is cascade-deleted; filesystem file should be removed by application logic (or cleanup job)

### Empty File Handling

- 0-byte files are rejected at validation (server-side) with error "File is empty" or "Please select a valid file"

---

## Migration Strategy

1. **Migration**: Create `Attachment` table with foreign key to `Idea`; add `attachment` relation to `Idea`
2. **Indexes**: Create unique index on `ideaId`; unique index on `storedPath`
3. **Rollback**: Drop Attachment table; Idea remains unchanged

---

## Filesystem Layout

```
uploads/                          # Base path (UPLOADS_BASE_PATH or default ./uploads)
└── ideas/
    └── <ideaId>/
        └── <uuid>.<ext>          # Stored file; ext from allowed list
```

- `uploads/` MUST be in `.gitignore`
- Application MUST ensure directory exists before write
- On Idea delete (with attachment), application MUST delete `uploads/ideas/<ideaId>/` directory
