# ADR-0001: Authentication - NextAuth + JWT

## Status

Accepted

## Context

The InnovatEPAM Portal requires user authentication to support role-based access (submitter, evaluator, admin), session management across API routes and Server Components, and secure credential storage. We needed an approach that integrates with Next.js App Router, supports custom auth routes (register, login, logout, password reset), and enables token-based API access with session revocation.

## Decision

Use **NextAuth.js v4** as the primary auth framework with **JWT** sessions and custom credential provider. Implement:

- Custom auth API routes for register, login, logout, forgot-password, reset-password, refresh, sessions, and session revoke
- JWT stored in HTTP-only cookie (`auth-token`) with 24-hour expiry
- Silent token refresh via `X-Auth-Token` header for API clients
- bcrypt for password hashing
- Progressive delay rate limiting for failed login attempts
- Concurrent multi-device sessions stored in database with per-session revoke capability

## Consequences

**Positive:**
- NextAuth provides session validation, callbacks, and middleware integration
- JWT enables stateless API validation and token refresh without full re-auth
- Custom routes allow full control over registration, password reset, and session lifecycle
- Rate limiting and bcrypt improve security posture

**Negative:**
- Custom auth layer adds complexity compared to a fully managed auth service
- JWT invalidation requires session table lookup for revoke; not fully stateless

**Neutral:**
- Constitution mandates NextAuth as sole auth mechanism; aligns with project governance
