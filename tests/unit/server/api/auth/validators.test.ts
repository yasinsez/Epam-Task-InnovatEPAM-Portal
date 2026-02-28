import {
  validateRegistrationPayload,
  assertEmailUnique,
  validateLoginPayload,
  verifyLoginCredentials,
} from '@/server/api/auth/validators';
import { ValidationError, AuthenticationError } from '@/lib/utils/errors';

jest.mock('@/lib/auth/password', () => ({
  validatePasswordStrength: jest.fn(),
  verifyPassword: jest.fn(),
}));
jest.mock('@/lib/auth/mock-credentials', () => ({
  MOCK_CREDENTIALS: {
    admin: {
      email: 'admin@epam.com',
      password: 'Admin@12345',
      role: 'admin',
      name: 'Admin User',
    },
    submitter: {
      email: 'submitter@epam.com',
      password: 'Submitter@12345',
      role: 'submitter',
      name: 'Submitter User',
    },
  },
  shouldShowMockCredentials: jest.fn(() => false),
}));
jest.mock('@/server/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const validatePasswordStrength = jest.requireMock(
  '@/lib/auth/password',
).validatePasswordStrength;
const verifyPassword = jest.requireMock('@/lib/auth/password').verifyPassword;
const prisma = jest.requireMock('@/server/db/prisma').prisma;

describe('server/api/auth/validators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .requireMock('@/lib/auth/mock-credentials')
      .shouldShowMockCredentials.mockReturnValue(false);
  });

  describe('validateRegistrationPayload', () => {
    it('throws ValidationError for invalid email format', () => {
      expect(() =>
        validateRegistrationPayload('invalid-email', 'ValidPass123!'),
      ).toThrow(ValidationError);
      expect(() =>
        validateRegistrationPayload('invalid-email', 'ValidPass123!'),
      ).toThrow('Invalid email format');
    });

    it('throws ValidationError when password fails strength check', () => {
      validatePasswordStrength.mockReturnValue({
        valid: false,
        errors: ['Password must contain a number'],
      });

      expect(() =>
        validateRegistrationPayload('user@epam.com', 'weakpassword'),
      ).toThrow(ValidationError);
      expect(() =>
        validateRegistrationPayload('user@epam.com', 'weakpassword'),
      ).toThrow('Password must contain a number');
    });

    it('does not throw for valid email and password', () => {
      validatePasswordStrength.mockReturnValue({ valid: true, errors: [] });

      expect(() =>
        validateRegistrationPayload('user@epam.com', 'ValidPass123!'),
      ).not.toThrow();
    });
  });

  describe('assertEmailUnique', () => {
    it('throws AuthenticationError when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(
        assertEmailUnique('existing@epam.com'),
      ).rejects.toThrow(AuthenticationError);
      await expect(
        assertEmailUnique('existing@epam.com'),
      ).rejects.toThrow('Invalid email or password');
    });

    it('does not throw when email is unique', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(assertEmailUnique('new@epam.com')).resolves.not.toThrow();
    });
  });

  describe('validateLoginPayload', () => {
    it('throws AuthenticationError for invalid email', () => {
      expect(() =>
        validateLoginPayload('invalid-email', 'password123'),
      ).toThrow(AuthenticationError);
    });

    it('throws AuthenticationError for empty password', () => {
      expect(() =>
        validateLoginPayload('user@epam.com', ''),
      ).toThrow(AuthenticationError);
    });

    it('does not throw for valid email and non-empty password', () => {
      expect(() =>
        validateLoginPayload('user@epam.com', 'password123'),
      ).not.toThrow();
    });
  });

  describe('verifyLoginCredentials', () => {
    it('throws AuthenticationError when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        verifyLoginCredentials('unknown@epam.com', 'password'),
      ).rejects.toThrow(AuthenticationError);
    });

    it('throws AuthenticationError when password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@epam.com',
        passwordHash: 'hashed',
      });
      verifyPassword.mockResolvedValue(false);

      await expect(
        verifyLoginCredentials('user@epam.com', 'wrongpassword'),
      ).rejects.toThrow(AuthenticationError);
    });

    it('returns user when credentials are correct', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@epam.com',
        name: 'Test User',
        passwordHash: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      verifyPassword.mockResolvedValue(true);

      const result = await verifyLoginCredentials('user@epam.com', 'correct');

      expect(result).toEqual(mockUser);
    });

    it('returns mock user when mock credentials enabled and match', async () => {
      const mockCreds = jest.requireMock('@/lib/auth/mock-credentials');
      mockCreds.shouldShowMockCredentials.mockReturnValue(true);

      const result = await verifyLoginCredentials(
        'admin@epam.com',
        'Admin@12345',
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: 'mock-admin',
          email: 'admin@epam.com',
          name: 'Admin User',
        }),
      );
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('falls through to DB when mock credentials enabled but no match', async () => {
      const mockCreds = jest.requireMock('@/lib/auth/mock-credentials');
      mockCreds.shouldShowMockCredentials.mockReturnValue(true);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        verifyLoginCredentials('unknown@epam.com', 'wrong'),
      ).rejects.toThrow(AuthenticationError);
    });
  });
});
