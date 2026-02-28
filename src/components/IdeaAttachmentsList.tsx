'use client';

/**
 * Attachment display shape from API/DB
 */
export type AttachmentDisplay = {
  id: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
};

export interface IdeaAttachmentsListProps {
  attachments: AttachmentDisplay[];
  ideaId: string;
  showImagePreviews?: boolean;
}

/**
 * Displays attachments in idea detail view.
 * Shows filename, size, download link. For images: optional inline preview.
 *
 * @param attachments - Attachments to display
 * @param ideaId - Idea ID for building download URLs
 * @param showImagePreviews - Whether to show inline image previews (default true)
 */
export function IdeaAttachmentsList({
  attachments,
  ideaId,
  showImagePreviews = true,
}: IdeaAttachmentsListProps): JSX.Element | null {
  if (!attachments || attachments.length === 0) return null;

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <section className="idea-attachment">
      <h2>Attachments</h2>
      <ul className="space-y-2">
        {attachments.map((att) => (
          <li key={att.id} className="flex flex-col gap-1">
            <a
              href={
                attachments.length === 1
                  ? `/api/ideas/${ideaId}/attachment`
                  : `/api/ideas/${ideaId}/attachments/${att.id}`
              }
              download={att.originalFileName}
              className="attachment-download-link"
            >
              {att.originalFileName} ({formatSize(att.fileSizeBytes)})
            </a>
            {showImagePreviews && att.mimeType.startsWith('image/') && (
              <img
                src={`/api/ideas/${ideaId}/attachments/${att.id}`}
                alt={att.originalFileName}
                className="max-w-full max-h-48 rounded border border-gray-200"
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
