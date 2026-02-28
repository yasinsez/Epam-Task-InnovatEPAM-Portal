import {
  validateEmail,
  validatePassword,
  assertValidCredentials,
} from '@/lib/utils/validators';

describe('lib/utils/validators', () => {
  describe('validateEmail', () => {
    it('returns true for valid email', () => {
      expect(validateEmail('employee@epam.com')).toBe(true);
    });

    it('returns false for invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });

    it('handles whitespace and case', () => {
      expect(validateEmail('  Employee@EPAM.com  ')).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('returns true for password with 8+ characters', () => {
      expect(validatePassword('12345678')).toBe(true);
    });

    it('returns false for password with less than 8 characters', () => {
      expect(validatePassword('1234567')).toBe(false);
    });
  });

  describe('assertValidCredentials', () => {
    it('does not throw for valid email and password', () => {
      expect(() =>
        assertValidCredentials('user@epam.com', 'ValidPass123'),
      ).not.toThrow();
    });

    it('throws for invalid email', () => {
      expect(() =>
        assertValidCredentials('invalid-email', 'ValidPass123'),
      ).toThrow('Invalid email or password');
    });

    it('throws for invalid password (too short)', () => {
      expect(() =>
        assertValidCredentials('user@epam.com', 'short'),
      ).toThrow('Invalid email or password');
    });

    it('throws when both email and password are invalid', () => {
      expect(() => assertValidCredentials('bad', 'x')).toThrow(
        'Invalid email or password',
      );
    });
  });
});
