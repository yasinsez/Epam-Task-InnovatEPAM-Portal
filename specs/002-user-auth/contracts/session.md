# Session Contract: JWT Structure & Session Management

**Phase 1 Output** | Session and token specification  
**Date**: 2026-02-24 | **Feature**: User Authentication (002-user-auth)

## Overview

This document defines the JWT token structure, session lifecycle, and token refresh protocol for the InnovatEPAM Portal authentication system.

**Technology Stack**: 
- **Session Manager**: NextAuth.js v4+
- **Token Type**: JWT (JSON Web Token)
- **Signing Algorithm**: HS256 (HMAC with SHA256)
- **Token Expiry**: 24 hours from issuance (FR-007)
- **Refresh Strategy**: Automatic, server-initiated (FR-019)

---

## JWT Token Structure

### Header

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload (Claims)

```json
{
  "sub": "user-cuid-123",
  "email": "emp123@epam.com",
  "name": "John Doe",
  "iat": 1632429600,
  "exp": 1632516000,
  "iss": "innovatepam-portal",
  "aud": "innovatepam-portal-api"
}
```

**Claims Reference**:

| Claim | Type | Required | Description |
|-------|------|----------|-------------|
| `sub` | string | Yes | Subject: User ID (cuid) |
| `email` | string | Yes | User's registered email |
| `name` | string | No | User's full name (from User.name) |
| `iat` | number | Yes | Issued at: Unix timestamp of token creation |
| `exp` | number | Yes | Expiration: `iat + 86400` (24 hours in seconds) |
| `iss` | string | Yes | Issuer: "innovatepam-portal" (identifies token source) |
| `aud` | string | Yes | Audience: "innovatepam-portal-api" (identifies token consumer) |

### Signature

```
HMAC-SHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  SECRET_KEY
)
```

**Secret Key Management**:
- Stored in environment variable: `NEXTAUTH_SECRET` (set by platform)
- Never hardcoded; rotated regularly
- 32+ bytes of cryptographically random data

### Complete Token Example

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiJ1c2VyLWN1aWQtMTIzIiwiZW1haWwiOiJlbXAxMjNAZXBhbS5jb20iLCJuYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE2MzI0Mjk2MDAsImV4cCI6MTYzMjUxNjAwMCwiaXNzIjoiaW5ub3ZhdGVwYW0tcG9ydGFsIiwiYXVkIjoiaW5ub3ZhdGVwYW0tcG9ydGFsLWFwaSJ9.
SIGNATURE_HERE
```

### Token Validation Rules

**Required Checks** (must pass all or token is rejected):

1. **Signature Valid**: Verify HMAC using NEXTAUTH_SECRET
2. **Not Expired**: `exp > current_unix_timestamp`
3. **Issuer Correct**: `iss == "innovatepam-portal"`
4. **Audience Correct**: `aud == "innovatepam-portal-api"`
5. **Required Claims Present**: `sub`, `email`, `exp`, `iat`, `iss`, `aud`

**Failure Response**: 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

## Session Lifecycle

### State Machine

```
┌─────────────┐
│   Login     │  User submits email + password
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ Session Created         │  NextAuth creates session in DB
│ - sessionToken          │  - JWT issued
│ - expiresAt = now+24h   │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Active Session          │  User makes API requests
│ Token < 5min expiry     │  Token passes validation
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Token Near Expiry       │  On any API request:
│ <5 minutes remaining    │  If exp - now < 300s:
└──────┬──────────────────┘
       │
       ├─ New token issued
       │
       ▼
┌─────────────────────────┐
│ Token Refreshed         │  New token in response header
│ expiresAt extended 24h  │  Client stores new token
└──────┬──────────────────┘
       │
       ├─ Session Expires
       │  (24h passed)
       │
       ▼
┌─────────────────────────┐
│ Session Expired         │  Token no longer valid
│ exp < now               │  API requests return 401
└──────┬──────────────────┘
       │
       ├─ User Re-authenticates
       │
       ▼
┌─────────────────────────┐
│ Logged Out (explicit)   │  User clicks logout
│ Session Invalidated     │  sessionToken deleted/expired
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ No Valid Session        │  All requests return 401
│ Redirect to /auth/login │
└─────────────────────────┘
```

### State Details

#### 1. Login (Initial Authentication)

**Trigger**: User submits credentials to `POST /api/auth/login`

**Actions**:
- Validate email + password against User table
- On success:
  - Create Session record with `expiresAt = now + 24h`
  - Generate JWT per Payload spec above
  - Store JWT in Session.jwt (for refresh tracking)
  - Return JWT in response

**Response Headers**:
```http
Set-Cookie: next-auth.session-token=<sessionToken>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400
X-Auth-Token: <JWT_TOKEN>
```

**JWT Issued At**: `iat` = current Unix timestamp  
**JWT Expires At**: `exp` = `iat + 86400` seconds

---

#### 2. Active Session

**State**: Session exists in DB; JWT valid and not expired

**Behavior**: 
- Client includes JWT in `Authorization: Bearer <JWT>` header
- API middleware validates JWT before processing request
- If token invalid/expired: Return 401 Unauthorized

**Validation Logic** (pseudocode):
```typescript
function validateToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, NEXTAUTH_SECRET, {
      algorithms: ['HS256'],
      issuer: 'innovatepam-portal',
      audience: 'innovatepam-portal-api'
    });
    
    // All checks passed
    return decoded;
  } catch (error) {
    // Token invalid, expired, or signature mismatch
    return null;
  }
}
```

---

#### 3. Token Refresh (<5 minutes remaining)

**Trigger**: Any API request when `exp - now < 300 seconds` (5 minutes)

**Actions**:
- Check token expiry on every API request
- If `exp - now < 300`:
  - Generate new JWT (same user data, new `iat` + `exp`)
  - Update Session.jwt with new token
  - Update Session.expiresAt = now + 24h
  - Include new token in response header

**Implementation Pattern** (middleware):

```typescript
// middleware.ts or API route wrapper
export async function withAuthRefresh(req: Request, handler: Function) {
  const token = extractJWT(req);
  
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  const decoded = validateToken(token);
  if (!decoded) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  // Calculate remaining time
  const now = Math.floor(Date.now() / 1000);
  const remaining = decoded.exp - now;
  
  // If less than 5 minutes, refresh
  let response = await handler(req, decoded);
  if (remaining < 300) {
    const newToken = generateJWT(decoded.sub, decoded.email, decoded.name);
    response.headers.set('X-Auth-Token', newToken);
  }
  
  return response;
}
```

**Response Header**:
```http
X-Auth-Token: <NEW_JWT_TOKEN>
```

**Client-Side Handler** (example):

```typescript
// interceptors/auth.ts
export function setupAuthInterceptor() {
  // Example using fetch wrapper
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    let response = await originalFetch.apply(this, args);
    
    // Check for refreshed token in response
    const newToken = response.headers.get('X-Auth-Token');
    if (newToken) {
      localStorage.setItem('authToken', newToken);
      // Update default Authorization header for next request
    }
    
    return response;
  };
}
```

---

#### 4. Session Expiry (24 hours)

**Trigger**: Current time >= `exp` timestamp

**Behavior**:
- Token validation fails: `exp < now`
- API returns 401 Unauthorized
- Session record remains in DB (audit trail; deleted after 7 days)
- Client should redirect user to login page

**Response**:
```http
HTTP/1.1 401 Unauthorized
{
  "success": false,
  "error": "Unauthorized"
}
```

---

#### 5. Logout (Explicit Invalidation)

**Trigger**: User clicks "Logout" button → calls `POST /api/auth/logout`

**Actions**:
- Delete or invalidate Session record from DB
- Clear JWT from client storage
- Redirect to login page

**Implementation**:

```typescript
// server/api/auth/logout/route.ts
export async function POST(req: Request) {
  const token = extractJWT(req);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  const decoded = validateToken(token);
  if (!decoded) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  // Delete session from database
  await prisma.session.deleteMany({
    where: { userId: decoded.sub }
  });
  
  // Log logout event
  await prisma.authLog.create({
    data: {
      userId: decoded.sub,
      action: 'logout',
      status: 'success'
    }
  });
  
  return new Response(JSON.stringify({ success: true, message: 'Logged out successfully' }));
}
```

---

## Multiple Concurrent Sessions (FR-018)

### Scenario

User logs in on Device A, then logs in on Device B. Both should have independent, active sessions.

**On Device A** (after login):
```
Session A (DB):
- userId: user-123
- sessionToken: token-abc
- jwt: JWT-A
- expiresAt: 2026-02-25T10:00Z
```

**On Device B** (after login):
```
Session B (DB):
- userId: user-123
- sessionToken: token-xyz
- jwt: JWT-B
- expiresAt: 2026-02-25T10:00Z
```

**Database Query** (Prisma):
```typescript
// Fetch all active sessions for a user
const sessions = await prisma.session.findMany({
  where: {
    userId: 'user-123',
    expiresAt: { gt: new Date() }  // Not yet expired
  }
});
// Returns: [Session A, Session B]
```

### Logout Behavior

**Logout from Device A**:
- Delete Session A from database
- Device A's JWT becomes invalid
- Device B's Session B still active
- Device B can continue using JWT-B

**Implementation**:
```typescript
// Only delete the specific sessionToken, not all sessions
await prisma.session.delete({
  where: { sessionToken: 'token-abc' }  // Delete only this session
});
```

### Session Revocation (Admin Feature, Future)

Admin can view and revoke specific sessions:
```typescript
// Admin endpoint (not public)
// GET /api/admin/sessions/<userId>  → List all sessions for user
// DELETE /api/admin/sessions/<sessionId>  → Revoke specific session
```

---

## Token Refresh Behavior

### Detailed Refresh Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Client makes request                                        │
│ Authorization: Bearer JWT-A (issued 20h ago, expires in 4h) │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ API Middleware receives request                             │
│ 1. Extract JWT from Authorization header                    │
│ 2. Validate signature, expiry, claims                       │
│ 3. Check: exp - now = 14400s (4 hours remaining)            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─ 4h > 5min? YES
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ No refresh needed                                           │
│ Process request normally                                    │
│ Return response without X-Auth-Token header                 │
└─────────────────────────────────────────────────────────────┘

---vs---

┌─────────────────────────────────────────────────────────────┐
│ Client makes request                                        │
│ Authorization: Bearer JWT-A (issued 23h 50m ago, expires in 10m) │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ API Middleware receives request                             │
│ 1. Extract JWT                                              │
│ 2. Validate all checks pass                                 │
│ 3. Check: exp - now = 600s (10 minutes remaining)           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─ 10m < 5min? NO, but close (within 5min window)
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Refresh token                                               │
│ 1. Generate new JWT-B: sub, email, name, iat=NOW, exp=NOW+24h │
│ 2. Update Session.jwt = JWT-B                               │
│ 3. Update Session.expiresAt = NOW + 24h                     │
│ 4. Process request                                          │
│ 5. Include X-Auth-Token: JWT-B in response header           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Response received by client                                 │
│ 1. Check response headers for X-Auth-Token                  │
│ 2. If present: localStorage.setItem('authToken', JWT-B)     │
│ 3. Update next request to use JWT-B                         │
└─────────────────────────────────────────────────────────────┘
```

### Client Implementation Pattern (Next.js)

```typescript
// lib/auth-client.ts
'use client';

import { useEffect } from 'react';

export function useAuthRefresh() {
  useEffect(() => {
    // Setup fetch interceptor
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const [resource, options] = args;
      
      // Add existing token to request
      const token = localStorage.getItem('authToken');
      if (token) {
        const headers = new Headers(options?.headers || {});
        headers.set('Authorization', `Bearer ${token}`);
        args[1] = { ...options, headers };
      }
      
      // Make request
      let response = await originalFetch.apply(this, args);
      
      // Check for refreshed token in response
      const newToken = response.headers.get('X-Auth-Token');
      if (newToken) {
        localStorage.setItem('authToken', newToken);
      }
      
      // Handle 401: redirect to login
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/auth/login';
      }
      
      return response;
    };
  }, []);
}
```

---

## Security Considerations

### Token Storage (Client)

**Recommended**:
1. **HttpOnly Cookie** (preferred): Set by server via Set-Cookie; inaccessible to JavaScript (protects against XSS)
2. **Secure Local Storage** (if no HttpOnly option): Encrypted local storage, with Content Security Policy

**Not Recommended**:
- Plain localStorage: Vulnerable to XSS attacks
- Session storage: Lost on tab close (bad for multi-tab support)
- In-memory: Lost on page refresh (bad UX)

### Token Transmission

**Always HTTPS**: JWT contains user identity; must not be transmitted over HTTP (Assumption in spec).

**Header Format**:
```http
Authorization: Bearer <JWT>
```

### Token Rotation

**Current Strategy**:
- No explicit rotation; tokens valid for 24 hours
- Refresh extends expiry on every request (sliding window)
- Logout invalidates immediately

**Future Enhancement**:
- Implement refresh token rotation (separate long-lived token)
- Bind tokens to device/IP (prevent token theft)

### CSRF Protection

**Next.js + NextAuth Handles Automatically**:
- CSRF tokens embedded in forms
- Same-site cookie policies enforced
- No manual CSRF implementation needed

---

## Monitoring & Observability

### Metrics to Track

1. **Token Refresh Rate**: How often tokens are refreshed (target: <10% of requests)
2. **Session Duration**: Average session length (target: varies by user)
3. **Token Expired Rate**: Requests with expired tokens (target: <1%)
4. **Refresh Failures**: Failed refresh operations (target: 0%)

### Logging

**Token Refresh Event**:
```json
{
  "action": "token_refresh",
  "status": "success",
  "userId": "user-123",
  "timestamp": "2026-02-24T10:00:00Z"
}
```

**Token Validation Failure**:
```json
{
  "action": "api_request",
  "status": "unauthorized",
  "reason": "token_expired",
  "timestamp": "2026-02-24T10:00:00Z"
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/unit/lib/auth/token.test.ts
describe('JWT Token', () => {
  test('should create token with correct expiry (24h)', () => {
    const token = generateJWT('user-123', 'emp@epam.com');
    const decoded = jwt.decode(token);
    expect(decoded.exp - decoded.iat).toBe(86400);
  });

  test('should validate token signature', () => {
    const token = generateJWT('user-123', 'emp@epam.com');
    const decoded = validateJWT(token);
    expect(decoded.sub).toBe('user-123');
  });

  test('should reject expired token', () => {
    const expiredToken = generateJWT('user-123', 'emp@epam.com', {
      expiresIn: '-1h'
    });
    expect(validateJWT(expiredToken)).toBeNull();
  });

  test('should identify refresh requirement (<5min)', () => {
    const tokenNearExpiry = generateJWT('user-123', 'emp@epam.com', {
      expiresIn: '4m'
    });
    const decoded = validateJWT(tokenNearExpiry);
    const remaining = decoded.exp - Math.floor(Date.now() / 1000);
    expect(remaining < 300).toBe(true);
  });
});
```

### Integration Tests

```typescript
// tests/integration/api/auth/session.test.ts
describe('Session Lifecycle', () => {
  test('should create session and JWT on login', async () => {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'emp@epam.com', password: 'pass' })
    });
    
    const token = resp.headers.get('X-Auth-Token');
    expect(token).toBeDefined();
    
    const session = await prisma.session.findUnique({
      where: { sessionToken: token }
    });
    expect(session).toBeDefined();
    expect(session.userId).toBe(expect.any(String));
  });

  test('should refresh token when <5min remaining', async () => {
    // Create token expiring in 4 minutes
    const oldToken = generateJWT('user-123', 'emp@epam.com', { expiresIn: '4m' });
    
    const resp = await fetch('/api/protected', {
      headers: { Authorization: `Bearer ${oldToken}` }
    });
    
    const newToken = resp.headers.get('X-Auth-Token');
    expect(newToken).toBeDefined();
    expect(newToken).not.toBe(oldToken);
  });

  test('should support multiple concurrent sessions', async () => {
    // Login from device A
    const respA = await fetch('/api/auth/login', {
      body: JSON.stringify({ email: 'emp@epam.com', password: 'pass' })
    });
    const tokenA = respA.headers.get('X-Auth-Token');
    
    // Login from device B
    const respB = await fetch('/api/auth/login', {
      body: JSON.stringify({ email: 'emp@epam.com', password: 'pass' })
    });
    const tokenB = respB.headers.get('X-Auth-Token');
    
    // Both should be valid
    expect(validateJWT(tokenA)).toBeDefined();
    expect(validateJWT(tokenB)).toBeDefined();
    
    // Sessions should be different
    const sessionA = await prisma.session.findUnique({ where: { jwt: tokenA } });
    const sessionB = await prisma.session.findUnique({ where: { jwt: tokenB } });
    expect(sessionA.id).not.toBe(sessionB.id);
  });
});
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-24 | Initial session contract; JWT structure, refresh protocol, multiple sessions |
