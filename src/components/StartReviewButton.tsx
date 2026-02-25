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

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/start-review`, {
        method: 'PATCH',
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:bg-gray-400"
    >
      {loading ? 'Starting...' : 'Start evaluation'}
    </button>
  );
}
