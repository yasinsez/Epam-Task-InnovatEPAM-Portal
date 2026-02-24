export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Invalid email or password') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends Error {
  public readonly delaySeconds: number;

  constructor(delaySeconds: number) {
    super(`Too many login attempts. Please try again in ${delaySeconds} seconds.`);
    this.name = 'RateLimitError';
    this.delaySeconds = delaySeconds;
  }
}

export class TokenError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'TokenError';
  }
}
