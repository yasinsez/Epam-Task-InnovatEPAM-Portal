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
});
