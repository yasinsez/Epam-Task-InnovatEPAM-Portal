'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export type RatingSortFilterProps = {
  currentSortBy: string | null;
  currentMinRating: number | null;
};

/**
 * Sort and filter by rating. Evaluator/admin only.
 * Sort: default (submittedAt), ratingDesc (highest first), ratingAsc (lowest first).
 * Filter: minRating 1–5 (excludes unrated and below threshold).
 */
export function RatingSortFilter({
  currentSortBy,
  currentMinRating,
}: RatingSortFilterProps): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    const query = params.toString();
    router.push(`/ideas${query ? `?${query}` : ''}`);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateParams('sortBy', value || null);
  };

  const handleMinRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateParams('minRating', value || null);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">
          Sort by:
        </label>
        <select
          id="sort-by"
          value={currentSortBy || ''}
          onChange={handleSortChange}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Sort ideas"
        >
          <option value="">Date (newest)</option>
          <option value="ratingDesc">Rating (highest first)</option>
          <option value="ratingAsc">Rating (lowest first)</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="min-rating" className="text-sm font-medium text-gray-700">
          Min rating:
        </label>
        <select
          id="min-rating"
          value={currentMinRating != null ? String(currentMinRating) : ''}
          onChange={handleMinRatingChange}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Filter by minimum rating"
        >
          <option value="">All</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
