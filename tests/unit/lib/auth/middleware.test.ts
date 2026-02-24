import { z } from 'zod';

import { enforceProtectedRoute, validateAuthRequest, validateJsonPayload } from '@/lib/auth/middleware';

jest.mock('@/lib/auth/token', () => ({
  refreshToken: jest.fn(),
  validateJWT: jest.fn(),
}));

describe('auth middleware', () => {
  const tokenLib = jest.requireMock('@/lib/auth/token') as {
    refreshToken: jest.Mock;
    validateJWT: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns unauthorized for missing auth header', () => {
    const request = { headers: new Headers() } as any;
    const response = validateAuthRequest(request);

    expect(response?.status).toBe(401);
  });

  it('sets refreshed token header when token can refresh', () => {
    tokenLib.validateJWT.mockReturnValue({ sub: 'u1', email: 'a@b.com' });
    tokenLib.refreshToken.mockReturnValue('new-token');

    const request = {
      headers: new Headers({ authorization: 'Bearer old-token' }),
    } as any;

    const response = validateAuthRequest(request);
    expect(response?.headers.get('X-Auth-Token')).toBe('new-token');
  });

  it('redirects protected route when token invalid', () => {
    tokenLib.validateJWT.mockReturnValue(null);
    const request = {
      headers: new Headers({ authorization: 'Bearer bad' }),
      url: 'http://localhost/protected',
    } as any;

    const response = enforceProtectedRoute(request);
    expect(response.status).toBe(307);
  });

  it('validates json payload with schema', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await validateJsonPayload(request, z.object({ email: z.string().email() }));
    expect(result.success).toBe(true);
  });
});
