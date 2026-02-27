import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';

import { verifyPassword } from '@/lib/auth/password';
import { getUserRole } from '@/lib/auth/roles';
import { generateJWT, refreshToken } from '@/lib/auth/token';
import { MOCK_CREDENTIALS, shouldShowMockCredentials } from '@/lib/auth/mock-credentials';
import { prisma } from '@/server/db/prisma';

/**
 * Revokes all persisted sessions that match a JWT value.
 *
 * @param token JWT token string to revoke.
 * @returns Promise that resolves when revocation finishes.
 */
export async function revokeSessionByJwt(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { jwt: token } });
}

/**
 * NextAuth callbacks for JWT/session enrichment and token refresh.
 */
export const authCallbacks: NextAuthOptions['callbacks'] = {
  async jwt({ token, user }) {
    if (user) {
      token.sub = user.id;
      token.email = user.email;
      token.name = user.name;
      token.authToken = generateJWT(user.id, user.email ?? '', user.name ?? undefined);
      // Store role in JWT so middleware can read it (middleware runs on Edge, no Prisma)
      token.role = await getUserRole(user.id);
      return token;
    }

    const currentAuthToken = (token as JWT & { authToken?: string }).authToken;
    if (typeof currentAuthToken === 'string') {
      const refreshed = refreshToken(currentAuthToken);
      if (refreshed) {
        token.authToken = refreshed;
      }
    }

    return token;
  },
  async session({ session, token }) {
    if (session.user && token.sub) {
      session.user.id = token.sub;
      session.user.email = token.email ?? null;
      session.user.name = token.name ?? null;
      session.user.role = (token.role as 'submitter' | 'evaluator' | 'admin') ?? (await getUserRole(token.sub));
      session.authToken = (token as JWT & { authToken?: string }).authToken;
    }

    return session;
  },
};

/**
 * Credentials provider for email/password login.
 */
export const credentialsProvider = CredentialsProvider({
  name: 'credentials',
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials.password) {
      return null;
    }

    const email = credentials.email.toLowerCase().trim();

    // Check for mock credentials in development mode
    if (shouldShowMockCredentials()) {
      for (const credential of Object.values(MOCK_CREDENTIALS)) {
        if (credential.email === email && credential.password === credentials.password) {
          // Return a mock user object for development
          return {
            id: `mock-${credential.role}`,
            email: credential.email,
            name: credential.name,
          };
        }
      }
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return null;
    }

    const validPassword = await verifyPassword(credentials.password, user.passwordHash);

    if (!validPassword) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  },
});

