# Quickstart: Smart Submission Forms

**Feature**: 001-smart-submission-forms  
**Branch**: `001-smart-submission-forms`

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- InnovatEPAM Portal MVP running (auth, idea submission, evaluation)
- Admin user account

## Quick Setup

### 1. Database Migration

```bash
cd /path/to/Epam-Task-InnovatEPAM-Portal
git checkout 001-smart-submission-forms

# Run migrations
npx prisma migrate dev --name add_smart_submission_forms

# Seed form config (optional; migration may create minimal default)
npx prisma db seed
```

### 2. Environment

Ensure `DATABASE_URL` and NextAuth vars are set (no new env vars for this feature).

### 3. Run Application

```bash
npm run dev
```

### 4. Configure Form (Admin)

1. Log in as admin
2. Go to Admin → Form Configuration
3. Add fields: label, type, required, display order
4. Save

### 5. Submit Idea (Submitter)

1. Log in as submitter
2. Go to Submit Idea
3. Fill fixed fields + dynamic fields
4. Submit

### 6. View Ideas

- List view: shows dynamic field values (truncated)
- Detail view: full values with labels

---

## Key Paths

| Purpose | Path |
|---------|------|
| Form config API | `GET/PUT /api/admin/form-config` |
| Submit idea | `POST /api/ideas` (extended body) |
| List ideas | `GET /api/ideas` |
| Idea detail | `GET /api/ideas/[id]` |
| Admin form config UI | `/admin` → Form Configuration tab |
| Submit form UI | `/ideas/submit` |

---

## Development Commands

```bash
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm run test         # All tests
npm run test:unit    # Unit only
npm run test:integration  # Integration only
npm run test:e2e     # Playwright E2E
```

---

## Testing This Feature

1. **Unit**: `form-config-service`, `dynamic-schema` (Zod builder)
2. **Integration**: `api/admin/form-config`, `api/ideas` with dynamic payloads
3. **Contract**: `api-form-config.test.ts`, extend `api-ideas.test.ts`
4. **E2E**: `smart-submission-forms.spec.ts` — admin configures, submitter submits, viewer sees

---

## Rollback

If reverting:

```bash
npx prisma migrate resolve --rolled-back <migration_name>
# Then manually drop FormConfiguration, FormFieldDefinition, Idea.dynamicFieldValues column
# Or create reverse migration
```

Existing ideas keep `dynamicFieldValues`; no data loss. Backward compatible: ideas without dynamic fields render as before.
