'use client';

import { useEffect, useState, useCallback } from 'react';

const FORM_FIELD_TYPES = [
  { value: 'TEXT', label: 'Text (single line)' },
  { value: 'LONG_TEXT', label: 'Long text (multiline)' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'SINGLE_SELECT', label: 'Single select (dropdown)' },
  { value: 'MULTI_SELECT', label: 'Multi select' },
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'DATE', label: 'Date' },
] as const;

type FormFieldDto = {
  id: string;
  label: string;
  fieldType: string;
  required: boolean;
  displayOrder: number;
  options: string[] | null;
  minValue: number | null;
  maxValue: number | null;
  maxLength: number | null;
};

type FormFieldEditor = FormFieldDto & { optionsText?: string };

/**
 * Client component for editing form configuration.
 * Lists fields, supports add/edit/remove/reorder via up-down buttons.
 */
export function FormConfigEditor() {
  const [fields, setFields] = useState<FormFieldEditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/form-config', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to load form configuration');
        return;
      }
      const list = (data.formConfig?.fields ?? []).map((f: FormFieldDto) => ({
        ...f,
        optionsText: Array.isArray(f.options) ? f.options.join('\n') : '',
      }));
      setFields(list);
    } catch {
      setError('Failed to load form configuration');
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
      const payload = fields.map((f, idx) => {
        const opts = f.optionsText?.trim()
          ? f.optionsText.split(/\n/).map((s) => s.trim()).filter(Boolean)
          : null;
        return {
          ...(f.id ? { id: f.id } : {}),
          label: f.label.trim(),
          fieldType: f.fieldType,
          required: f.required,
          displayOrder: idx,
          options: ['SINGLE_SELECT', 'MULTI_SELECT'].includes(f.fieldType) ? opts ?? [] : null,
          minValue: f.fieldType === 'NUMBER' ? f.minValue : null,
          maxValue: f.fieldType === 'NUMBER' ? f.maxValue : null,
          maxLength: ['TEXT', 'LONG_TEXT'].includes(f.fieldType) ? f.maxLength : null,
        };
      });

      const res = await fetch('/api/admin/form-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: payload }),
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const msg = Object.entries(data.details)
            .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
            .join('; ');
          setError(msg);
        } else {
          setError(data.error ?? 'Failed to save');
        }
        return;
      }
      setSuccess(true);
      setFields(
        (data.formConfig?.fields ?? []).map((f: FormFieldDto) => ({
          ...f,
          optionsText: Array.isArray(f.options) ? f.options.join('\n') : '',
        })),
      );
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (index: number, updates: Partial<FormFieldEditor>) => {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f)),
    );
  };

  const addField = () => {
    setFields((prev) => [
      ...prev,
      {
        id: '',
        label: '',
        fieldType: 'TEXT',
        required: false,
        displayOrder: prev.length,
        options: null,
        minValue: null,
        maxValue: null,
        maxLength: null,
        optionsText: '',
      },
    ]);
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    setFields((prev) => {
      const copy = [...prev];
      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
      return copy;
    });
  };

  const moveDown = (index: number) => {
    if (index >= fields.length - 1) return;
    setFields((prev) => {
      const copy = [...prev];
      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
      return copy;
    });
  };

  if (loading) {
    return <p className="text-[#64748b]">Loading form configuration...</p>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-red-700" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div
          className="rounded border border-green-200 bg-green-50 px-4 py-2 text-green-700"
          role="status"
        >
          Form configuration updated successfully.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#0f172a]">Dynamic Fields</h2>
        <button
          type="button"
          onClick={addField}
          className="rounded bg-[#003da5] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#003088] focus:outline-none focus:ring-2 focus:ring-[#003da5]"
        >
          Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <p className="text-[#64748b]">No dynamic fields. Click &quot;Add Field&quot; to add one.</p>
      ) : (
        <ul className="space-y-4">
          {fields.map((field, index) => (
            <li
              key={field.id || `new-${index}`}
              className="rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[#64748b]">Field {index + 1}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="rounded px-2 py-1 text-sm text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-50 disabled:hover:bg-transparent"
                    aria-label="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === fields.length - 1}
                    className="rounded px-2 py-1 text-sm text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-50 disabled:hover:bg-transparent"
                    aria-label="Move down"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                    aria-label="Remove"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#334155]">Label</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    placeholder="e.g. Department"
                    maxLength={100}
                    className="w-full rounded border border-[#e2e8f0] px-3 py-2 text-sm focus:border-[#003da5] focus:outline-none focus:ring-1 focus:ring-[#003da5]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#334155]">Type</label>
                  <select
                    value={field.fieldType}
                    onChange={(e) =>
                      updateField(index, {
                        fieldType: e.target.value,
                        options: ['SINGLE_SELECT', 'MULTI_SELECT'].includes(e.target.value)
                          ? []
                          : null,
                        optionsText: '',
                      })
                    }
                    className="w-full rounded border border-[#e2e8f0] px-3 py-2 text-sm focus:border-[#003da5] focus:outline-none focus:ring-1 focus:ring-[#003da5]"
                  >
                    {FORM_FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`required-${index}`}
                  checked={field.required}
                  onChange={(e) => updateField(index, { required: e.target.checked })}
                  className="h-4 w-4 rounded border-[#e2e8f0]"
                />
                <label htmlFor={`required-${index}`} className="text-sm text-[#334155]">
                  Required
                </label>
              </div>

              {['SINGLE_SELECT', 'MULTI_SELECT'].includes(field.fieldType) && (
                <div className="mt-3">
                  <label className="mb-1 block text-sm font-medium text-[#334155]">
                    Options (one per line, max 50)
                  </label>
                  <textarea
                    value={field.optionsText ?? ''}
                    onChange={(e) => updateField(index, { optionsText: e.target.value })}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={4}
                    className="w-full rounded border border-[#e2e8f0] px-3 py-2 text-sm focus:border-[#003da5] focus:outline-none focus:ring-1 focus:ring-[#003da5]"
                  />
                </div>
              )}

              {field.fieldType === 'NUMBER' && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#334155]">Min value</label>
                    <input
                      type="number"
                      value={field.minValue ?? ''}
                      onChange={(e) =>
                        updateField(index, {
                          minValue: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      className="w-full rounded border border-[#e2e8f0] px-3 py-2 text-sm focus:border-[#003da5] focus:outline-none focus:ring-1 focus:ring-[#003da5]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#334155]">Max value</label>
                    <input
                      type="number"
                      value={field.maxValue ?? ''}
                      onChange={(e) =>
                        updateField(index, {
                          maxValue: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      className="w-full rounded border border-[#e2e8f0] px-3 py-2 text-sm focus:border-[#003da5] focus:outline-none focus:ring-1 focus:ring-[#003da5]"
                    />
                  </div>
                </div>
              )}

              {['TEXT', 'LONG_TEXT'].includes(field.fieldType) && (
                <div className="mt-3">
                  <label className="mb-1 block text-sm font-medium text-[#334155]">
                    Max length (optional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={field.maxLength ?? ''}
                    onChange={(e) =>
                      updateField(index, {
                        maxLength:
                          e.target.value === '' ? null : parseInt(e.target.value, 10) || null,
                      })
                    }
                    className="w-32 rounded border border-[#e2e8f0] px-3 py-2 text-sm focus:border-[#003da5] focus:outline-none focus:ring-1 focus:ring-[#003da5]"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-[#003da5] px-4 py-2 font-medium text-white hover:bg-[#003088] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#003da5]"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
