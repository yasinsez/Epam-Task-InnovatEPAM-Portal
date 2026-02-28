'use client';

import React, { ChangeEvent } from 'react';

/** Display config for attachment input (limits and allowed types) */
export type UploadConfigDisplay = {
  maxFileCount: number;
  maxFileSizeBytes: number;
  maxTotalSizeBytes: number;
  allowedExtensions: string[];
  allowedTypesLabel: string;
};

/**
 * Validates file on client against config.
 */
function validateFileClient(file: File, config: UploadConfigDisplay): string | null {
  if (!file || file.size === 0) {
    return 'File is empty. Please select a valid file';
  }
  if (file.size > config.maxFileSizeBytes) {
    const maxMb = Math.round(config.maxFileSizeBytes / (1024 * 1024));
    return `File too large (max ${maxMb} MB per file)`;
  }
  const ext = getExtension(file.name);
  if (!ext || !config.allowedExtensions.some((e) => e.toLowerCase() === ext.toLowerCase())) {
    return `File type not supported. Accepted: ${config.allowedTypesLabel}`;
  }
  return null;
}

function getExtension(filename: string): string | null {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return null;
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Multi-file input for attaching files to an idea submission.
 * Supports add, remove, replace. Displays allowed types and limits from config.
 *
 * @param value - Array of currently selected Files
 * @param onChange - Called when file list changes
 * @param config - Upload config for validation and display
 * @param error - Optional server validation error
 * @param disabled - Whether input is disabled (e.g. during submit)
 */
export interface IdeaAttachmentInputProps {
  value: File[];
  onChange: (files: File[]) => void;
  config: UploadConfigDisplay;
  error?: string;
  disabled?: boolean;
}

export function IdeaAttachmentInput({
  value,
  onChange,
  config,
  error,
  disabled,
}: IdeaAttachmentInputProps): JSX.Element {
  const [clientError, setClientError] = React.useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newFiles = Array.from(e.target.files ?? []);
    setClientError(null);
    e.target.value = '';

    if (newFiles.length === 0) return;

    const merged = [...value];
    for (const file of newFiles) {
      if (merged.length >= config.maxFileCount) {
        setClientError(`Maximum ${config.maxFileCount} files allowed`);
        break;
      }
      const err = validateFileClient(file, config);
      if (err) {
        setClientError(err);
        break;
      }
      merged.push(file);
    }

    const totalBytes = merged.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > config.maxTotalSizeBytes) {
      setClientError(
        `Total size exceeds ${Math.round(config.maxTotalSizeBytes / (1024 * 1024))} MB limit`,
      );
    } else {
      onChange(merged);
    }
  };

  const handleRemove = (index: number): void => {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
    setClientError(null);
  };

  const accept = config.allowedExtensions.join(',');
  const maxMb = Math.round(config.maxFileSizeBytes / (1024 * 1024));
  const totalMb = Math.round(config.maxTotalSizeBytes / (1024 * 1024));

  return (
    <div className="form-group">
      <label htmlFor="attachments">Attachments (optional)</label>
      <p className="text-sm text-gray-600 mb-1">
        Up to {config.maxFileCount} files, {maxMb} MB each, {totalMb} MB total. Types: {config.allowedTypesLabel}
      </p>
      <input
        id="attachments"
        type="file"
        name="attachments"
        multiple
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        aria-describedby={error || clientError ? 'attachment-error' : undefined}
      />
      {value.length > 0 && (
        <ul className="mt-2 space-y-1">
          {value.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center gap-2 text-sm">
              <span>{file.name}</span>
              <span className="text-gray-500">({Math.round(file.size / 1024)} KB)</span>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                className="text-red-600 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {(error || clientError) && (
        <div id="attachment-error" className="field-error">
          {error || clientError}
        </div>
      )}
    </div>
  );
}
