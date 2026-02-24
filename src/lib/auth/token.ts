import crypto from 'node:crypto';
import jwt, { type JwtPayload } from 'jsonwebtoken';

const ISSUER = 'innovatepam-portal';
const AUDIENCE = 'innovatepam-portal-api';
const EXPIRES_IN_SECONDS = 60 * 60 * 24;
const REFRESH_WINDOW_SECONDS = 5 * 60;

export type AuthTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  name?: string;
};

function getJwtSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not configured');
  }

  return secret;
}

/**
 * Generates an authentication JWT with 24h expiry.
 *
 * @param userId User identifier.
 * @param email User email.
 * @param name Optional display name.
 * @returns Signed JWT string.
 */
export function generateJWT(userId: string, email: string, name?: string): string {
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      sub: userId,
      email,
      name,
      iat: now,
      exp: now + EXPIRES_IN_SECONDS,
      iss: ISSUER,
      aud: AUDIENCE,
    },
    getJwtSecret(),
    { algorithm: 'HS256' },
  );
}

/**
 * Validates and decodes an authentication JWT.
 *
 * @param token JWT token.
 * @returns Decoded payload or null when invalid.
 */
export function validateJWT(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (!decoded || typeof decoded !== 'object') {
      return null;
    }

    const payload = decoded as Record<string, unknown>;
    const email = payload.email;
    const sub = payload.sub;

    if (typeof sub !== 'string' || typeof email !== 'string') {
      return null;
    }

    return {
      ...payload,
      sub,
      email,
      name: typeof payload.name === 'string' ? payload.name : undefined,
    } as AuthTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Refreshes JWT when remaining lifetime is below threshold.
 *
 * @param token Existing JWT token.
 * @returns Refreshed token or null when refresh is unnecessary/invalid.
 */
export function refreshToken(token: string): string | null {
  const decoded = validateJWT(token);

  if (!decoded?.exp || !decoded.sub || !decoded.email) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const remaining = decoded.exp - now;

  if (remaining > 0 && remaining < REFRESH_WINDOW_SECONDS) {
    return generateJWT(decoded.sub, decoded.email, decoded.name);
  }

  return null;
}

/**
 * Generates a secure password reset token.
 *
 * @returns Hex-encoded random token.
 */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculates reset token expiry timestamp.
 *
 * @param hours Expiry window in hours.
 * @returns Expiry Date object.
 */
export function getPasswordResetExpiry(hours = 24): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Checks whether a password reset token has expired.
 *
 * @param expiresAt Token expiry date.
 * @returns True when token is expired.
 */
export function isPasswordResetTokenExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}
