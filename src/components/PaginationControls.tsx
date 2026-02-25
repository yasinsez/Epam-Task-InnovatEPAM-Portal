'use client';

import Link from 'next/link';

export type PaginationControlsProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  baseUrl: string;
};

/**
 * Pagination controls (Prev/Next, page indicators).
 * Disables Prev on first page, Next on last page.
 */
export function PaginationControls({
  page,
  totalPages,
  totalCount,
  pageSize,
  baseUrl,
}: PaginationControlsProps): JSX.Element {
  const url = new URL(baseUrl, 'http://dummy');
  const prevPage = page - 1;
  const nextPage = page + 1;

  const buildPageUrl = (p: number) => {
    url.searchParams.set('page', String(p));
    return url.search ? `${url.pathname}?${url.searchParams.toString()}` : url.pathname;
  };

  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 mt-6">
      <p className="text-sm text-gray-600">
        Showing {startItem}-{endItem} of {totalCount}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={prevPage >= 1 ? buildPageUrl(prevPage) : '#'}
          className={`px-3 py-1 rounded border ${
            page <= 1
              ? 'pointer-events-none text-gray-400 border-gray-200 bg-gray-50'
              : 'text-blue-600 border-blue-300 hover:bg-blue-50'
          }`}
          aria-disabled={page <= 1}
        >
          Previous
        </Link>
        <span className="px-2 text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <Link
          href={nextPage <= totalPages ? buildPageUrl(nextPage) : '#'}
          className={`px-3 py-1 rounded border ${
            page >= totalPages
              ? 'pointer-events-none text-gray-400 border-gray-200 bg-gray-50'
              : 'text-blue-600 border-blue-300 hover:bg-blue-50'
          }`}
          aria-disabled={page >= totalPages}
        >
          Next
        </Link>
      </div>
    </nav>
  );
}
