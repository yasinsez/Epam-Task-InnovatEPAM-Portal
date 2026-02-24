# Research: User Authentication System

**Phase 0 Output** | Research completed for implementation planning  
**Date**: 2026-02-24 | **Feature**: User Authentication (002-user-auth)

## Research Findings

### 1. NextAuth.js Session & JWT Strategy

**Decision**: Use NextAuth.js v4+ with session callbacks for JWT embedding and refresh.

**Rationale**: NextAuth.js is the constitutional mandate (Principle V). Modern approach:
- NextAuth stores session in database (Prisma adapter); JWT is derived from session
- Custom callbacks generate JWT during `jwt()` callback; refresh tokens handled server-side
- Client receives JWT in `Authorization` header or secure HTTP-only cookie (framework-dependent)
- Token refresh: Server sends new token in custom response header (`X-Auth-Token`) on API calls near expiry
- No separate refresh token table needed initially; NextAuth session expiry doubles as JWT expiry

**Alternatives Considered**:
- Manual JWT Library (jsonwebtoken): Requires manual session management, contradicts NextAuth mandate
- OAuth2 Implicit Grant: Over-complex for internal portal; session-based simpler for MVP
- Store refresh tokens separately: Added complexity; NextAuth session-derived tokens sufficient for 24h window

**Implementation Path**:
```typescript
// lib/auth/token.ts exports:
- generateJWT(userId: string, expiresIn: '24h'): Promise<string>
- validateJWT(token: string): Promise<JWTPayload | null>
- refreshToken(token: string): Promise<string | null>  // Returns new token if <5min remaining

// server/auth/callbacks.ts:
- jwt() callback: Embed user data + expiry
- session() callback: Return session with JWT
- signIn() callback: Enforce rate limiting + log attempts
```

---

### 2. Password Hashing Algorithm Selection

**Decision**: Use bcrypt with cost factor 12 (industry standard).

**Rationale**: 
- bcrypt is built for password hashing (adaptive, salted by default)
- Cost factor 12 = ~250ms per hash (acceptable for registration/password reset)
- Well-tested, integrated with NextAuth.js ecosystem (e.g., `next-auth/adapters` examples use bcrypt)
- Resists GPU/ASIC attacks better than SHA-2 or MD5

**Alternatives Considered**:
- argon2: Stronger, but requires native module (build complexity on Vercel); bcrypt sufficient for MVP
- PBKDF2: Slower than bcrypt for same security; deprecated in favor of bcrypt/argon2
- Scrypt: Less widely adopted; bcrypt proven in production

**Implementation Path**:
```typescript
// lib/auth/password.ts:
- hashPassword(plainText: string): Promise<string>  // bcrypt.hash(pwd, 12)
- verifyPassword(plainText: string, hash: string): Promise<boolean>  // bcrypt.compare()
- validatePasswordStrength(pwd: string): { valid: boolean; errors: string[] }
```

---

### 3. Rate Limiting & Progressive Delays (FR-017)

**Decision**: Store per-user failed login attempt counter + timestamp in PostgreSQL; reset after 1 hour.

**Rationale**:
- Simplest approach: `User.lastFailedLoginAt` + counter in separate table or cached
- Scalable to thousands of users (PostgreSQL handles easily)
- Prevents account lockout (no hard block) while adding friction to brute force
- 1-hour reset window is reasonable (balances security vs user experience)

**Delay Formula** (based on spec FR-017):
- 1st failure: 1s delay before next attempt
- 2nd failure: 2s delay
- 3rd+ failure: 4s delay
- **Reset**: If >1 hour since last failure OR successful login, reset counter to 0

**Alternatives Considered**:
- Redis cache: Overkill for MVP; adds dependency not in constitution
- In-memory counter: Lost on process restart; not suitable for Vercel serverless
- IP-based rate limiting: Doesn't work for shared networks; user-based is clearer

**Implementation Path**:
```typescript
// Prisma schema:
model FailedLoginAttempt {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  timestamp DateTime @default(now())
  
  @@index([userId, timestamp])
}

// lib/auth/rate-limiter.ts:
- recordFailedLogin(userId: string): Promise<number>  // Returns delay in seconds
- resetFailedLogins(userId: string): Promise<void>
- getDelayForUser(userId: string): Promise<number>  // 0, 1, 2, or 4 seconds
```

---

### 4. Email Service Integration

**Decision**: Abstract email service behind interface; implement with SendGrid/Resend for MVP; configurable via environment variables.

**Rationale**:
- Specification assumes email service available (Assumption section)
- Abstraction allows swapping implementations (AWS SES, custom SMTP) without changing auth logic
- SendGrid/Resend have free tiers; easy Vercel integration
- Silent failure with generic success message (FR-020) prevents email enumeration

**Alternatives Considered**:
- Direct SMTP: Vercel doesn't support outbound email; requires external service anyway
- Built-in Node.js mail: Requires configuration; abstract service cleaner
- Mailbox simulator for dev: Good for testing but doesn't replicate production email logic

**Implementation Path**:
```typescript
// lib/auth/email.ts:
interface IEmailService {
  sendConfirmationEmail(email: string, token?: string): Promise<{ success: boolean; error?: string }>
  sendPasswordResetEmail(email: string, resetToken: string, resetUrl: string): Promise<{ success: boolean; error?: string }>
}

// Implementation uses environment variables:
// NEXT_PUBLIC_EMAIL_SERVICE (SendGrid|Resend|SMTP)
// FOR SENDGRID: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
// FOR RESEND: RESEND_API_KEY, RESEND_FROM_EMAIL
```

**Error Handling for Email Delivery** (FR-020):
- Catch email service errors silently
- Log to structured logger (console.error or external service)
- Always return generic success: "If the email exists, a reset link has been sent"
- Admin dashboard can query email-delivery logs for manual retry

---

### 5. Session Persistence & Multiple Concurrent Sessions (FR-018)

**Decision**: Leverage NextAuth.js session adapter (Prisma) + one JWT per login session.

**Rationale**:
- NextAuth.js Prisma adapter automatically manages session records
- Each login on a different device creates a new session + independent JWT
- Session table indexed by `userId` + `sessionToken` → supports parallel queries
- Logout invalidates specific session; doesn't affect other devices

**Alternatives Considered**:
- User-level session invalidation: Would log out all devices (not spec requirement)
- Custom session manager: Reinvents NextAuth.js; violates Principle V
- No session storage (stateless JWT only): Harder to implement logout invalidation (FR-009)

**Implementation Path**:
```prisma
// Prisma adapter auto-generates:
model Session {
  id            String   @id @default(cuid())
  sessionToken  String   @unique
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expires       DateTime
  jwt           String   // Store JWT directly for refresh
  
  @@index([userId])
}
```

---

### 6. Token Refresh Mechanism (<5 minutes remaining, FR-019)

**Decision**: Check token expiry on every API request; if <5min remaining, inject new token in response header.

**Rationale**:
- Simple to implement: Middleware decodes token, calculates remaining time, regenerates if needed
- Transparent to client: Client library checks response header, stores new token
- No extra round-trip: Refresh happens on existing request
- Fails gracefully: If refresh fails, existing token still works (already valid)

**Client-Side Implementation** (framework-dependent, documented in quickstart.md):
```typescript
// Example in Axios interceptor or Next.js fetch wrapper:
const response = await fetch('/api/protected', { headers: { Authorization: `Bearer ${token}` } });
if (response.headers.get('X-Auth-Token')) {
  localStorage.setItem('authToken', response.headers.get('X-Auth-Token'));
}
```

**Alternatives Considered**:
- Separate refresh endpoint: Requires extra round-trip; slower UX (rejected)
- Refresh on timer client-side: Client complexity; doesn't work for inactive users (simpler is better)
- Automatic logout at 24h: Breaks user experience if they're actively using the system

**Implementation Path**:
```typescript
// middleware.ts or API route handler:
- Decode JWT from Authorization header
- If decoded: expiresAt - now < 5 minutes
  - Call generateJWT() to create new token
  - Attach to response header: `X-Auth-Token: <new-token>`
```

---

### 7. Error Messages & Security (Generic Responses)

**Decision**: Use generic "Invalid credentials" for login/registration errors; generic "If the email exists..." for password reset.

**Rationale**:
- Prevents email enumeration: Attacker can't distinguish valid vs invalid emails
- Protects user privacy: No leakage of which emails are registered
- Spec explicitly requires this (FR-002 login, FR-020 password reset)

**Alternatives Considered**:
- Detailed error messages (e.g., "Email not found"): Useful for UX but violates security requirement
- Separate endpoint to check if email exists: XSS risk; requires separate rate limiting

**Implementation Path**:
```typescript
// All auth error responses return generic messages:
- 400 Bad Request: { "error": "Invalid email or password" }  // Covers user not found, wrong password, invalid format
- For password reset: { "message": "If the email exists, a reset link has been sent" }
```

---

### 8. Testing Strategy for NextAuth Flows

**Decision**: Test NextAuth callbacks in unit tests (mock Prisma); integration tests with real test database; e2e tests with Playwright.

**Rationale**:
- NextAuth is complex; unit testing callbacks with mocks catches logic errors early
- Integration tests with test PostgreSQL (via Docker/testcontainers) validate Prisma + NextAuth together
- E2e tests validate full browser login flow (cookie handling, redirects)
- Follows constitutional Testing Pyramid: 80% unit → 15% integration → 5% e2e

**Alternatives Considered**:
- Mock NextAuth entirely in tests: Defeats purpose; doesn't validate real behavior
- Only e2e tests: Slow feedback loop; hard to isolate bugs
- Skip integration tests: Missing coverage of Prisma queries + NextAuth adapters

**Implementation Path**:
```typescript
// tests/unit/server/auth/callbacks.test.ts:
- Test jwt() callback: User data → JWT payload
- Test session() callback: Session → user object
- Test signIn() callback: Rate limiting logic

// tests/integration/api/auth/login.test.ts:
- POST /api/auth/login → check session created in DB
- Verify password hash comparison
- Verify token expiry set to 24h

// tests/e2e/auth.spec.ts:
- Browser login flow → dashboard access
- Cookies set correctly
- Refresh behavior verified
```

---

### 9. Password Reset Token Expiry & Invalidation

**Decision**: Password reset tokens expire after 24 hours; mark as `used: true` after successful reset to prevent replay.

**Rationale**:
- 24-hour window matches JWT expiry (consistent mental model)
- Replay protection: Token can't be used twice (mark as used)
- Simplicity: No separate token blacklist needed

**Alternatives Considered**:
- Shorter expiry (1 hour): User frustration if they forget email quickly; 24h matches spec assumption
- Reusable tokens: Security risk; malicious redirect could capture token + email
- Separate blacklist table: Over-engineered; single `used` boolean sufficient

**Implementation Path**:
```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique  // Cryptographically random, e.g., crypto.randomBytes(32).toString('hex')
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  expiresAt DateTime  // createdAt + 24h
  isUsed    Boolean  @default(false)
  
  @@index([userId])
}
```

---

### 10. Authentication Logging & Compliance (FR-015)

**Decision**: Log all auth events (register, login, logout, password reset, token refresh) to AuthLog table.

**Rationale**:
- Constitutional requirement: "All authentication audit logs are created and queryable for security review" (SC-009)
- Enables breach investigation, brute force detection
- Admin dashboard can query logs

**Fields to Log**:
- `userId`, `action` (register|login|logout|password_reset|token_refresh), `timestamp`
- Optional: `ipAddress` (if available in request context), `userAgent`
- Sensitive: Passwords NEVER logged; tokens anonymized

**Implementation Path**:
```prisma
model AuthLog {
  id        String   @id @default(cuid())
  userId    String?  // Nullable for registration (no user yet) or unknown IPs
  action    String   // 'register', 'login', 'logout', 'password_reset', 'token_refresh'
  ipAddress String?
  userAgent String?
  timestamp DateTime @default(now())
  status    String   // 'success', 'failed'
  reason    String?  // e.g., 'invalid_password', 'user_not_found', 'token_expired'
  
  @@index([userId, timestamp])
  @@index([action, timestamp])
}
```

---

## Summary: Resolved Questions

| Question | Resolution |
|----------|-----------|
| How to implement JWT refresh? | Server-side refresh on API response; inject new token in header |
| Store refresh tokens separately? | No; use NextAuth session expiry as JWT expiry |
| Rate limiting strategy? | Database counter per user; reset after 1 hour inactivity |
| Password hashing algorithm? | bcrypt with cost factor 12 |
| Email service abstraction? | Interface with SendGrid/Resend implementation; silent failure |
| Multiple sessions support? | NextAuth Prisma adapter handles; one JWT per session |
| Token refresh latency? | <5 minute check on every API call; no extra round-trip |
| Generic error messages? | Yes; prevents email enumeration and user enumeration |
| Password reset token life? | 24 hours; marked as used after successful reset |
| Auth logging scope? | All events logged to AuthLog; no passwords/tokens in logs |

---

## Next Steps (Phase 1)

1. **data-model.md**: Define Prisma schema with User, Session, PasswordResetToken, FailedLoginAttempt, AuthLog
2. **contracts/api-auth.md**: Document REST API endpoints (register, login, logout, reset, refresh)
3. **contracts/session.md**: Document JWT structure, session object, token refresh protocol
4. **quickstart.md**: Implementation guide for developers (NextAuth setup, database migrations, email config)
5. **Agent context update**: Run `update-agent-context.sh copilot` to register NextAuth.js, Prisma, bcrypt
