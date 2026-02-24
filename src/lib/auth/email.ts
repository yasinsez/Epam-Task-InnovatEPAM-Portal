export type EmailResult = {
  success: boolean;
  error?: string;
};

import { logger } from '@/lib/utils/logger';

export interface EmailService {
  /**
   * Sends registration confirmation email.
   *
   * @param email Recipient email address.
   * @returns Delivery result.
   */
  sendConfirmationEmail(email: string): Promise<EmailResult>;
  /**
   * Sends password reset email.
   *
   * @param email Recipient email address.
   * @param resetToken Reset token value.
   * @returns Delivery result.
   */
  sendPasswordResetEmail(email: string, resetToken: string): Promise<EmailResult>;
}

/**
 * Builds password reset email content and URL.
 *
 * @param resetToken Password reset token.
 * @returns Email subject/body payload.
 */
export function buildPasswordResetEmail(resetToken: string): { subject: string; body: string } {
  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const resetUrl = `${appUrl}/auth/reset-password?token=${resetToken}`;

  return {
    subject: 'Reset your InnovatEPAM Portal password',
    body: [
      'You requested a password reset.',
      `Use the link below to set a new password: ${resetUrl}`,
      'This link expires in 24 hours.',
    ].join('\n'),
  };
}

function logEmailFailure(error: unknown): void {
  logger.error('Email delivery failed', {
    error: error instanceof Error ? error.message : 'unknown',
  });
}

class ConsoleEmailService implements EmailService {
  async sendConfirmationEmail(email: string): Promise<EmailResult> {
    try {
      logger.info('Queued confirmation email', { email });
      return { success: true };
    } catch (error) {
      logEmailFailure(error);
      return { success: false, error: 'delivery_failed' };
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<EmailResult> {
    try {
      const emailContent = buildPasswordResetEmail(resetToken);
      logger.info('Queued password reset email', { email, subject: emailContent.subject });
      return { success: true };
    } catch (error) {
      logEmailFailure(error);
      return { success: false, error: 'delivery_failed' };
    }
  }
}

export const emailService: EmailService = new ConsoleEmailService();
