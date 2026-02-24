'use client';

import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type AuthContextValue = {
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  applyRefreshTokenFromResponse: (response: Response) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [authToken, setAuthToken] = useState<string | null>(null);

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
    }),
    [authToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
}
