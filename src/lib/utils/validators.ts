const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

export function assertValidCredentials(email: string, password: string): void {
  if (!validateEmail(email) || !validatePassword(password)) {
    throw new Error('Invalid email or password');
  }
}
