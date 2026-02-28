# Quickstart: Draft Management (Save Drafts)

**Feature**: 010-draft-management  
**Audience**: Developers implementing draft save, list, and submit flows  
**Time to Complete**: ~6–10 hours for implementation + testing

---

## 1. Prerequisites

- Idea, Attachment, Category, FormConfiguration, UploadConfiguration models exist
- `POST /api/ideas` accepts multipart with attachments and dynamic fields
- `SubmitIdeaForm` component exists
- NextAuth session and RBAC (getUserRole) working
- Ideas list excludes drafts for evaluators; submitters see own ideas

---

## 2. Database Changes

### 2.1 Add DRAFT to IdeaStatus

```prisma
enum IdeaStatus {
  DRAFT       // NEW
  SUBMITTED
  UNDER_REVIEW
  ACCEPTED
  REJECTED
}
```

### 2.2 Make categoryId Optional on Idea

```prisma
model Idea {
  ...
  categoryId    String?   // was: String
  category      Category? @relation(...)  // was: Category
  ...
  @@index([userId, status])  // NEW: for draft queries
}
```

### 2.3 Migration

```bash
npx prisma migrate dev --name draft_management
```

---

## 3. Draft Service

### 3.1 Create `src/lib/services/draft-service.ts`

```typescript
/** List drafts for user (submitter only) */
export async function getDraftsForUser(userId: string, options?: { page?: number; pageSize?: number }): Promise<{ drafts: DraftListItem[]; pagination: PaginationMeta }>;

/** Create draft (partial data allowed); enforces 10-draft limit */
export async function createDraft(userId: string, data: DraftCreateInput, attachments?: File[]): Promise<DraftDetail>;

/** Get draft by id (owner only) */
export async function getDraftById(draftId: string, userId: string): Promise<DraftDetail | null>;

/** Update draft (last-save-wins) */
export async function updateDraft(draftId: string, userId: string, data: DraftUpdateInput, attachments?: File[]): Promise<DraftDetail>;

/** Discard draft (delete + attachment cleanup) */
export async function discardDraft(draftId: string, userId: string): Promise<void>;

/** Submit draft (full validation; convert to idea) */
export async function submitDraft(draftId: string, userId: string, data?: Partial<DraftUpdateInput>): Promise<IdeaDetail>;
```

---

## 4. API Routes

### 4.1 Create `src/app/api/drafts/route.ts`

- **GET**: List drafts (submitter only; paginate)
- **POST**: Create draft (submitter only; enforce 10 limit; relaxed validation)

See `contracts/api-drafts.md`.

### 4.2 Create `src/app/api/drafts/[id]/route.ts`

- **GET**: Get draft (owner only)
- **PATCH**: Update draft (owner only)
- **DELETE**: Discard draft (owner only)

### 4.3 Create `src/app/api/drafts/[id]/submit/route.ts`

- **POST**: Submit draft (full validation; status→SUBMITTED)

---

## 5. Validation Updates

### 5.1 Add `DraftSaveSchema` in `src/lib/validators.ts`

Relaxed schema: title optional (default "Untitled draft"), description optional (default ""), categoryId optional. No min/max for draft save.

### 5.2 Submit Path

Reuse `SubmitIdeaSchema` and dynamic field validation for `POST /api/drafts/[id]/submit`.

---

## 6. Component Changes

### 6.1 Update `SubmitIdeaForm`

- Add **Save draft** button (primary or secondary)
- Add `draftId?: string` prop for edit mode
- **New submission**: POST /api/ideas (unchanged)
- **Save draft (new)**: POST /api/drafts
- **Save draft (existing)**: PATCH /api/drafts/[id]
- **Submit from draft**: POST /api/drafts/[id]/submit
- Load draft: GET /api/drafts/[id] when draftId provided; populate form state

### 6.2 Create Drafts List Page

- Route: `/ideas/drafts`
- Fetch GET /api/drafts; render list with title (or "Untitled draft"), updatedAt, Open/Discard actions
- Add nav link: "My Drafts" for submitters

### 6.3 Update Submit Page

- Support `?draftId=xxx` to load draft for editing
- If draftId: load draft, show "Save draft" and "Submit" buttons
- If new: show "Save draft" and "Submit Idea" buttons

---

## 7. Idea Service Updates

- `getIdeasForUser`: Add `where: { status: { not: 'DRAFT' } }` for evaluator/admin; for submitter, optionally filter by `status != DRAFT` for "My Ideas" (or add `?includeDrafts=true` for backwards compat—submitters typically want separate Drafts vs Ideas views)
- `getSubmissionStats`: Count drafts: `prisma.idea.count({ where: { userId, status: 'DRAFT' } })`

---

## 8. Navigation

- Add "My Drafts" link for submitters in Navigation (e.g. next to "Submit Idea")
- Submitter dashboard: show draft count and link to drafts

---

## 9. Testing

### Unit

- `draft-service.test.ts` — create, list, update, discard, submit; draft limit
- `validators.test.ts` — DraftSaveSchema

### Integration

- `api/drafts/route.test.ts` — GET list, POST create, 403 for non-submitter, 400 when limit reached
- `api/drafts/[id]/route.test.ts` — GET, PATCH, DELETE
- `api/drafts/[id]/submit/route.test.ts` — submit success, validation failure

### E2E

- Save draft → navigate away → return → restore
- Complete draft → submit → appears in ideas list, gone from drafts
- Discard draft → confirm → removed
- Draft limit: create 10 drafts → 11th save fails with message

---

## 10. Run and Verify

```bash
npx prisma migrate dev --name draft_management
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
```

Manual: submitter saves partial form as draft; opens drafts list; opens draft; edits and saves again; submits; verifies idea in list and draft gone; discards a draft; creates 10 drafts and verifies 11th is rejected.
