# Epam-Task-InnovatEPAM-Portal Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-24

## Active Technologies
- TypeScript 5.x (strict) on Node.js 18+ + Next.js 14 (App Router), NextAuth v4, Prisma ORM, zod (003-user-roles)
- PostgreSQL 14+ via Prisma (003-user-roles)
- TypeScript 5.x with Next.js 14+ (App Router) + React 18+, NextAuth v4+, Prisma ORM 5.x, React Hook Form (for form state management) (004-idea-submission-form)
- PostgreSQL 14+ via Prisma ORM (existing connection via `DATABASE_URL`) (004-idea-submission-form)
- TypeScript 5.8, JavaScript (ES2022) + NextAuth.js 4.24.11 (sessions), React 18.3.1, Tailwind CSS (via globals.css) (008-auth-landing-page)
- N/A (stateless page; uses NextAuth session checks) (008-auth-landing-page)

- TypeScript 5.x with `strict: true` + Next.js 14+, NextAuth.js v4+, Prisma ORM, PostgreSQL 14+ (002-user-auth)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x with `strict: true`: Follow standard conventions

## Recent Changes
- 008-auth-landing-page: Added TypeScript 5.8, JavaScript (ES2022) + NextAuth.js 4.24.11 (sessions), React 18.3.1, Tailwind CSS (via globals.css)
- 004-idea-submission-form: Added TypeScript 5.x with Next.js 14+ (App Router) + React 18+, NextAuth v4+, Prisma ORM 5.x, React Hook Form (for form state management)
- 003-user-roles: Added TypeScript 5.x (strict) on Node.js 18+ + Next.js 14 (App Router), NextAuth v4, Prisma ORM, zod


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
