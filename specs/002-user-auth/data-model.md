# Data Model: User Authentication System

**Phase 1 Output** | Entity definitions and Prisma schema  
**Date**: 2026-02-24 | **Feature**: User Authentication (002-user-auth)

## Entity Specification

### 1. User

**Purpose**: Core entity representing an authenticated user/employee of InnovatEPAM Portal.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, auto-generated (cuid) | Unique user identifier |
| `email` | String | Unique, indexed | Email address (RFC 5322 validated, case-insensitive storage) |
| `name` | String | Optional | User's full name (for future dashboard display) |
| `passwordHash` | String | Not null | Hashed password (bcrypt, cost 12) |
| `emailConfirmed` | Boolean | Default: false | Whether registration confirmation email was opened (future) |
| `createdAt` | DateTime | Auto (now) | Account creation timestamp |
| `updatedAt` | DateTime | Auto (updatedAt) | Last profile update timestamp |
| `lastLoginAt` | DateTime | Optional, indexed | Most recent successful login |

**Relationships**:
- One-to-many: Sessions (user logs in from multiple devices)
- One-to-many: PasswordResetTokens (user can request multiple resets)
- One-to-many: FailedLoginAttempts (rate limiting history)
- One-to-many: AuthLogs (complete audit trail)

**Validation Rules**:
- Email: RFC 5322 format, unique across system
- Password: Minimum 8 characters (enforced before hashing)
- Name: Optional, max 255 characters

**State Transitions**:
```
[Created] → [Active] → [Password Reset In-Progress] → [Active]
            ↓
         [Logout] → (session invalidated but user remains active)
```

---

### 2. Session

**Purpose**: Represents an active login session (JWT token) for a user on a specific device.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, auto-generated (cuid) | Session identifier |
| `sessionToken` | String | Unique, indexed | NextAuth session token (opaque identifier) |
| `userId` | String | FK to User, indexed | Session owner |
| `jwt` | String | Not null, encrypted | Embedded JWT (for refresh logic) |
| `expiresAt` | DateTime | Indexed | Token expiry = created + 24 hours |
| `createdAt` | DateTime | Auto (now) | Session creation timestamp |
| `userAgent` | String | Optional | Device identifier (e.g., "Mozilla 5.0...") |
| `ipAddress` | String | Optional | Login IP address (for audit) |

**Relationships**:
- Many-to-one: User

**Validation Rules**:
- `expiresAt` = creation + 24 hours (exactly)
- `sessionToken` is per-device (new token on each login)
- JWT is signed and cannot be tampered with

**State Transitions**:
```
[Created] → [Active] → [Refreshed] (token updated) → [Active]
         ↓
    [Logged Out] → [Invalid] (token rejected)
```

**Cleanup**:
- Automatic deletion 7 days after expiry (or via logout)
- NextAuth adapter handles session lifecycle

---

### 3. PasswordResetToken

**Purpose**: Secure token for password reset workflow; prevents unauthorized password changes.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, auto-generated (cuid) | Token record identifier |
| `token` | String | Unique, indexed | Cryptographically random reset token (sent via email) |
| `userId` | String | FK to User, indexed | User requesting reset |
| `createdAt` | DateTime | Auto (now) | When reset was requested |
| `expiresAt` | DateTime | Indexed | createdAt + 24 hours |
| `isUsed` | Boolean | Default: false | Prevents token replay attack |
| `usedAt` | DateTime | Optional | When token was consumed (for audit) |

**Relationships**:
- Many-to-one: User

**Validation Rules**:
- Token is cryptographically random (e.g., `crypto.randomBytes(32).toString('hex')`)
- Expiry = creation + 24 hours
- Once `isUsed = true`, token cannot be reused
- Cannot reset to previous password (enforced in service layer)

**State Transitions**:
```
[Created] → [Sent] (email queued) → [Valid] (user opens email)
         ↓
    [Used] (new password saved, cannot reuse)
    ↓
 [Expired] (24h passed)
```

---

### 4. FailedLoginAttempt

**Purpose**: Track failed login attempts per user for rate limiting; enforces progressive delays.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, auto-generated (cuid) | Log record identifier |
| `userId` | String | FK to User, indexed | User who failed login |
| `attemptAt` | DateTime | Auto (now), indexed | When login was attempted |
| `reason` | String | Enum: password_incorrect, user_not_found | Why login failed |

**Relationships**:
- Many-to-one: User

**Validation Rules**:
- Only records failures; successful logins clear the counter (soft delete / don't add record)
- Indexed on (userId, attemptAt) for efficient querying

**State Transitions**:
```
Failed login → Record created (1st failure)
            → Record created (2nd failure) + apply 2s delay
            → Record created (3rd+ failure) + apply 4s delay
            ↓
         1 hour passes with no failures
            ↓
         [Reset] (counter resets via query, old records deleted)
```

**Cleanup Logic**:
- Service: When calculating current delay, delete attempts older than 1 hour
- Query: `DELETE FROM FailedLoginAttempt WHERE attemptAt < now() - interval '1 hour'`

---

### 5. AuthLog

**Purpose**: Immutable audit trail of all authentication events for security compliance.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, auto-generated (cuid) | Log record identifier |
| `userId` | String | FK to User, optional, indexed | User involved (null for registration before user created) |
| `action` | String | Enum: register, login, logout, password_reset, token_refresh | Event type |
| `status` | String | Enum: success, failed | Outcome |
| `timestamp` | DateTime | Auto (now), indexed | Event timestamp (immutable) |
| `ipAddress` | String | Optional | Request IP (for geographic audit) |
| `userAgent` | String | Optional | Device/browser info |
| `reason` | String | Optional | Failure reason (e.g., "invalid_password", "token_expired") |
| `metadata` | JSON | Optional | Additional context (e.g., { "attemptNumber": 3 } for rate limiting) |

**Relationships**:
- Many-to-one: User (nullable for registration)

**Validation Rules**:
- NEVER log passwords, tokens, or sensitive data
- Timestamp is immutable (created once, never updated)
- Query with (userId, timestamp) index for dashboard audit reports

**Examples**:
```json
{ "action": "register", "status": "success", "timestamp": "2026-02-24T10:00:00Z", "userId": "user123" }
{ "action": "login", "status": "failed", "reason": "invalid_password", "metadata": { "attemptNumber": 2 }, "timestamp": "2026-02-24T10:05:00Z", "ipAddress": "192.168.1.1" }
{ "action": "token_refresh", "status": "success", "timestamp": "2026-02-24T10:10:00Z", "userId": "user123" }
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique @db.VarChar(254)  // RFC 5321 max length
  name          String?   @db.VarChar(255)
  passwordHash  String    // bcrypt hash (60 chars)
  emailConfirmed Boolean @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?

  // Relations
  sessions              Session[]
  passwordResetTokens   PasswordResetToken[]
  failedLoginAttempts   FailedLoginAttempt[]
  authLogs              AuthLog[]

  @@index([email])
  @@index([lastLoginAt])
}

model Session {
  id            String   @id @default(cuid())
  sessionToken  String   @unique
  userId        String
  jwt           String   @db.Text
  expiresAt     DateTime
  createdAt     DateTime @default(now())
  userAgent     String?
  ipAddress     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@index([sessionToken])
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  createdAt DateTime @default(now())
  expiresAt DateTime
  isUsed    Boolean  @default(false)
  usedAt    DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@index([token])
}

model FailedLoginAttempt {
  id        String   @id @default(cuid())
  userId    String
  attemptAt DateTime @default(now())
  reason    String   // "password_incorrect" | "user_not_found"

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, attemptAt])
  @@index([attemptAt])  // For cleanup queries
}

model AuthLog {
  id        String   @id @default(cuid())
  userId    String?  // Nullable for registration
  action    String   // "register" | "login" | "logout" | "password_reset" | "token_refresh"
  status    String   // "success" | "failed"
  timestamp DateTime @default(now())
  ipAddress String?
  userAgent String?
  reason    String?  // Failure reason, e.g., "invalid_password"
  metadata  Json?    // Additional context

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId, timestamp])
  @@index([action, timestamp])
  @@index([timestamp])
}
```

---

## Key Design Decisions

### Decision 1: Separate FailedLoginAttempt Table (vs. User.failedCount Counter)

**Choice**: Separate table with immutable records

**Rationale**:
- Query efficiency: Aggregate COUNT on recent attempts without loading entire user record
- Audit trail: See exact timestamps of failed attempts (useful for breach investigation)
- Cleanup: Easy to batch-delete old records (1 hour+) without locking User table
- Scales better: User table isn't modified on every failed login (lower contention)

---

### Decision 2: isUsed Flag on PasswordResetToken (vs. Deletion)

**Choice**: Keep record with `isUsed = true` + `usedAt` timestamp

**Rationale**:
- Audit trail: See when token was used (tied to password change)
- Compliance: Records support password reset audit for compliance reviews
- Soft-delete pattern: Safer than deletion (can recover if needed)
- Query simplicity: Don't need `NOT EXISTS` subqueries in code

---

### Decision 3: JWT Stored in Session (vs. Computed on Every Request)

**Choice**: Store JWT in Session table; regenerate on refresh

**Rationale**:
- Consistency: Same JWT delivered to client and stored in session
- Refresh logic: Compare stored JWT expiry against current time
- NextAuth adapter: Aligns with session-based refresh pattern
- Performance: No re-signing on every request (expensive crypto)

---

### Decision 4: AuthLog as Immutable Append-Only

**Choice**: Never update or delete logs; archive after 90 days (future)

**Rationale**:
- Compliance: Audit logs must not be tampered with
- Simplicity: No UPDATE/DELETE logic; only INSERT
- Query performance: Optimize for reads (timestamp-based partitioning in future)
- Security: Can't cover up failed attacks (immutable record)

---

## Data Integrity & Constraints

### Cascade Behaviors

| Relation | Delete User | Effect |
|----------|-------------|--------|
| User → Session | Cascade | All sessions invalidated |
| User → PasswordResetToken | Cascade | Pending resets deleted |
| User → FailedLoginAttempt | Cascade | Attempt history deleted |
| User → AuthLog | SetNull | Logs remain (userId = null) for audit trail |

---

### Indexes for Query Performance

```sql
-- Session queries (NextAuth adapter, token validation)
CREATE INDEX idx_session_sessionToken ON "Session"(sessionToken);
CREATE INDEX idx_session_userId ON "Session"(userId);
CREATE INDEX idx_session_expiresAt ON "Session"(expiresAt);  -- For cleanup

-- User authentication queries
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_lastLoginAt ON "User"(lastLoginAt);

-- Rate limiting queries (FailedLoginAttempt)
CREATE INDEX idx_failedLoginAttempt_userId_attemptAt ON "FailedLoginAttempt"(userId, attemptAt DESC);
CREATE INDEX idx_failedLoginAttempt_attemptAt ON "FailedLoginAttempt"(attemptAt);  -- Cleanup queries

-- Password reset queries
CREATE INDEX idx_passwordResetToken_token ON "PasswordResetToken"(token);
CREATE INDEX idx_passwordResetToken_userId ON "PasswordResetToken"(userId);
CREATE INDEX idx_passwordResetToken_expiresAt ON "PasswordResetToken"(expiresAt);  -- Cleanup

-- Audit queries
CREATE INDEX idx_authLog_userId_timestamp ON "AuthLog"(userId, timestamp DESC);
CREATE INDEX idx_authLog_action_timestamp ON "AuthLog"(action, timestamp DESC);
CREATE INDEX idx_authLog_timestamp ON "AuthLog"(timestamp DESC);  -- For dashboard reports
```

---

## Migration Strategy

**Phase 1** (this feature):
- Run `npx prisma migrate dev --name init_auth_schema`
- Creates all tables (User, Session, PasswordResetToken, FailedLoginAttempt, AuthLog)
- Indexes created automatically

**Phase 2** (future enhancements):
- Add User.emailConfirmedAt (for confirmation email tracking)
- Add Session.refreshCount (for token refresh telemetry)
- Add User.roles (for RBAC support)

---

## Testing Considerations

### Unit Test Seeds

```typescript
// tests/fixtures/users.ts
export const testUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  passwordHash: '$2b$12$...',  // bcrypt of 'TestPassword123'
  createdAt: new Date('2026-02-24T10:00:00Z'),
};

// Create factories for Prisma:
export async function createTestUser(data?: Partial<typeof testUser>) {
  return await prisma.user.create({
    data: { email: 'test@example.com', passwordHash: '...', ...data },
  });
}
```

### Integration Test Database

- Use Docker PostgreSQL container (docker-compose.yml)
- Or testcontainers-node for automated lifecycle
- Run migrations before tests: `npx prisma migrate deploy --skip-generate`
- Seed test data (users, sessions) before each test suite
- Clean up after tests: Delete rows or use transaction rollback

---

## Next Steps

1. Create Prisma migrations: `npx prisma migrate dev --name init_auth_schema`
2. Define API contracts in `contracts/api-auth.md` and `contracts/session.md`
3. Create `quickstart.md` with database setup instructions
4. Implement data access layer using research.md findings
