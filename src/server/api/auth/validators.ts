import { validateEmail } from '@/lib/utils/validators';
import { validatePasswordStrength, verifyPassword } from '@/lib/auth/password';
import { AuthenticationError, ValidationError } from '@/lib/utils/errors';
import { prisma } from '@/server/db/prisma';

export function validateRegistrationPayload(email: string, password: string): void {
  if (!validateEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    throw new ValidationError(passwordValidation.errors[0] ?? 'Password is invalid');
  }
}

export async function assertEmailUnique(email: string): Promise<void> {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AuthenticationError('Invalid email or password');
  }
}

export function validateLoginPayload(email: string, password: string): void {
  if (!validateEmail(email) || !password) {
    throw new AuthenticationError('Invalid email or password');
  }
}

export async function verifyLoginCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    throw new AuthenticationError('Invalid email or password');
  }

  return user;
}
