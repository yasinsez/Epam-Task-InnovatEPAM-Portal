'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type StartReviewButtonProps = {
  ideaId: string;
};

/**
 * Button to transition idea status from SUBMITTED to UNDER_REVIEW.
 * Calls PATCH /api/ideas/[id]/start-review and refreshes the page.
 */
export function StartReviewButton({ ideaId }: StartReviewButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/start-review`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.refresh();
      } else {
        setError(data.error ?? `Failed to start evaluation (${res.status})`);
      }
    } catch {
      setError('Failed to start evaluation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:bg-gray-400"
      >
        {loading ? 'Starting...' : 'Start evaluation'}
      </button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
