import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    authToken?: string;
    user: {
      id: string;
      email: string | null;
      name?: string | null;
      role: 'submitter' | 'evaluator' | 'admin';
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    authToken?: string;
    role?: 'submitter' | 'evaluator' | 'admin';
  }
}
