'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MAX_EVALUATION_COMMENTS_LENGTH } from '@/lib/constants/evaluation';

type CurrentStageInfo = {
  id: string;
  name: string;
  position: number;
  totalStages: number;
  isFinal: boolean;
};

type EvaluationFormProps = {
  ideaId: string;
  /** When in multi-stage pipeline: null = no stages (default flow); otherwise show Advance or Accept/Reject per isFinal */
  currentStage?: CurrentStageInfo | null;
  /** Current rating 1–5 if already set; used as initial value for rating input */
  currentRating?: number | null;
  onSuccess?: () => void;
};

/**
 * Client component for admin/evaluator to accept or reject an idea with comments.
 * When in multi-stage pipeline: shows "Advance to Next Stage" when not final; Accept/Reject when final.
 * When no stages: shows standard Accept/Reject flow.
 * Submits to POST /api/ideas/[id]/evaluate or POST /api/ideas/[id]/advance-stage.
 */
export function EvaluationForm({
  ideaId,
  currentStage,
  currentRating,
  onSuccess,
}: Readonly<EvaluationFormProps>) {
  const router = useRouter();
  const [decision, setDecision] = useState<'ACCEPTED' | 'REJECTED' | null>(null);
  const [comments, setComments] = useState('');
  const [rating, setRating] = useState<number | null>(currentRating ?? null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    setRating(currentRating ?? null);
  }, [currentRating]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showAdvance = currentStage && !currentStage.isFinal;
  const showEvaluate = !currentStage || currentStage.isFinal;

  const handleAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/advance-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: comments.trim() || undefined }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to advance idea');
        return;
      }
      onSuccess?.();
      router.refresh();
    } catch {
      setError('Failed to advance idea');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!decision || !comments.trim()) {
      setError('Please select a decision and provide comments.');
      return;
    }
    if (comments.length > MAX_EVALUATION_COMMENTS_LENGTH) {
      setError(`Comments must not exceed ${MAX_EVALUATION_COMMENTS_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comments: comments.trim() }),
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to evaluate idea');
        return;
      }
      onSuccess?.();
      router.refresh();
    } catch {
      setError('Failed to submit evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRating = async (e: React.FormEvent) => {
    e.preventDefault();
    setRatingError(null);
    if (rating == null || rating < 1 || rating > 5) {
      setRatingError('Please select a rating between 1 and 5.');
      return;
    }
    setRatingLoading(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/assign-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setRatingError(data.error ?? 'Failed to save rating');
        return;
      }
      onSuccess?.();
      router.refresh();
    } catch {
      setRatingError('Failed to save rating');
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <section className="mt-6 rounded border border-gray-200 p-4">
      <h2 className="mb-3 text-lg font-semibold">
        {showAdvance ? 'Advance to Next Stage' : 'Evaluate Idea'}
      </h2>
      {showAdvance && (
        <form onSubmit={handleAdvance} className="space-y-4">
          <div>
            <label htmlFor="advance-comments" className="mb-1 block text-sm font-medium text-gray-700">
              Comments (optional)
            </label>
            <textarea
              id="advance-comments"
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              maxLength={2000}
              disabled={loading}
              placeholder="Optional feedback..."
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Advancing...' : 'Advance to Next Stage'}
          </button>
        </form>
      )}
      {showEvaluate && (
      <>
        <form onSubmit={handleSaveRating} className="mb-6 space-y-4">
          <div>
            <label htmlFor="rating" className="mb-1 block text-sm font-medium text-gray-700">
              Rating (1–5)
            </label>
            <select
              id="rating"
              value={rating ?? ''}
              onChange={(e) => setRating(e.target.value ? parseInt(e.target.value, 10) : null)}
              disabled={ratingLoading}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select rating…</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}/5
                </option>
              ))}
            </select>
            {ratingError && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {ratingError}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={ratingLoading || rating == null}
            className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:bg-gray-400"
          >
            {ratingLoading ? 'Saving...' : 'Save Rating'}
          </button>
        </form>
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="decision"
              value="ACCEPTED"
              checked={decision === 'ACCEPTED'}
              onChange={() => setDecision('ACCEPTED')}
              disabled={loading}
              className="rounded"
            />
            <span className="font-medium text-green-700">Accept</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="decision"
              value="REJECTED"
              checked={decision === 'REJECTED'}
              onChange={() => setDecision('REJECTED')}
              disabled={loading}
              className="rounded"
            />
            <span className="font-medium text-red-700">Reject</span>
          </label>
        </div>
        <div>
          <label htmlFor="comments" className="mb-1 block text-sm font-medium text-gray-700">
            Comments (required)
          </label>
          <textarea
            id="comments"
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            maxLength={MAX_EVALUATION_COMMENTS_LENGTH}
            disabled={loading}
            placeholder="Provide feedback for your decision..."
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <div className="mt-1 text-right text-xs text-gray-500">
            {comments.length} / {MAX_EVALUATION_COMMENTS_LENGTH}
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !decision || !comments.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Submitting...' : 'Submit Evaluation'}
        </button>
      </form>
      </>
      )}
    </section>
  );
}
