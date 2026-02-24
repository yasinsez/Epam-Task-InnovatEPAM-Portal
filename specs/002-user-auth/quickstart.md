# Quick Start: User Authentication System Implementation

**Phase 1 Output** | Developer guide for implementing auth module  
**Date**: 2026-02-24 | **Feature**: User Authentication (002-user-auth)

## Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL 14+ database (local or cloud)
- Environment variables configured

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│ Frontend (Next.js App Router)                                │
│ - /app/auth/login, /app/auth/register, etc.                  │
│ - Client-side form validation                                │
│ - JWT storage & refresh handling                             │
└────────────────┬─────────────────────────────────────────────┘
                 │ HTTP/HTTPS
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ API Routes & Middleware (Next.js Server Routes)              │
│ - /api/auth/* endpoints                                      │
│ - NextAuth.js session management                             │
│ - JWT validation middleware                                  │
│ - Token refresh logic                                        │
└────────────────┬─────────────────────────────────────────────┘
                 │ Database Queries
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ Business Logic Layer (lib/auth/)                             │
│ - Password hashing (bcrypt)                                  │
│ - Token generation/validation                                │
│ - Rate limiting (progressive delays)                         │
│ - Email service abstraction                                  │
│ - Validation utilities                                       │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ Prisma ORM (prisma/schema.prisma)                            │
│ - Database schema migrations                                 │
│ - Type-safe queries                                          │
├──────────────────────────────────────────────────────────────┤
│ PostgreSQL                                                   │
│ - User, Session, PasswordResetToken                          │
│ - FailedLoginAttempt, AuthLog                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Step 1: Environment Setup

### Create Environment File

Create `.env.local` in project root:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/innovatepam_portal"

# NextAuth Configuration
NEXTAUTH_SECRET="$(openssl rand -base64 32)"  # Generate random secret
NEXTAUTH_URL="http://localhost:3000"

# Email Service (choose one)
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@innovatepam-portal.com"

# Or Resend Emails:
RESEND_API_KEY="your-resend-api-key"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Database Connection

**Local PostgreSQL Setup** (macOS):

```bash
# Install PostgreSQL (if not already installed)
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Create database
createdb innovatepam_portal

# Create database user (optional)
createuser innovatepam_user -P  # Enter password when prompted

# Update connection string in .env.local
DATABASE_URL="postgresql://innovatepam_user:PASSWORD@localhost:5432/innovatepam_portal"
```

**Cloud Option** (Vercel PostgreSQL / Railway):
```bash
# Example Vercel PostgreSQL connection
DATABASE_URL="postgresql://default:PASSWORD@ep-xyz.us-east-1.postgres.vercel.com/verceldb"
```

---

## Step 2: Install Dependencies

```bash
npm install

# Core auth dependencies
npm install next-auth@^4 bcrypt jsonwebtoken

# Database ORM
npm install @prisma/client
npm install -D prisma

# Email service (choose one or both)
npm install @sendgrid/mail
npm install resend

# Validation
npm install zod

# Development
npm install -D @types/bcrypt @types/jsonwebtoken jest @testing-library/react @testing-library/jest-dom
```

---

## Step 3: Configure Prisma

### Initialize Prisma Schema

```bash
npx prisma init
```

This creates `prisma/schema.prisma`.

### Add Authentication Schema

Copy the schema from [data-model.md](./data-model.md#prisma-schema) into `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  // ... [rest of schema from data-model.md]
}

// ... [Session, PasswordResetToken, etc.]
```

### Run Initial Migration

```bash
npx prisma migrate dev --name init_auth_schema

# This will:
# 1. Create SQL migration file
# 2. Apply migration to database
# 3. Generate Prisma Client
```

### Verify Schema

```bash
npx prisma studio  # Opens web UI to browse database

# Or query from CLI:
npx prisma db seed  # If you have a seed file
```

---

## Step 4: Implement Authentication Services

### Create lib/auth/password.ts

```typescript
import bcrypt from 'bcrypt';

/**
 * Hashes a plaintext password using bcrypt with cost factor 12
 * @param plainPassword - The plaintext password to hash
 * @returns Promise<string> - The bcrypt hash (60 characters)
 * @throws Error if hashing fails
 * @example
 * const hash = await hashPassword('MyPassword123');
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(plainPassword, saltRounds);
}

/**
 * Verifies a plaintext password against a bcrypt hash
 * @param plainPassword - The plaintext password to verify
 * @param hash - The bcrypt hash to compare against
 * @returns Promise<boolean> - True if password matches, false otherwise
 * @example
 * const matches = await verifyPassword('MyPassword123', storedHash);
 */
export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hash);
}

/**
 * Validates password strength requirements
 * @param password - The password to validate
 * @returns Object with valid boolean and errors array
 * @example
 * const result = validatePasswordStrength('weak');
 * if (!result.valid) console.log(result.errors);
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Optional: Add complexity requirements
  // if (!/[A-Z]/.test(password)) {
  //   errors.push('Password must contain at least one uppercase letter');
  // }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Create lib/auth/token.ts

```typescript
import jwt from 'jsonwebtoken';
import { prisma } from '@/server/db/prisma';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || '';
const JWT_EXPIRY = '24h';
const REFRESH_THRESHOLD = 5 * 60; // 5 minutes in seconds

/**
 * Generates a new JWT token for a user
 * @param userId - The user's ID
 * @param email - The user's email
 * @param name - The user's name (optional)
 * @returns Promise<string> - The signed JWT token
 * @throws Error if JWT signing fails or secret is missing
 * @example
 * const token = await generateJWT('user-123', 'emp@epam.com', 'John Doe');
 */
export async function generateJWT(userId: string, email: string, name?: string): Promise<string> {
  if (!JWT_SECRET) {
    throw new Error('NEXTAUTH_SECRET environment variable is not set');
  }
  
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 86400; // 24 hours in seconds
  
  const token = jwt.sign(
    {
      sub: userId,
      email,
      name: name || undefined,
      iat: now,
      exp: now + expiresIn,
      iss: 'innovatepam-portal',
      aud: 'innovatepam-portal-api'
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );
  
  return token;
}

/**
 * Validates a JWT token and returns the decoded payload
 * @param token - The JWT token to validate
 * @returns object with user claims, or null if invalid/expired
 * @throws Nothing - returns null on any validation error
 * @example
 * const payload = validateJWT(token);
 * if (payload) console.log(payload.sub);
 */
export function validateJWT(token: string): any {
  if (!JWT_SECRET) {
    console.error('NEXTAUTH_SECRET not set');
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'innovatepam-portal',
      audience: 'innovatepam-portal-api'
    });
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Checks if a token is near expiry (<5 minutes) and refreshes if needed
 * @param token - The JWT token to check
 * @returns Promise<string | null> - New token if refreshed, null otherwise
 * @example
 * const newToken = await refreshTokenIfNeeded(oldToken);
 * if (newToken) {
 *   // Store new token on client
 * }
 */
export async function refreshTokenIfNeeded(token: string): Promise<string | null> {
  const decoded = validateJWT(token);
  if (!decoded) return null;
  
  const now = Math.floor(Date.now() / 1000);
  const remaining = decoded.exp - now;
  
  // If less than 5 minutes remaining, refresh
  if (remaining > 0 && remaining < REFRESH_THRESHOLD) {
    return await generateJWT(decoded.sub, decoded.email, decoded.name);
  }
  
  return null;
}
```

### Create lib/auth/rate-limiter.ts

```typescript
import { prisma } from '@/server/db/prisma';

/**
 * Records a failed login attempt for a user and returns delay in seconds
 * @param userId - The user who failed to login
 * @returns The number of seconds to delay the next attempt (0, 1, 2, or 4)
 * @example
 * const delay = await recordFailedLogin('user-123');
 * if (delay > 0) {
 *   // Enforce delay before next attempt
 *   setTimeout(() => { /* allow next attempt */ }, delay * 1000);
 * }
 */
export async function recordFailedLogin(userId: string): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 3600000);
  
  // Clean up old attempts
  await prisma.failedLoginAttempt.deleteMany({
    where: {
      userId,
      attemptAt: { lt: oneHourAgo }
    }
  });
  
  // Count recent failures
  const recentFailures = await prisma.failedLoginAttempt.count({
    where: {
      userId,
      attemptAt: { gt: oneHourAgo }
    }
  });
  
  // Create new failure record
  await prisma.failedLoginAttempt.create({
    data: {
      userId,
      reason: 'password_incorrect'
    }
  });
  
  // Return delay based on attempt count
  // After cleanup and before creating new record: recentFailures is count before this one
  const nextAttemptCount = recentFailures + 1;
  
  if (nextAttemptCount <= 1) return 0;      // 1st failure: no delay
  if (nextAttemptCount === 2) return 1;     // 2nd failure: 1s delay
  return 4;                                 // 3rd+ failure: 4s delay (exponential backoff)
}

/**
 * Resets failed login counter for a user (called on successful login)
 * @param userId - The user who successfully logged in
 * @example
 * await resetFailedLogins('user-123');
 */
export async function resetFailedLogins(userId: string): Promise<void> {
  await prisma.failedLoginAttempt.deleteMany({
    where: { userId }
  });
}

/**
 * Gets current delay for a user (without recording)
 * @param userId - The user to check
 * @returns The delay in seconds (0, 1, 2, or 4)
 * @example
 * const delay = await getDelayForUser('user-123');
 */
export async function getDelayForUser(userId: string): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 3600000);
  
  // Clean up old attempts
  await prisma.failedLoginAttempt.deleteMany({
    where: {
      userId,
      attemptAt: { lt: oneHourAgo }
    }
  });
  
  // Count recent failures
  const recentFailures = await prisma.failedLoginAttempt.count({
    where: {
      userId,
      attemptAt: { gt: oneHourAgo }
    }
  });
  
  if (recentFailures <= 1) return 0;
  if (recentFailures === 2) return 1;
  return 4;
}
```

### Create lib/utils/validators.ts

```typescript
/**
 * Validates email format per RFC 5322 standard
 * @param email - The email address to validate
 * @returns boolean - True if valid email format
 * @example
 * if (!isValidEmail('not-an-email')) {
 *   console.log('Invalid email');
 * }
 */
export function isValidEmail(email: string): boolean {
  // RFC 5322 simplified regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validates password meets minimum requirements
 * @param password - The password to validate
 * @returns Object with valid boolean and error message if invalid
 */
export function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  return { valid: true };
}
```

---

## Step 5: Implement API Routes

### Create server/api/auth/register/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { isValidEmail, isValidPassword } from '@/lib/utils/validators';
import { sendConfirmationEmail } from '@/lib/auth/email';

/**
 * POST /api/auth/register
 * Create a new user account
 * @param request - HTTP request with email and password in body
 * @returns JSON response with user data or error
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Validation
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    const passwordValid = isValidPassword(password);
    if (!passwordValid.valid) {
      return NextResponse.json(
        { success: false, error: passwordValid.error },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingUser) {
      // Generic error to prevent email enumeration
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 409 }
      );
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        createdAt: new Date()
      }
    });
    
    // Log registration
    await prisma.authLog.create({
      data: {
        userId: user.id,
        action: 'register',
        status: 'success'
      }
    });
    
    // Send confirmation email (async, don't wait)
    sendConfirmationEmail(user.email).catch(error => {
      console.error('Email send error:', error);
      // Log but don't fail registration
      prisma.authLog.create({
        data: {
          userId: user.id,
          action: 'register',
          status: 'failed',
          reason: 'email_send_failed'
        }
      }).catch(() => {});
    });
    
    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully. Confirmation email sent.',
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
```

### Create server/api/auth/login/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { generateJWT } from '@/lib/auth/token';
import { recordFailedLogin, resetFailedLogins, getDelayForUser } from '@/lib/auth/rate-limiter';
import { isValidEmail } from '@/lib/utils/validators';

/**
 * POST /api/auth/login
 * Authenticate user and create session
 * @param request - HTTP request with email and password
 * @returns Session token and JWT
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Validation
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Check delay (rate limiting)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (user) {
      const delay = await getDelayForUser(user.id);
      if (delay > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Too many login attempts. Please try again in ${delay} seconds.`,
            delaySeconds: delay
          },
          { status: 429, headers: { 'Retry-After': delay.toString() } }
        );
      }
    }
    
    // Generic error message (don't reveal if user exists)
    if (!user) {
      await prisma.authLog.create({
        data: {
          action: 'login',
          status: 'failed',
          reason: 'user_not_found'
        }
      });
      
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash);
    
    if (!passwordValid) {
      // Record failure
      const newDelay = await recordFailedLogin(user.id);
      
      await prisma.authLog.create({
        data: {
          userId: user.id,
          action: 'login',
          status: 'failed',
          reason: 'invalid_password'
        }
      });
      
      if (newDelay > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Too many login attempts. Please try again in ${newDelay} seconds.`,
            delaySeconds: newDelay
          },
          { status: 429, headers: { 'Retry-After': newDelay.toString() } }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Reset failure counter on success
    await resetFailedLogins(user.id);
    
    // Generate JWT
    const jwt = await generateJWT(user.id, user.email, user.name || undefined);
    
    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken: crypto.randomUUID(),
        jwt,
        expiresAt: new Date(Date.now() + 86400000) // 24 hours
      }
    });
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    // Log success
    await prisma.authLog.create({
      data: {
        userId: user.id,
        action: 'login',
        status: 'success'
      }
    });
    
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 200 }
    );
    
    // Set secure session cookie
    response.cookies.set('next-auth.session-token', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 // 24 hours
    });
    
    // Also return JWT in header for client-side refresh
    response.headers.set('X-Auth-Token', jwt);
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
```

---

## Step 6: Configure NextAuth.js

### Create server/auth/route.ts

```typescript
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/server/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { generateJWT } from '@/lib/auth/token';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      async authorize(credentials: any) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        
        if (!user) return null;
        
        const passwordValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!passwordValid) return null;
        
        return {
          id: user.id,
          email: user.email,
          name: user.name
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.jwt = await generateJWT(user.id, user.email || '', user.name || '');
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

## Step 7: Implement Tests

Create `tests/unit/lib/auth/password.test.ts`:

```typescript
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password';

describe('Password Authentication', () => {
  test('should hash password correctly', async () => {
    const password = 'SecurePassword123';
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBe(60); // bcrypt hash length
  });
  
  test('should verify correct password', async () => {
    const password = 'SecurePassword123';
    const hash = await hashPassword(password);
    const valid = await verifyPassword(password, hash);
    
    expect(valid).toBe(true);
  });
  
  test('should reject incorrect password', async () => {
    const password = 'SecurePassword123';
    const hash = await hashPassword(password);
    const valid = await verifyPassword('WrongPassword', hash);
    
    expect(valid).toBe(false);
  });
  
  test('should validate password strength', () => {
    const weak = validatePasswordStrength('weak');
    expect(weak.valid).toBe(false);
    expect(weak.errors.length).toBeGreaterThan(0);
    
    const strong = validatePasswordStrength('SecurePassword123');
    expect(strong.valid).toBe(true);
  });
});
```

---

## Step 8: Run & Test

```bash
# Run development server
npm run dev

# Access at http://localhost:3000

# Run tests
npm test

# Check database schema
npx prisma studio

# Create seed data (for development)
npx prisma db seed
```

---

## Next Steps

1. **Frontend Pages**: Create UI for `/auth/login`, `/auth/register`, `/auth/forgot-password`
2. **Protected Routes**: Add middleware to require authentication on dashboard pages
3. **Tests**: Implement integration and e2e tests from [data-model.md](./data-model.md#testing-considerations)
4. **Monitoring**: Set up logging and error tracking (e.g., Sentry)
5. **Deployment**: Deploy to Vercel with database connection

---

## Troubleshooting

### "NEXTAUTH_SECRET not set"
```bash
# Generate in .env.local:
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
```

### "DATABASE_URL not set"
```bash
# Ensure .env.local has DATABASE_URL configured
cat .env.local | grep DATABASE_URL
```

### "Prisma Client not generated"
```bash
# Regenerate:
npx prisma generate
```

### Database Migration Issues
```bash
# Reset database (development only!)
npx prisma migrate reset

# Or create a new migration:
npx prisma migrate dev --name description_of_change
```

---

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org)
- [Prisma ORM Documentation](https://www.prisma.io/docs)
- [Bcrypt Documentation](https://npm.im/bcrypt)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
