import {
  AuthenticationError,
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

  it('builds authentication error', () => {
    const error = new AuthenticationError();
    expect(error.name).toBe('AuthenticationError');
    expect(error.message).toBe('Invalid email or password');
  });

  it('builds rate limit error', () => {
    const error = new RateLimitError(4);
    expect(error.name).toBe('RateLimitError');
    expect(error.delaySeconds).toBe(4);
  });

  it('builds token error', () => {
    const error = new TokenError();
    expect(error.name).toBe('TokenError');
  });
});
