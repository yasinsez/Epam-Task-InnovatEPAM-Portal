import { validateEmail, validatePassword } from '@/lib/utils/validators';

describe('validators', () => {
  it('validates email format', () => {
    expect(validateEmail('employee@epam.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });

  it('validates minimum password length', () => {
    expect(validatePassword('12345678')).toBe(true);
    expect(validatePassword('1234567')).toBe(false);
  });
});
