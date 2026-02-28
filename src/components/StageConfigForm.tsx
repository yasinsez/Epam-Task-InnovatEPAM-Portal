'use client';

import { useEffect, useState, useCallback } from 'react';
import { MAX_REVIEW_STAGES } from '@/lib/constants/evaluation';

type StageDto = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  ideaCount: number;
};

/**
 * Client component for admin stage configuration.
 * Lists stages with add/edit/reorder/delete. Delete blocked when ideas in stage.
 */
export function StageConfigForm() {
  const [stages, setStages] = useState<StageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [addName, setAddName] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchStages = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/review-stages', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to load stages');
        return;
      }
      setStages(data.stages ?? []);
      setError(null);
    } catch {
      setError('Failed to load stages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/review-stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: addName.trim(),
          description: addDescription.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create stage');
        return;
      }
      setAddName('');
      setAddDescription('');
      showSuccess('Stage created');
      fetchStages();
    } catch {
      setError('Failed to create stage');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (stageId: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/review-stages/${stageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to update stage');
        return;
      }
      setEditingId(null);
      showSuccess('Stage updated');
      fetchStages();
    } catch {
      setError('Failed to update stage');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (stageId: string, ideaCount: number) => {
    if (ideaCount > 0) return;
    if (!confirm('Remove this stage?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/review-stages/${stageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to delete stage');
        return;
      }
      showSuccess('Stage removed');
      fetchStages();
    } catch {
      setError('Failed to delete stage');
    }
  };

  const handleReorder = async (stageId: string, direction: 'up' | 'down') => {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return;
    const newOrder =
      direction === 'up' ? stage.displayOrder - 1 : stage.displayOrder + 1;
    if (newOrder < 0 || newOrder >= stages.length) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/review-stages/${stageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ displayOrder: newOrder }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to reorder');
        return;
      }
      showSuccess('Order updated');
      fetchStages();
    } catch {
      setError('Failed to reorder');
    }
  };

  const startEdit = (s: StageDto) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditDescription(s.description ?? '');
  };

  if (loading) {
    return <p className="text-gray-600">Loading stages...</p>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded bg-red-50 p-4 text-red-700" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded bg-green-50 p-4 text-green-700" role="alert">
          {success}
        </div>
      )}

      {/* Add form */}
      {stages.length < MAX_REVIEW_STAGES && (
        <form onSubmit={handleAdd} className="rounded border border-gray-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Add Stage</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="add-name" className="sr-only">
                Stage name
              </label>
              <input
                id="add-name"
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Stage name"
                maxLength={100}
                required
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="add-desc" className="sr-only">
                Description (optional)
              </label>
              <input
                id="add-desc"
                type="text"
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                placeholder="Description (optional)"
                maxLength={500}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={adding || !addName.trim()}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {adding ? 'Adding...' : 'Add Stage'}
            </button>
          </div>
        </form>
      )}

      {/* Stage list */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Stages ({stages.length} / {MAX_REVIEW_STAGES})</h3>
        {stages.length === 0 ? (
          <p className="text-gray-500">No stages configured. Add one above to enable multi-stage review.</p>
        ) : (
          <ul className="space-y-2">
            {stages.map((s, idx) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded border border-gray-200 p-3"
              >
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleReorder(s.id, 'up')}
                    disabled={idx === 0}
                    aria-label="Move up"
                    className="text-gray-500 hover:text-gray-700 disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReorder(s.id, 'down')}
                    disabled={idx === stages.length - 1}
                    aria-label="Move down"
                    className="text-gray-500 hover:text-gray-700 disabled:opacity-40"
                  >
                    ↓
                  </button>
                </div>
                {editingId === s.id ? (
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={100}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description"
                      maxLength={500}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdate(s.id)}
                      disabled={saving}
                      className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{s.name}</span>
                      {s.description && (
                        <span className="ml-2 text-sm text-gray-600">
                          — {s.description}
                        </span>
                      )}
                      <span className="ml-2 text-xs text-gray-500">
                        (Ideas: {s.ideaCount})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id, s.ideaCount)}
                      disabled={s.ideaCount > 0}
                      title={
                        s.ideaCount > 0
                          ? `Cannot remove: ${s.ideaCount} ideas in this stage`
                          : 'Remove stage'
                      }
                      className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
