import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt.
 *
 * @param password Plaintext password.
 * @returns Bcrypt hash string.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 *
 * @param password Plaintext password.
 * @param hash Stored bcrypt hash.
 * @returns True when credentials match.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validates password policy requirements.
 *
 * @param password Plaintext password.
 * @returns Validation status and error list.
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
