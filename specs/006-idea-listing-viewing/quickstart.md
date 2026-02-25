# Quickstart: Idea Listing and Viewing

**Feature**: 006-idea-listing-viewing  
**Audience**: Developers implementing listing and detail views  
**Time to Complete**: ~6–8 hours for implementation + testing

---

## 1. Prerequisites

- Features 002 (auth), 003 (roles), 004 (idea submission), 005 (attachment) complete
- Idea, Category, Attachment, User models exist
- `POST /api/ideas` and `GET /api/ideas/[id]/attachment` exist
- Idea detail page at `/ideas/[id]` exists (needs enhancement)

---

## 2. Implementation Options

### Option A: Server Components (Recommended)

Use Next.js Server Components with `searchParams` for pagination and filter. No new API route; data fetched server-side.

### Option B: Client Components + API

Add `GET /api/ideas` (see contracts) and fetch from client. Use for interactive filter/pagination without full page reload.

**Recommendation**: Option A for MVP; add API if client interactivity is needed.

---

## 3. Idea List Page

### 3.1 Create `/app/ideas/page.tsx`

- Server Component (or hybrid with client pagination)
- Read `searchParams`: `page`, `pageSize`, `categoryId`
- Call `getIdeasForUser(userId, role, { page, pageSize, categoryId })` from idea-service
- Render `IdeaList` with `IdeaListItem` components
- Show skeleton via `IdeaListSkeleton` while loading (or use Suspense)
- Empty state: "No ideas yet" (submitter) or "No ideas pending review" (evaluator/admin)

### 3.2 Idea List Item

Each item shows:
- Title (link to `/ideas/[id]`)
- Category name
- Submission date (formatted)
- Attachment indicator (icon or "Has attachment" badge)

---

## 4. Idea Service Extensions

### 4.1 Add to `lib/services/idea-service.ts`

```typescript
/**
 * Fetches paginated ideas for the current user (role-based visibility).
 */
export async function getIdeasForUser(
  userId: string,
  role: UserRole,
  options: { page?: number; pageSize?: number; categoryId?: string }
): Promise<{ ideas: IdeaListItem[]; pagination: PaginationMeta }>;

/**
 * Fetches single idea for detail view with access check.
 */
export async function getIdeaForDetail(
  ideaId: string,
  userId: string,
  role: UserRole
): Promise<IdeaDetail | null>;
```

- Visibility: submitter → `where: { userId }`; evaluator/admin → `where: {}`
- Order: `submittedAt: 'desc'`
- Page normalization: 0/negative → 1; beyond last → last page
- Include submitter (name || email) for evaluator/admin only

---

## 5. Idea Detail Page Enhancements

### 5.1 Update `/app/ideas/[id]/page.tsx`

- Add `user: { select: { name: true, email: true } }` to Prisma include
- For evaluator/admin: display "Submitted by: {name || email}"
- Change back link from "Back to Submit Idea" to "Back to Ideas" (href: `/ideas`)
- Show "No attachment" or hide section when `!attachment` (spec FR-008)
- Handle missing/corrupt file: show "Attachment unavailable" on download error

---

## 6. Skeleton Components

### 6.1 Create `IdeaListSkeleton`

- Match list layout: N placeholder rows with `animate-pulse`
- Use Tailwind: `bg-gray-200 animate-pulse rounded h-4` etc.

### 6.2 Create `IdeaDetailSkeleton`

- Match detail layout: title, meta, description block, attachment block
- Use `animate-pulse` for loading state

Wrap with `<Suspense fallback={<IdeaListSkeleton />}>` or similar.

---

## 7. Category Filter (P3)

### 7.1 Categories for Filter

- Fetch active categories: `prisma.category.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } })`
- Add dropdown or checkboxes to list page
- When selected: add `categoryId` to query/searchParams
- "All" or clear restores full list

---

## 8. API Route (if Option B)

### 8.1 Add GET handler to `app/api/ideas/route.ts`

- Verify session
- Resolve role
- Parse query: `page`, `pageSize`, `categoryId`
- Call `getIdeasForUser`
- Return JSON per `contracts/api-ideas-list.md`

---

## 9. Navigation Updates

- Add "Ideas" or "My Ideas" / "All Ideas" to nav (role-dependent)
- Link from submitter dashboard to `/ideas`
- Link from evaluator dashboard to `/ideas` (or "Evaluation Queue")

---

## 10. Empty States

| Context | Message |
|---------|---------|
| Submitter, no ideas | "No ideas yet. Submit your first idea!" |
| Evaluator/Admin, no ideas | "No ideas pending review" |
| Category filter, no matches | "No ideas in this category" |

---

## 11. Environment Variables

None new. Uses existing `DATABASE_URL`, `NEXTAUTH_SECRET`.

Optional: `IDEAS_PAGE_SIZE` (default 15) if configurable per deployment.

---

## 12. Testing

### Unit Tests

- `idea-service.test.ts` — `getIdeasForUser`, `getIdeaForDetail` (mock Prisma)
- Pagination normalization logic
- Visibility rules (submitter vs evaluator)

### Integration Tests

- `GET /api/ideas` (if implemented): pagination, filter, 401, role visibility
- Idea list page renders correct data for each role

### E2E Tests

- `idea-listing.spec.ts` — login → navigate to list → see ideas → click → detail → back
- Submitter sees only own; evaluator sees all
- Pagination: next, prev, page numbers
- Category filter (P3)

---

## 13. Run and Verify

```bash
# 1. No migration (schema unchanged)
# 2. Run tests
npm run test:unit
npm run test:integration
npm run test:e2e

# 3. Manual test
# - Login as submitter → /ideas → see own ideas
# - Login as evaluator → /ideas → see all ideas
# - Click idea → detail → Back to Ideas
# - Submitter name visible for evaluator on detail
# - Pagination with 16+ ideas
# - Category filter (if P3 done)
```

---

## Key Implementation Notes

1. **Access control**: Enforce in service layer; never expose other submitters' ideas to submitter
2. **Page normalization**: Always return valid page; never 404 for "page 999"
3. **Deactivated categories**: Existing ideas keep category ref; display name or "Uncategorized" if broken
4. **Attachment download error**: Show "Attachment unavailable" in UI; log server-side
5. **Skeleton layout**: Match final layout to avoid layout shift
