/**
 * Component Interfaces for Multi-Media Support
 *
 * TypeScript interfaces for multi-file attachment input and attachments list.
 *
 * @module contracts/component-interfaces
 */

/**
 * Props for the multi-file IdeaAttachmentInput component
 *
 * Replaces single-file input; supports add, remove, replace. Displays
 * allowed types, per-file limit, total limit, and max file count from config.
 *
 * @example
 * <IdeaAttachmentInput
 *   value={files}
 *   onChange={setFiles}
 *   config={uploadConfig}
 *   error={attachmentError}
 *   disabled={isSubmitting}
 * />
 */
export interface IdeaAttachmentInputProps {
  /**
   * Array of currently selected Files
   */
  value: File[];

  /**
   * Called when file list changes (add, remove, replace)
   */
  onChange: (files: File[]) => void;

  /**
   * Upload configuration (limits and allowed types) for validation and display
   */
  config: UploadConfigDisplay;

  /**
   * Optional server validation error to display
   */
  error?: string;

  /**
   * Whether input is disabled (e.g. during submit)
   */
  disabled?: boolean;
}

/**
 * Display-only upload config for client (no DB ids)
 */
export interface UploadConfigDisplay {
  maxFileCount: number;
  maxFileSizeBytes: number;
  maxTotalSizeBytes: number;
  allowedExtensions: string[];
  allowedTypesLabel: string; // e.g. "PDF, DOC, DOCX, PNG, JPG, GIF, XLS, XLSX"
}

/**
 * Props for the IdeaAttachmentsList component
 *
 * Displays attachments in idea detail view: filename, type, size,
 * download link. For images: optional inline preview.
 *
 * @example
 * <IdeaAttachmentsList attachments={idea.attachments} ideaId={idea.id} />
 */
export interface IdeaAttachmentsListProps {
  /**
   * Attachments to display
   */
  attachments: AttachmentDisplay[];

  /**
   * Idea ID for building download URLs
   */
  ideaId: string;

  /**
   * Whether to show image previews (inline) when type is image
   * @default true
   */
  showImagePreviews?: boolean;
}

/**
 * Attachment data for display (from API/DB)
 */
export interface AttachmentDisplay {
  id: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

/**
 * Props for UploadConfigForm (admin settings page)
 */
export interface UploadConfigFormProps {
  /**
   * Initial config values (from GET)
   */
  initialConfig: UploadConfigDisplay & {
    mimeByExtension: Record<string, string>;
  };

  /**
   * Called on successful save
   */
  onSave?: () => void;
}
