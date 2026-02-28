import { shouldMaskEvaluator } from '@/lib/utils/blind-review';
import type { BlindReviewConfig } from '@/lib/config/blind-review';

describe('blind-review masking logic', () => {
  describe('shouldMaskEvaluator', () => {
    it('should mask when evaluatedUnderBlindReview is true (FR-009)', () => {
      const evaluation = { evaluatedUnderBlindReview: true };
      const config: BlindReviewConfig = { enabled: false, adminAuditEnabled: false };

      expect(shouldMaskEvaluator(evaluation, 'submitter', config)).toBe(true);
      expect(shouldMaskEvaluator(evaluation, 'evaluator', config)).toBe(true);
      expect(shouldMaskEvaluator(evaluation, 'admin', config)).toBe(true);
    });

    it('should mask when config enabled and viewer is submitter', () => {
      const evaluation = { evaluatedUnderBlindReview: false };
      const config: BlindReviewConfig = { enabled: true, adminAuditEnabled: false };

      expect(shouldMaskEvaluator(evaluation, 'submitter', config)).toBe(true);
    });

    it('should mask when config enabled and viewer is evaluator', () => {
      const evaluation = { evaluatedUnderBlindReview: false };
      const config: BlindReviewConfig = { enabled: true, adminAuditEnabled: false };

      expect(shouldMaskEvaluator(evaluation, 'evaluator', config)).toBe(true);
    });

    it('should mask when config enabled and admin with adminAuditEnabled OFF', () => {
      const evaluation = { evaluatedUnderBlindReview: false };
      const config: BlindReviewConfig = { enabled: true, adminAuditEnabled: false };

      expect(shouldMaskEvaluator(evaluation, 'admin', config)).toBe(true);
    });

    it('should not mask when config enabled and admin with adminAuditEnabled ON', () => {
      const evaluation = { evaluatedUnderBlindReview: false };
      const config: BlindReviewConfig = { enabled: true, adminAuditEnabled: true };

      expect(shouldMaskEvaluator(evaluation, 'admin', config)).toBe(false);
    });

    it('should not mask when config disabled (legacy evaluations)', () => {
      const evaluation = { evaluatedUnderBlindReview: false };
      const config: BlindReviewConfig = { enabled: false, adminAuditEnabled: false };

      expect(shouldMaskEvaluator(evaluation, 'submitter', config)).toBe(false);
      expect(shouldMaskEvaluator(evaluation, 'admin', config)).toBe(false);
    });

    it('should not mask when evaluatedUnderBlindReview is null and config disabled', () => {
      const evaluation = { evaluatedUnderBlindReview: null };
      const config: BlindReviewConfig = { enabled: false, adminAuditEnabled: false };

      expect(shouldMaskEvaluator(evaluation, 'submitter', config)).toBe(false);
    });

    it('should mask when evaluatedUnderBlindReview is null but config enabled and viewer submitter', () => {
      const evaluation = { evaluatedUnderBlindReview: null };
      const config: BlindReviewConfig = { enabled: true, adminAuditEnabled: false };

      expect(shouldMaskEvaluator(evaluation, 'submitter', config)).toBe(true);
    });
  });
});
