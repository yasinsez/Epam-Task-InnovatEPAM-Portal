# API Contract: User Authentication Endpoints

**Phase 1 Output** | REST API specification  
**Date**: 2026-02-24 | **Feature**: User Authentication (002-user-auth)

## Overview

All authentication endpoints are RESTful HTTP APIs living under `/api/auth/`. Requests and responses use JSON. All endpoints require HTTPS in production.

**Base URL**: `https://innovatepam-portal.vercel.app/api/auth` (production)  
**Base URL**: `http://localhost:3000/api/auth` (development)

---

## Endpoint: POST /api/auth/register

**Purpose**: Create a new user account.  
**Priority**: P1 (User Story 1)  
**Implements**: FR-001, FR-002, FR-003, FR-004, FR-016

### Request

```http
POST /api/auth/register HTTP/1.1
Content-Type: application/json

{
  "email": "emp123@epam.com",
  "password": "SecurePass123"
}
```

**Request Body**:
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `email` | string | Yes | RFC 5322 format, max 254 chars, must be lowercase via `.toLowerCase()` |
| `password` | string | Yes | Minimum 8 characters, confirmed at client-side |

### Response

**Success (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully. Confirmation email sent.",
  "user": {
    "id": "user-cuid-123",
    "email": "emp123@epam.com",
    "createdAt": "2026-02-24T10:00:00Z"
  }
}
```

**Validation Error (400 Bad Request)** - Invalid Email:
```json
{
  "success": false,
  "error": "Invalid email format"
}
```

**Validation Error (400)** - Weak Password:
```json
{
  "success": false,
  "error": "Password must be at least 8 characters long"
}
```

**Conflict Error (409)** - Email Already Exists (FR-002):
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Server Error (500)**:
```json
{
  "success": false,
  "error": "An error occurred during registration"
}
```

### Side Effects

- User record created in database with hashed password (bcrypt, cost 12)
- Confirmation email queued to `email` address (send async, don't wait)
- AuthLog entry: { action: "register", status: "success" }
- If email send fails: AuthLog entry: { action: "register", status: "success" } (silent failure)

### Error Handling

- **Invalid email**: Use generic "Invalid email or password" (don't reveal which is wrong)
- **Email already exists**: Return same generic error (prevent email enumeration)
- **Email send failure**: Log error internally; return success to user (silent failure, FR-020)
- **Database error**: Log error; return generic 500 message

---

## Endpoint: POST /api/auth/login

**Purpose**: Authenticate user and create session with JWT token.  
**Priority**: P1 (User Story 2)  
**Implements**: FR-005, FR-006, FR-007, FR-017

### Request

```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "emp123@epam.com",
  "password": "SecurePass123"
}
```

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | RFC 5322 format |
| `password` | string | Yes | Plaintext (HTTPS required) |

### Response

**Success (200 OK)**:
```http
HTTP/1.1 200 OK
Set-Cookie: next-auth.session-token=abc123...; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400
X-Auth-Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLWN1aWQtMTIzIiwiaWF0IjoxNjMyNDI5NjAwLCJleHAiOjE2MzI1MTYwMDB9.SIGNATURE
Content-Type: application/json

{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user-cuid-123",
    "email": "emp123@epam.com",
    "name": "John Doe"
  }
}
```

**Invalid Credentials (401 Unauthorized)** - Generic message (prevent enumeration):
```json
{
  "success": false,
  "error": "Invalid email or password",
  "delaySeconds": 0
}
```

**Rate Limited (429 Too Many Requests)** - FR-017 Exponential Backoff:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 4

{
  "success": false,
  "error": "Too many login attempts. Please try again in 4 seconds.",
  "delaySeconds": 4
}
```

### Key Details

- **JWT Token Expiry**: Exactly 24 hours from issue time (FR-007)
- **JWT Structure** (see session contract):
  ```
  {
    "sub": "user-cuid-123",
    "email": "emp123@epam.com",
    "iat": 1632429600,
    "exp": 1632516000
  }
  ```
- **Session Storage**: NextAuth creates session in database; token returned in both Set-Cookie AND X-Auth-Token header
- **Rate Limiting** (FR-017): If 2+ failed attempts in last hour:
  - 1st failure: No delay on next attempt, but record failure
  - 2nd failure: Apply 1-second delay before accepting next attempt
  - 3rd+ failure: Apply 2-second delays (exponential: 1s → 2s → 4s)
  - Resets after 1 hour of no failures OR successful login

### Side Effects

- Session created in database with expiry = now + 24h
- AuthLog entry: { action: "login", status: "success", userId }
- Update User.lastLoginAt
- On failure: AuthLog entry: { action: "login", status: "failed", reason: "invalid_password" }
- On failure: FailedLoginAttempt record created; increment delay counter

---

## Endpoint: POST /api/auth/logout

**Purpose**: Invalidate user's current session.  
**Priority**: P1 (User Story 3)  
**Implements**: FR-009, FR-010

### Request

```http
POST /api/auth/logout HTTP/1.1
Authorization: Bearer <JWT_TOKEN>
```

**Headers**:
| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token from login response |

### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Unauthorized (401)** - Missing or Invalid Token:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### Side Effects

- Session invalidated in database (delete or mark as expired)
- AuthLog entry: { action: "logout", status: "success", userId }
- Client removes JWT from storage
- Subsequent API calls with this token will return 401

---

## Endpoint: GET /api/auth/session (Optional for Client)

**Purpose**: Get current user session details (used by client for verification).  
**Implements**: FR-010 (verify valid token)

### Request

```http
GET /api/auth/session HTTP/1.1
Authorization: Bearer <JWT_TOKEN>
```

### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "user-cuid-123",
    "email": "emp123@epam.com",
    "name": "John Doe"
  },
  "expiresAt": "2026-02-25T10:00:00Z"
}
```

**Unauthorized (401)**:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

## Endpoint: POST /api/auth/forgot-password

**Purpose**: Request password reset email.  
**Priority**: P2 (User Story 4)  
**Implements**: FR-011, FR-020

### Request

```http
POST /api/auth/forgot-password HTTP/1.1
Content-Type: application/json

{
  "email": "emp123@epam.com"
}
```

### Response

**Always Returns (200 OK)** - Generic message (prevent enumeration):
```json
{
  "success": true,
  "message": "If the email exists, a reset link has been sent"
}
```

### Implementation Notes

- **Email Validation**: Check if email exists in User table
  - If exists: Generate PasswordResetToken (24h expiry) and queue email
  - If not exists: Do nothing, but return same success message (FR-020)
- **Email Content**:
  ```
  Subject: Reset your InnovatEPAM Portal password
  
  Hi there,
  
  You requested to reset your password. Click the link below to set a new password:
  https://innovatepam-portal.vercel.app/auth/reset-password?token=TOKEN_HERE
  
  This link expires in 24 hours.
  ```
- **Email Delivery**: Async queue; don't wait for email service response
- **Email Failure**: Log error internally; never tell user if email failed (FR-020)

### Side Effects

- PasswordResetToken created in database if email exists
- Email queued via SendGrid/Resend/SMTP (async)
- AuthLog entry: { action: "password_reset", status: "success" } (regardless of email send success)
- If email send fails: Logged for admin review; user still sees success message

---

## Endpoint: POST /api/auth/reset-password

**Purpose**: Set new password using reset token.  
**Priority**: P2 (User Story 4)  
**Implements**: FR-012, FR-013, FR-014

### Request

```http
POST /api/auth/reset-password HTTP/1.1
Content-Type: application/json

{
  "token": "abc123de4f5g6h7i8j9k0l1m2n3o4p5q",
  "newPassword": "NewSecurePass456"
}
```

**Request Body**:
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `token` | string | Yes | Must match valid PasswordResetToken |
| `newPassword` | string | Yes | Minimum 8 characters |

### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password."
}
```

**Invalid Token (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Invalid or expired reset token"
}
```

**Expired Token (400)**:
```json
{
  "success": false,
  "error": "Password reset link has expired. Please request a new one."
}
```

**Token Already Used (400)**:
```json
{
  "success": false,
  "error": "This reset link has already been used. Request a new one."
}
```

### Side Effects

- User.passwordHash updated with new bcrypt hash
- PasswordResetToken.isUsed = true
- PasswordResetToken.usedAt = now()
- All existing sessions for this user invalidated (user must re-login)
- AuthLog entry: { action: "password_reset", status: "success", userId }

---

## Endpoint: POST /api/auth/refresh-token (Internal)

**Purpose**: Refresh JWT token when expiry approaches.  
**Implements**: FR-019 (automatic refresh)

**Note**: This is typically called automatically by middleware on every API request, NOT directly by client.

### Request

```http
POST /api/auth/refresh-token HTTP/1.1
Authorization: Bearer <JWT_TOKEN>
X-Refresh-Required: true
```

### Response

**Success with Refreshed Token (200 OK)**:
```http
HTTP/1.1 200 OK
X-Auth-Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_TOKEN_PAYLOAD.SIGNATURE

{
  "success": true,
  "message": "Token refreshed"
}
```

**Success, No Refresh Needed (200 OK)**:
```json
{
  "success": true,
  "message": "Token valid, no refresh needed"
}
```

### Implementation Notes

- **Automatic Refresh**: API middleware checks token expiry on every request
- **Refresh Condition**: If `expiresAt - now < 5 minutes` (FR-019):
  - Generate new JWT with same user data + 24h expiry
  - Include new token in response header
  - Client extracts header and stores new token
- **Side Effects**: AuthLog entry: { action: "token_refresh", status: "success" }

---

## Common Request/Response Patterns

### Authentication Header Format

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWN1aWQtMTIzIiwiaWF0IjoxNjMyNDI5NjAwLCJleHAiOjE2MzI1MTYwMDB9.SIGNATURE
```

### Error Response Format

All errors follow this structure:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "error_code"  // Optional: for programmatic handling
}
```

### CORS Headers

```http
Access-Control-Allow-Origin: https://innovatepam-portal.vercel.app
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Rate Limiting Headers

```http
X-RateLimit-Limit: 15
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1632429660
```

---

## Security Considerations

1. **HTTPS Required**: All endpoints require HTTPS in production (enforced by framework + server config)
2. **Password Transmission**: Passwords sent as plaintext in JSON body (HTTPS protects in transit)
3. **Token Storage**: Clients store JWT in HttpOnly cookies (preferred) or secure local storage
4. **Token Expiry**: 24 hours (FR-007); no eternal tokens
5. **Generic Error Messages**: "Invalid email or password" prevents user enumeration
6. **Rate Limiting**: Progressive delays per user (FR-017) prevent brute force
7. **CSRF Protection**: NextAuth handles CSRF tokens automatically
8. **Logging**: Passwords never logged; tokens anonymized in audit logs

---

## Testing Strategy

### Unit Tests
- Input validation (email format, password length)
- JWT creation/validation logic
- Rate limiting delay calculation

### Integration Tests
- Registration complete flow: submit form → user created → email queued
- Login complete flow: invalid password → delay applied → successful login → session created
- Password reset: forgot password → token created → reset form → password changed → login with new password
- Token expiry: Make API call near expiry → token refreshed → new token in header

### E2E Tests (Playwright)
- User registration journey: navigate to /auth/register → fill form → verify success/error
- Login journey: navigate to /auth/login → submit credentials → redirect to dashboard
- Logout: Click logout button → redirected to login → protected pages return 401

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-24 | Initial API contract; 6 endpoints defined |
| 2.0 (Planned) | Later | Add session listing endpoint for admin dashboard |
