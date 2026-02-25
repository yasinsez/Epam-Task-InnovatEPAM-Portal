'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export type CategoryOption = {
  id: string;
  name: string;
};

export type CategoryFilterProps = {
  categories: CategoryOption[];
  currentCategoryId: string | null;
};

/**
 * Category filter dropdown. On change, navigates with updated categoryId searchParam.
 * "All" option clears the filter.
 */
export function CategoryFilter({
  categories,
  currentCategoryId,
}: CategoryFilterProps): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('categoryId', value);
      params.delete('page'); // reset to first page when filtering
    } else {
      params.delete('categoryId');
      params.delete('page');
    }
    const query = params.toString();
    router.push(`/ideas${query ? `?${query}` : ''}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
        Category:
      </label>
      <select
        id="category-filter"
        value={currentCategoryId || ''}
        onChange={handleChange}
        className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-label="Filter ideas by category"
      >
        <option value="">All</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
