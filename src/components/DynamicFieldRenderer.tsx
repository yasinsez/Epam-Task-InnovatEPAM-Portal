'use client';

import { ChangeEvent } from 'react';

export type FormFieldDefinition = {
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

export type DynamicFieldValues = Record<string, string | number | boolean | string[]>;

interface DynamicFieldRendererProps {
  field: FormFieldDefinition;
  value: string | number | boolean | string[] | undefined;
  onChange: (fieldId: string, value: string | number | boolean | string[]) => void;
  disabled?: boolean;
  error?: string[];
  idPrefix?: string;
}

/**
 * Renders a single dynamic form field based on fieldType.
 * Supports: text, longText, number, singleSelect, multiSelect, checkbox, date.
 */
export function DynamicFieldRenderer({
  field,
  value,
  onChange,
  disabled = false,
  error,
  idPrefix = 'dyn',
}: DynamicFieldRendererProps) {
  const inputId = `${idPrefix}-${field.id}`;
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { type, value: v, checked } = e.target as HTMLInputElement & { value: string; checked?: boolean };
    if (type === 'checkbox') {
      onChange(field.id, !!checked);
    } else {
      onChange(field.id, v);
    }
  };

  switch (field.fieldType) {
    case 'TEXT':
      return (
        <div className="form-group">
          <label htmlFor={inputId}>
            {field.label}
            {field.required && <span className="required" aria-label="required"> *</span>}
          </label>
          <input
            id={inputId}
            type="text"
            value={(value as string) ?? ''}
            onChange={handleChange}
            disabled={disabled}
            maxLength={field.maxLength ?? undefined}
            aria-required={field.required}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="w-full rounded border border-[#e2e8f0] px-3 py-2 focus:border-[#003da5] focus:outline-none focus:ring-1 focus:ring-[#003da5]"
          />
          {error && (
            <div id={`${inputId}-error`} className="field-error text-sm text-red-600">
              {error.join(', ')}
            </div>
          )}
        </div>
      );

    case 'LONG_TEXT':
      return (
        <div className="form-group">
          <label htmlFor={inputId}>
            {field.label}
            {field.required && <span className="required" aria-label="required"> *</span>}
          </label>
          <textarea
            id={inputId}
            value={(value as string) ?? ''}
            onChange={handleChange}
            disabled={disabled}
            rows={4}
            maxLength={field.maxLength ?? 10000}
            aria-required={field.required}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="w-full rounded border border-[#e2e8f0] px-3 py-2 focus:border-[#003da5] focus:outline-none focus:ring-1 focus:ring-[#003da5]"
          />
          {error && (
            <div id={`${inputId}-error`} className="field-error text-sm text-red-600">
              {error.join(', ')}
            </div>
          )}
        </div>
      );

    case 'NUMBER':
      return (
        <div className="form-group">
          <label htmlFor={inputId}>
            {field.label}
            {field.required && <span className="required" aria-label="required"> *</span>}
          </label>
          <input
            id={inputId}
            type="number"
            value={(value as number) ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              onChange(field.id, v === '' ? ('' as unknown as number) : Number(v));
            }}
            disabled={disabled}
            min={field.minValue ?? undefined}
            max={field.maxValue ?? undefined}
            aria-required={field.required}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="w-full rounded border border-[#e2e8f0] px-3 py-2 focus:border-[#003da5] focus:outline-none focus:ring-1 focus:ring-[#003da5]"
          />
          {error && (
            <div id={`${inputId}-error`} className="field-error text-sm text-red-600">
              {error.join(', ')}
            </div>
          )}
        </div>
      );

    case 'SINGLE_SELECT': {
      const options = field.options ?? [];
      return (
        <div className="form-group">
          <label htmlFor={inputId}>
            {field.label}
            {field.required && <span className="required" aria-label="required"> *</span>}
          </label>
          <select
            id={inputId}
            value={(value as string) ?? ''}
            onChange={handleChange}
            disabled={disabled}
            aria-required={field.required}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="w-full rounded border border-[#e2e8f0] px-3 py-2 focus:border-[#003da5] focus:outline-none focus:ring-1 focus:ring-[#003da5]"
          >
            <option value="">Select...</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {error && (
            <div id={`${inputId}-error`} className="field-error text-sm text-red-600">
              {error.join(', ')}
            </div>
          )}
        </div>
      );
    }

    case 'MULTI_SELECT': {
      const options = field.options ?? [];
      const selected = (Array.isArray(value) ? value : []) as string[];
      const toggleOption = (opt: string) => {
        const next = selected.includes(opt)
          ? selected.filter((o) => o !== opt)
          : [...selected, opt];
        onChange(field.id, next);
      };
      return (
        <div className="form-group">
          <span className="block font-medium text-[#334155]">
            {field.label}
            {field.required && <span className="required" aria-label="required"> *</span>}
          </span>
          <div className="mt-2 space-y-2">
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  disabled={disabled}
                  className="h-4 w-4 rounded border-[#e2e8f0]"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
          {error && (
            <div id={`${inputId}-error`} className="field-error mt-1 text-sm text-red-600">
              {error.join(', ')}
            </div>
          )}
        </div>
      );
    }

    case 'CHECKBOX':
      return (
        <div className="form-group">
          <label className="flex items-center gap-2">
            <input
              id={inputId}
              type="checkbox"
              checked={(value as boolean) ?? false}
              onChange={(e) => onChange(field.id, e.target.checked)}
              disabled={disabled}
              aria-required={field.required}
              aria-describedby={error ? `${inputId}-error` : undefined}
              className="h-4 w-4 rounded border-[#e2e8f0]"
            />
            <span>{field.label}</span>
            {field.required && <span className="required" aria-label="required"> *</span>}
          </label>
          {error && (
            <div id={`${inputId}-error`} className="field-error mt-1 text-sm text-red-600">
              {error.join(', ')}
            </div>
          )}
        </div>
      );

    case 'DATE':
      return (
        <div className="form-group">
          <label htmlFor={inputId}>
            {field.label}
            {field.required && <span className="required" aria-label="required"> *</span>}
          </label>
          <input
            id={inputId}
            type="date"
            value={(value as string)?.slice(0, 10) ?? ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            disabled={disabled}
            aria-required={field.required}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="w-full rounded border border-[#e2e8f0] px-3 py-2 focus:border-[#003da5] focus:outline-none focus:ring-1 focus:ring-[#003da5]"
          />
          {error && (
            <div id={`${inputId}-error`} className="field-error text-sm text-red-600">
              {error.join(', ')}
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="form-group">
          <label htmlFor={inputId}>{field.label}</label>
          <input
            id={inputId}
            type="text"
            value={(value as string) ?? ''}
            onChange={handleChange}
            disabled={disabled}
            className="w-full rounded border border-[#e2e8f0] px-3 py-2"
          />
        </div>
      );
  }
}
