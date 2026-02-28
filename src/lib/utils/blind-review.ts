import type { UserRole } from '@/lib/auth/roles';
import type { BlindReviewConfig } from '@/lib/config/blind-review';

export type EvaluationForMasking = {
  evaluatedUnderBlindReview?: boolean | null;
};

/**
 * Blind review display utilities.
 *
 * When stage transition comments with evaluator are displayed in future UI,
 * apply the same masking via shouldMaskEvaluator. StageProgressDisplay
 * currently shows stage names only; no code change needed for current scope.
 */

/**
 * Determines whether evaluator identity must be masked when displaying an evaluation.
 *
 * @param evaluation - Evaluation with evaluatedUnderBlindReview flag
 * @param viewerRole - Role of the user viewing the idea (submitter, evaluator, admin)
 * @param config - Current blind review configuration
 * @returns true if evaluatorDisplayName must be masked (show "Reviewed")
 *
 * @remarks
 * Masking rules:
 * - evaluatedUnderBlindReview === true: always mask (FR-009: no retroactive exposure)
 * - config.enabled and (viewer not admin or !config.adminAuditEnabled): mask
 * - Otherwise: do not mask (show real evaluator name)
 */
export function shouldMaskEvaluator(
  evaluation: EvaluationForMasking,
  viewerRole: UserRole,
  config: BlindReviewConfig,
): boolean {
  if (evaluation.evaluatedUnderBlindReview === true) {
    return true;
  }
  if (config.enabled && (viewerRole !== 'admin' || !config.adminAuditEnabled)) {
    return true;
  }
  return false;
}
