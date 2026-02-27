'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Error boundary for dashboard routes. Catches runtime errors and displays a fallback.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="page-container">
      <div className="dashboard-page">
        <h1>Something went wrong</h1>
        <p className="dashboard-page__subtitle">
          We could not load your dashboard. This may be a temporary issue.
        </p>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={reset} className="btn btn--primary">
            Try again
          </button>
          <Link href="/dashboard" className="btn btn--secondary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
