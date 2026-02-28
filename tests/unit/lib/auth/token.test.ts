import {
  generateJWT,
  generatePasswordResetToken,
  getPasswordResetExpiry,
  isPasswordResetTokenExpired,
  refreshToken,
  validateJWT,
} from '@/lib/auth/token';

describe('token utils', () => {
  const originalSecret = process.env.NEXTAUTH_SECRET;

  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.NEXTAUTH_SECRET = originalSecret;
  });

  it('generates and validates jwt token', () => {
    const token = generateJWT('user-1', 'employee@epam.com', 'Employee');
    const payload = validateJWT(token);

    expect(payload?.sub).toBe('user-1');
    expect(payload?.email).toBe('employee@epam.com');
  });

  it('refreshes token when near expiry', () => {
    const now = Math.floor(Date.now() / 1000);
    const almostExpired = generateJWT('user-1', 'employee@epam.com', 'Employee');

    jest.spyOn(Date, 'now').mockReturnValue((now + 24 * 60 * 60 - 60) * 1000);
    const refreshed = refreshToken(almostExpired);

    expect(typeof refreshed === 'string').toBe(true);
    (Date.now as jest.Mock).mockRestore();
  });

  it('generates password reset token', () => {
    const token = generatePasswordResetToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);
  });

  it('validates password reset token expiry', () => {
    const validExpiry = getPasswordResetExpiry(1);
    const expired = new Date(Date.now() - 1000);

    expect(isPasswordResetTokenExpired(validExpiry)).toBe(false);
    expect(isPasswordResetTokenExpired(expired)).toBe(true);
  });

  it('validateJWT returns null for invalid or malformed token', () => {
    expect(validateJWT('invalid-token')).toBeNull();
    expect(validateJWT('')).toBeNull();
  });

  it('validateJWT returns payload with name when present', () => {
    const token = generateJWT('user-1', 'user@epam.com', 'Display Name');
    const payload = validateJWT(token);
    expect(payload?.name).toBe('Display Name');
  });

  it('validateJWT returns payload with undefined name when omitted', () => {
    const token = generateJWT('user-1', 'user@epam.com');
    const payload = validateJWT(token);
    expect(payload?.name).toBeUndefined();
  });

  it('refreshToken returns null when token has plenty of time left', () => {
    const token = generateJWT('user-1', 'user@epam.com');
    expect(refreshToken(token)).toBeNull();
  });

  it('refreshToken returns null when token is invalid', () => {
    expect(refreshToken('invalid')).toBeNull();
  });

  it('getPasswordResetExpiry uses default 24 hours when not specified', () => {
    const expiry = getPasswordResetExpiry();
    const expected = Date.now() + 24 * 60 * 60 * 1000;
    expect(Math.abs(expiry.getTime() - expected)).toBeLessThan(2000);
  });
});
