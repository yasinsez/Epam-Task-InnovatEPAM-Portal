import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password';

describe('password utils', () => {
  it('hashes and verifies passwords', async () => {
    const hash = await hashPassword('SecurePass123');

    expect(hash).toBeTruthy();
    await expect(verifyPassword('SecurePass123', hash)).resolves.toBe(true);
    await expect(verifyPassword('WrongPass123', hash)).resolves.toBe(false);
  });

  it('validates password strength', () => {
    expect(validatePasswordStrength('1234567').valid).toBe(false);
    expect(validatePasswordStrength('12345678').valid).toBe(true);
  });
});
