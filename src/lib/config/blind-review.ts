/**
 * Blind Review Configuration
 *
 * Controls whether evaluator identity is masked when displaying evaluation
 * outcomes. When enabled, submitters and non-admin users see generic "Reviewed"
 * instead of evaluator name. Optional admin-audit allows admins to see identity.
 */

export type BlindReviewConfig = {
  /** When true, evaluator identity is masked for submitters and non-admin users */
  enabled: boolean;
  /** When true (and enabled), admins can see evaluator identity for auditing */
  adminAuditEnabled: boolean;
};

/**
 * Resolves blind review configuration from environment variables.
 *
 * @returns BlindReviewConfig with `enabled` and `adminAuditEnabled`
 * @example
 *   const config = getBlindReviewConfig();
 *   if (config.enabled && config.adminAuditEnabled && role === 'admin') {
 *     // Show evaluator identity
 *   }
 */
export function getBlindReviewConfig(): BlindReviewConfig {
  const rawEnabled = process.env.BLIND_REVIEW_ENABLED;
  const rawAdminAudit = process.env.BLIND_REVIEW_ADMIN_AUDIT_ENABLED;

  const enabled =
    rawEnabled === 'true' || rawEnabled === '1';
  const adminAuditEnabled =
    rawAdminAudit === 'true' || rawAdminAudit === '1';

  return {
    enabled,
    adminAuditEnabled,
  };
}
