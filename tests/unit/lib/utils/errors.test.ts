import {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  TokenError,
  ValidationError,
} from '@/lib/utils/errors';

describe('error classes', () => {
  it('builds validation error', () => {
    const error = new ValidationError('invalid');
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('invalid');
  });

  it('builds authentication error with default message', () => {
    const error = new AuthenticationError();
    expect(error.name).toBe('AuthenticationError');
    expect(error.message).toBe('Invalid email or password');
  });

  it('builds authentication error with custom message', () => {
    const error = new AuthenticationError('Account locked');
    expect(error.message).toBe('Account locked');
  });

  it('builds rate limit error', () => {
    const error = new RateLimitError(4);
    expect(error.name).toBe('RateLimitError');
    expect(error.delaySeconds).toBe(4);
    expect(error.message).toContain('4 seconds');
  });

  it('builds token error with default message', () => {
    const error = new TokenError();
    expect(error.name).toBe('TokenError');
    expect(error.message).toBe('Unauthorized');
  });

  it('builds token error with custom message', () => {
    const error = new TokenError('Token expired');
    expect(error.message).toBe('Token expired');
  });

  it('builds not found error with default message', () => {
    const error = new NotFoundError();
    expect(error.name).toBe('NotFoundError');
    expect(error.message).toBe('Resource not found');
  });

  it('builds not found error with custom message', () => {
    const error = new NotFoundError('Idea not found');
    expect(error.message).toBe('Idea not found');
  });
});
