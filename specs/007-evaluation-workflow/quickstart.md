# Quickstart: Evaluation Workflow

**Feature**: 007-evaluation-workflow  
**Audience**: Developers implementing the evaluation workflow  
**Time to Complete**: ~4–6 hours for implementation + testing

---

## 1. Prerequisites

- Feature 004 (idea submission), 005 (attachment), 006 (listing/viewing) complete
- Idea model exists with `status String @default("SUBMITTED")`
- User roles (SUBMITTER, EVALUATOR, ADMIN) via `getUserRole`
- `requireRole` from `src/lib/auth/role-guards.ts` available

---

## 2. Database Setup

### 2.1 Add IdeaStatus Enum and Evaluation Model

```bash
cd /Users/yasinsezgin/GitRepositories/Epam-Task-InnovatEPAM-Portal
npx prisma migrate dev --name add_evaluation_workflow
```

Add to `prisma/schema.prisma`:

```prisma
enum IdeaStatus {
  SUBMITTED
  UNDER_REVIEW
  ACCEPTED
  REJECTED
}

model Idea {
  // ... existing fields ...
  status     IdeaStatus   @default(SUBMITTED)  // was: String @default("SUBMITTED")
  evaluation Evaluation?
}

model Evaluation {
  id            String   @id @default(cuid())
  ideaId        String   @unique
  idea          Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  decision      String   @db.VarChar(20)  // "ACCEPTED" | "REJECTED"
  comments      String   @db.Text        // 1-2000 chars
  evaluatorId   String?  // Optional: SetNull when user deleted; display "Administrator" when null
  evaluator     User?    @relation(fields: [evaluatorId], references: [id], onDelete: SetNull)
  evaluatedAt   DateTime @default(now())

  @@index([evaluatorId])
}

model User {
  // ... existing fields ...
  evaluations Evaluation[]
}
```

**Migration note**: Convert existing `status` values. If current DB uses "SUBMITTED", migration must map to enum. Use raw SQL in migration if needed to update existing rows.

---

## 3. Constants and Validation

### 3.1 Add Evaluation Constants

Create or extend `src/lib/constants/evaluation.ts`:

```typescript
/** Max characters for evaluation comments (matches idea description limit) */
export const MAX_EVALUATION_COMMENTS_LENGTH = 2000;
```

### 3.2 Extend Validators

Add to `src/lib/validators.ts` or a dedicated evaluation schema:

```typescript
// Zod schema for evaluate payload
import { z } from 'zod';

export const evaluateIdeaSchema = z.object({
  decision: z.enum(['ACCEPTED', 'REJECTED']),
  comments: z.string().min(1, 'Comments are required').max(2000, 'Comments must not exceed 2000 characters'),
});
```

---

## 4. Evaluation Service

### 4.1 Create `src/lib/services/evaluation-service.ts`

```typescript
/**
 * Evaluates an idea (accept or reject) with comments.
 * Enforces first-wins concurrency: returns null if idea already evaluated.
 *
 * @param ideaId - Idea to evaluate
 * @param evaluatorId - User ID of evaluator
 * @param decision - "ACCEPTED" or "REJECTED"
 * @param comments - Required explanation (1-2000 chars)
 * @returns Updated idea with evaluation, or null if already evaluated (409 case)
 */
export async function evaluateIdea(
  ideaId: string,
  evaluatorId: string,
  decision: 'ACCEPTED' | 'REJECTED',
  comments: string
): Promise<{ idea: IdeaWithEvaluation } | null>;
```

**Implementation**:
1. Fetch idea with evaluation; verify status is SUBMITTED or UNDER_REVIEW
2. If ACCEPTED or REJECTED already, return null (caller returns 409)
3. In `prisma.$transaction`: create Evaluation; update Idea.status
4. Re-fetch idea with evaluation and evaluator; return

---

## 5. API Route

### 5.1 Create `POST /api/ideas/[id]/evaluate`

File: `src/app/api/ideas/[id]/evaluate/route.ts`

- Use `requireRole('admin', 'evaluator')` wrapper
- Parse JSON body; validate with `evaluateIdeaSchema`
- Call `evaluateIdea(ideaId, userId, decision, comments)`
- If null → 409 "This idea has already been evaluated"
- If success → 200 with idea + evaluation

---

## 6. Idea Service Extensions

### 6.1 Extend `getIdeasForUser` (IdeaListItem)

- Add `status` to select and return
- Map Idea.status to `IdeaListItem.status`

### 6.2 Extend `getIdeaForDetail` (IdeaDetail)

- Include `evaluation` relation with `evaluator`
- Add `status` and `evaluation` to return type
- For `evaluatorDisplayName`: use evaluator.name or evaluator.email or "Administrator" if null

---

## 7. UI Changes

### 7.1 Idea List (`src/app/ideas/page.tsx` and `IdeaListItem`)

- Pass `status` to `IdeaListItem`
- Display status label (e.g., "Submitted", "Under Review", "Accepted", "Rejected")

### 7.2 Idea Detail (`src/app/ideas/[id]/page.tsx`)

- Display status badge/label
- **Admin/Evaluator only**: If status is SUBMITTED or UNDER_REVIEW, show inline evaluation controls:
  - Accept button, Reject button
  - Textarea for comments (required, max 2000, with char counter)
  - Client-side validation before submit
- **All users**: If evaluation exists, show evaluation section:
  - Decision (Accepted/Rejected)
  - Comments
  - Evaluated at date
  - Evaluator display name

### 7.3 Evaluation Form Component (optional)

Create `src/components/EvaluationForm.tsx`:
- Accept/reject buttons
- Comment textarea with validation
- Submit via `fetch('/api/ideas/[id]/evaluate', { method: 'POST', body: JSON.stringify({ decision, comments }) })`
- Handle 400 (validation), 409 (already evaluated), 200 (success, refresh or update UI)

---

## 8. Optional: "Start Evaluation" (FR-009)

If implementing UNDER_REVIEW transition:

- Add `PATCH /api/ideas/[id]/start-review` or include in evaluate flow
- When admin clicks "Evaluate" or "Start evaluation", set status to UNDER_REVIEW
- Can defer to later phase per spec (optional for MVP)

---

## 9. Testing

### Unit Tests

- `tests/unit/lib/validators.test.ts` — evaluate schema (valid, empty comments, >2000 chars)
- `tests/unit/lib/services/evaluation-service.test.ts` — evaluate flow, first-wins (mock Prisma)

### Integration Tests

- `tests/integration/api/ideas/evaluate-route.test.ts`:
  - Success (accept, reject)
  - 400 (missing comments, invalid decision)
  - 403 (submitter role)
  - 409 (already evaluated)
  - 404 (idea not found)

### E2E Tests

- `tests/e2e/evaluation-workflow.spec.ts`:
  - Admin evaluates idea (accept with comments)
  - Admin evaluates idea (reject with comments)
  - Submitter sees evaluation feedback
  - Status visible in list and detail

---

## 10. Run and Verify

```bash
# 1. Migration
npx prisma migrate dev --name add_evaluation_workflow

# 2. Run tests
npm run test:unit
npm run test:integration
npm run test:e2e

# 3. Manual test
# - Submit idea as submitter
# - Log in as admin
# - Open idea detail
# - Accept with comments → verify status + feedback
# - Try to evaluate again → should see "already evaluated"
# - Log in as submitter → verify feedback visible
# - Check idea list shows status
```

---

## Key Implementation Notes

1. **First-wins**: Check idea status before update; return 409 if already ACCEPTED/REJECTED
2. **Comments required**: Enforce at API and client; Zod validation
3. **Evaluator display**: Handle deactivated user → "Administrator"
4. **Access control**: Only admin/evaluator can evaluate; submitters see feedback only
5. **Status default**: New ideas get SUBMITTED at creation (spec 004)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 409 when expecting success | Another session evaluated first; verify transaction and status check |
| Validation error on comments | Ensure Zod schema enforces min 1, max 2000 |
| Evaluation not visible to submitter | Include evaluation in getIdeaForDetail; check access (owner sees own) |
| Status not updating | Verify Prisma transaction; check IdeaStatus enum in schema |
