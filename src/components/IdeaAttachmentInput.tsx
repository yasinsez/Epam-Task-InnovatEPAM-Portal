'use client';

import React, { ChangeEvent } from 'react';
import { MAX_ATTACHMENT_SIZE_BYTES, ALLOWED_EXTENSIONS } from '@/lib/constants/attachment';

const ACCEPT = '.pdf,.docx,.png,.jpg,.jpeg,.gif';

/**
 * Validates file on client: size, type, non-empty.
 * Returns error message or null if valid.
 */
function validateFileClient(file: File): string | null {
  if (!file || file.size === 0) {
    return 'File is empty. Please select a valid file';
  }
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return 'File too large (max 25 MB)';
  }
  const ext = getExtension(file.name);
  if (!ext || !(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return 'File type not supported. Accepted: PDF, DOCX, PNG, JPG, GIF';
  }
  return null;
}

function getExtension(filename: string): string | null {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return null;
  return filename.slice(lastDot).toLowerCase();
}

/**
 * File input for attaching a single file to an idea submission.
 * Client-side validation (size, type) before submit; displays errors.
 * Supports replace-on-reselect and displays selected file name with Remove button.
 *
 * @param value - Currently selected File or null
 * @param onChange - Called when file is selected or removed
 * @param error - Optional validation error from server to display
 * @param disabled - Whether the input is disabled (e.g. during submit)
 *
 * @example
 * <IdeaAttachmentInput value={file} onChange={setFile} error={attachmentError} disabled={isSubmitting} />
 */
export interface IdeaAttachmentInputProps {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}

export function IdeaAttachmentInput({
  value,
  onChange,
  error,
  disabled,
}: IdeaAttachmentInputProps): JSX.Element {
  const [clientError, setClientError] = React.useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] ?? null;
    setClientError(null);
    if (file) {
      const err = validateFileClient(file);
      if (err) {
        setClientError(err);
        onChange(null);
        e.target.value = '';
        return;
      }
    }
    onChange(file);
  };

  const handleRemove = (): void => {
    onChange(null);
  };

  return (
    <div className="form-group">
      <label htmlFor="attachment">Attachment (optional)</label>
      <input
        id="attachment"
        type="file"
        name="attachment"
        accept={ACCEPT}
        onChange={handleChange}
        disabled={disabled}
        aria-describedby={error ? 'attachment-error' : undefined}
      />
      {value && (
        <div className="attachment-preview">
          <span>{value.name}</span>
          <button type="button" onClick={handleRemove} disabled={disabled} aria-label="Remove attachment">
            Remove
          </button>
        </div>
      )}
      {(error || clientError) && (
        <div id="attachment-error" className="field-error">
          {error || clientError}
        </div>
      )}
    </div>
  );
}
