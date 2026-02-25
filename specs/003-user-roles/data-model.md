# Data Model: User Roles

**Phase 1 Output** | Entity definitions and Prisma schema updates  
**Date**: 2026-02-25 | **Feature**: User Roles (003-user-roles)

## Entity Specification

### 1. User (Role Extension)

**Purpose**: Assign exactly one role per user to control access to pages, APIs, and UI.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `role` | Enum | Not null, default `SUBMITTER` | User role (SUBMITTER, EVALUATOR, ADMIN) |

**Relationships**:
- No new relations required (role stored directly on `User`)

**Validation Rules**:
- `role` must be one of: `SUBMITTER`, `EVALUATOR`, `ADMIN`
- Only admins can change roles (except self-demotion blocked)

**State Transitions**:
```
[SUBMITTER] ↔ [EVALUATOR] ↔ [ADMIN]
  ^                          |
  |                          |
  └────── Admin-only update ─┘
```

**Behavioral Rules**:
- Evaluators cannot submit ideas (no role inheritance)
- Role changes apply on next request (DB lookup per request)
- Users missing a role are treated as unauthorized

---

## Prisma Schema Changes

```prisma
// prisma/schema.prisma

enum UserRole {
  SUBMITTER
  EVALUATOR
  ADMIN
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique @db.VarChar(254)
  name          String?  @db.VarChar(255)
  passwordHash  String
  emailConfirmed Boolean @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?

  role          UserRole @default(SUBMITTER)

  // Relations
  sessions              Session[]
  passwordResetTokens   PasswordResetToken[]
  failedLoginAttempts   FailedLoginAttempt[]
  authLogs              AuthLog[]

  @@index([email])
  @@index([lastLoginAt])
  @@index([role])
}
```

---

## Migration Strategy

1. Add `UserRole` enum and `role` field with default `SUBMITTER`
2. Run `npx prisma migrate dev --name add_user_roles`
3. Backfill existing users with `SUBMITTER` automatically via default

---

## Testing Considerations

- Unit: role validation helpers, guard utilities, role-change rules
- Integration: admin role update API, access denied for non-admin
- E2E: submitter/evaluator/admin navigation and access redirects
