'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DraftListItem } from '@/components/DraftListItem';

type DraftItem = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  attachmentCount: number;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export default function DraftsPage(): JSX.Element {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discardingId, setDiscardingId] = useState<string | null>(null);
  const [confirmDiscardId, setConfirmDiscardId] = useState<string | null>(null);

  const fetchDrafts = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/drafts');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load drafts');
        return;
      }
      setDrafts(data.drafts ?? []);
      setPagination(data.pagination ?? null);
    } catch {
      setError('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleDiscard = async (id: string): Promise<void> => {
    setDiscardingId(id);
    try {
      const res = await fetch(`/api/drafts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to discard draft');
        return;
      }
      setConfirmDiscardId(null);
      await fetchDrafts();
    } catch {
      setError('Failed to discard draft');
    } finally {
      setDiscardingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <h1>My Drafts</h1>
        <p>Loading drafts...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-4">
        <h1>My Drafts</h1>
        <Link href="/ideas/submit" className="btn btn--primary">
          New idea
        </Link>
      </div>
      {error && (
        <div className="error-message alert mb-4" role="alert">
          {error}
        </div>
      )}
      {drafts.length === 0 ? (
        <p className="text-gray-600">
          No drafts yet. Start by{' '}
          <Link href="/ideas/submit" className="text-blue-600 hover:underline">
            submitting an idea
          </Link>
          —you can save it as a draft at any time.
        </p>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <DraftListItem
              key={draft.id}
              id={draft.id}
              title={draft.title}
              updatedAt={draft.updatedAt}
              attachmentCount={draft.attachmentCount}
              onDiscard={setConfirmDiscardId}
              isDiscarding={discardingId === draft.id}
              confirmDiscard={confirmDiscardId === draft.id}
              onConfirmDiscard={() => confirmDiscardId && handleDiscard(confirmDiscardId)}
              onCancelDiscard={() => setConfirmDiscardId(null)}
            />
          ))}
        </div>
      )}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 text-sm text-gray-600">
          Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
        </div>
      )}
    </div>
  );
}
