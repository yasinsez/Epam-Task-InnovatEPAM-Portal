# ADR-0002: Database - PostgreSQL + Prisma ORM

## Status

Accepted

## Context

The InnovatEPAM Portal needs persistent storage for users, ideas, categories, evaluations, attachments, and sessions. We required a database that supports relations, migrations, type safety, and integration with Next.js API routes and Server Actions.

## Decision

Use **PostgreSQL 14+** as the database and **Prisma** as the exclusive ORM. All database access MUST go through Prisma; no raw SQL except with explicit security review.

- Prisma schema in `prisma/schema.prisma` with migrations versioned in `prisma/migrations/`
- Single Prisma client instance in `src/server/db/prisma.ts`
- All queries validated for returned schema and error conditions via JSDoc

## Consequences

**Positive:**
- Prisma provides type-safe queries, migrations, and schema introspection
- PostgreSQL offers ACID compliance, JSON support, and mature ecosystem
- Single ORM enforces consistent access patterns and eliminates SQL injection risk
- Constitution mandates Prisma as exclusive database abstraction

**Negative:**
- Requires PostgreSQL availability (Docker or hosted); no SQLite for zero-setup dev
- Complex queries may require raw SQL escape hatch (subject to review)

**Neutral:**
- Prisma seed script (`prisma/seed.mjs`) populates categories and dev users for local development
