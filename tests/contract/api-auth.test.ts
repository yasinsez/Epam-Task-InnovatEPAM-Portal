import { z } from 'zod';

const registerSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    createdAt: z.union([z.string(), z.date()]),
  }),
});

const registerErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});

const loginSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().nullable().optional(),
  }),
});

const logoutSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

const forgotPasswordSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

const resetPasswordSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

describe('auth contract: register', () => {
  it('accepts valid success response schema', () => {
    const payload = {
      success: true,
      message: 'User registered successfully. Confirmation email sent.',
      user: {
        id: 'user-cuid-123',
        email: 'emp123@epam.com',
        createdAt: '2026-02-24T10:00:00.000Z',
      },
    };

    expect(registerSuccessSchema.parse(payload)).toBeTruthy();
  });

  it('accepts valid error response schema', () => {
    const payload = {
      success: false,
      error: 'Invalid email or password',
    };

    expect(registerErrorSchema.parse(payload)).toBeTruthy();
  });
});

describe('auth contract: login', () => {
  it('accepts valid login success schema', () => {
    const payload = {
      success: true,
      message: 'Login successful',
      user: {
        id: 'user-cuid-123',
        email: 'emp123@epam.com',
        name: 'John Doe',
      },
    };

    expect(loginSuccessSchema.parse(payload)).toBeTruthy();
  });
});

describe('auth contract: logout', () => {
  it('accepts valid logout success schema', () => {
    const payload = {
      success: true,
      message: 'Logged out successfully',
    };

    expect(logoutSuccessSchema.parse(payload)).toBeTruthy();
  });
});

describe('auth contract: password reset', () => {
  it('accepts forgot-password success schema', () => {
    const payload = {
      success: true,
      message: 'If the email exists, a reset link has been sent',
    };

    expect(forgotPasswordSuccessSchema.parse(payload)).toBeTruthy();
  });

  it('accepts reset-password success schema', () => {
    const payload = {
      success: true,
      message: 'Password reset successful',
    };

    expect(resetPasswordSuccessSchema.parse(payload)).toBeTruthy();
  });
});
