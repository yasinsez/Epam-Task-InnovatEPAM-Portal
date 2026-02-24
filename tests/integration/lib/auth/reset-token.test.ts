import { getPasswordResetExpiry, isPasswordResetTokenExpired } from '@/lib/auth/token';

describe('password reset token lifecycle', () => {
  it('supports generation and expiry checks', () => {
    const expiresAt = getPasswordResetExpiry(24);
    expect(isPasswordResetTokenExpired(expiresAt)).toBe(false);
    expect(isPasswordResetTokenExpired(new Date(Date.now() - 1000))).toBe(true);
  });
});
