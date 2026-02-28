'use client';

import { useEffect, useState, useCallback } from 'react';

type UploadConfigDto = {
  maxFileCount: number;
  maxFileSizeBytes: number;
  maxTotalSizeBytes: number;
  allowedExtensions: string[];
  mimeByExtension: Record<string, string>;
};

/**
 * Client component for editing upload configuration.
 * Displays and saves max file count, per-file size, total size, and allowed types.
 */
export function UploadConfigEditor() {
  const [maxFileCount, setMaxFileCount] = useState(10);
  const [maxFileSizeBytes, setMaxFileSizeBytes] = useState(10 * 1024 * 1024);
  const [maxTotalSizeBytes, setMaxTotalSizeBytes] = useState(50 * 1024 * 1024);
  const [allowedExtensions, setAllowedExtensions] = useState<string[]>([
    '.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif', '.xls', '.xlsx',
  ]);
  const [mimeByExtension, setMimeByExtension] = useState<Record<string, string>>({
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/upload-config', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to load upload configuration');
        return;
      }
      const cfg = data.config as UploadConfigDto;
      if (cfg) {
        setMaxFileCount(cfg.maxFileCount);
        setMaxFileSizeBytes(cfg.maxFileSizeBytes);
        setMaxTotalSizeBytes(cfg.maxTotalSizeBytes);
        setAllowedExtensions(cfg.allowedExtensions ?? []);
        setMimeByExtension(cfg.mimeByExtension ?? {});
      }
      setError(null);
    } catch {
      setError('Failed to load upload configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/upload-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          maxFileCount,
          maxFileSizeBytes,
          maxTotalSizeBytes,
          allowedExtensions,
          mimeByExtension,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? data.details ? JSON.stringify(data.details) : 'Failed to save');
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save upload configuration');
    } finally {
      setSaving(false);
    }
  };

  const mb = (bytes: number) => Math.round(bytes / (1024 * 1024));

  if (loading) {
    return <p className="text-gray-600">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded bg-red-50 text-red-700" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded bg-green-50 text-green-700" role="alert">
          Upload settings saved successfully.
        </div>
      )}

      <div className="grid gap-4 max-w-md">
        <div>
          <label htmlFor="maxFileCount" className="block text-sm font-medium text-gray-700 mb-1">
            Max file count per idea
          </label>
          <input
            id="maxFileCount"
            type="number"
            min={1}
            max={50}
            value={maxFileCount}
            onChange={(e) => setMaxFileCount(parseInt(e.target.value, 10) || 1)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="maxFileSizeBytes" className="block text-sm font-medium text-gray-700 mb-1">
            Max per-file size (MB)
          </label>
          <input
            id="maxFileSizeBytes"
            type="number"
            min={1}
            max={100}
            value={mb(maxFileSizeBytes)}
            onChange={(e) => setMaxFileSizeBytes((parseInt(e.target.value, 10) || 1) * 1024 * 1024)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="maxTotalSizeBytes" className="block text-sm font-medium text-gray-700 mb-1">
            Max total size per idea (MB)
          </label>
          <input
            id="maxTotalSizeBytes"
            type="number"
            min={1}
            max={500}
            value={mb(maxTotalSizeBytes)}
            onChange={(e) => setMaxTotalSizeBytes((parseInt(e.target.value, 10) || 1) * 1024 * 1024)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="allowedExtensions" className="block text-sm font-medium text-gray-700 mb-1">
            Allowed extensions (comma-separated, with dot, e.g. .pdf,.doc,.png)
          </label>
          <input
            id="allowedExtensions"
            type="text"
            value={allowedExtensions.join(', ')}
            onChange={(e) => {
              const exts = e.target.value
                .split(',')
                .map((s) => {
                  const t = s.trim().toLowerCase();
                  return t.startsWith('.') ? t : `.${t}`;
                })
                .filter(Boolean);
              setAllowedExtensions(exts);
              setMimeByExtension((prev) => {
                const next = { ...prev };
                for (const ext of exts) {
                  if (!(ext in next)) next[ext] = 'application/octet-stream';
                }
                for (const key of Object.keys(next)) {
                  if (!exts.includes(key)) delete next[key];
                }
                return next;
              });
            }}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#003da5] text-white rounded hover:bg-[#00308a] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
