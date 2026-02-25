'use client';

import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

type UserRole = 'submitter' | 'evaluator' | 'admin';

type AuthContextValue = {
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  applyRefreshTokenFromResponse: (response: Response) => void;
  role: UserRole | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provides auth token and role context for client components.
 */
export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const { data: session } = useSession();
  const role = (session?.user?.role as UserRole | undefined) ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      authToken,
      setAuthToken,
      applyRefreshTokenFromResponse(response) {
        const refreshedToken = response.headers.get('X-Auth-Token');
        if (refreshedToken) {
          setAuthToken(refreshedToken);
        }
      },
      role,
    }),
    [authToken, role],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Reads the auth context for client components.
 */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
}
