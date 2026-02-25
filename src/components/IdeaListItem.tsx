import Link from 'next/link';
import type { IdeaStatus } from '@prisma/client';

export type IdeaListItemProps = {
  id: string;
  title: string;
  categoryName: string;
  submittedAt: Date;
  hasAttachment: boolean;
  status: IdeaStatus;
};

const STATUS_LABELS: Record<IdeaStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};

/**
 * Single idea row in the list. Displays title (link), category, date, status, attachment indicator.
 */
export function IdeaListItem({
  id,
  title,
  categoryName,
  submittedAt,
  hasAttachment,
  status,
}: IdeaListItemProps): JSX.Element {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(submittedAt);

  return (
    <div className="flex items-center gap-4 rounded border border-gray-200 p-4 hover:border-gray-300">
      <div className="flex-1 min-w-0">
        <Link
          href={`/ideas/${id}`}
          className="text-lg font-medium text-blue-600 hover:underline truncate block"
        >
          {title}
        </Link>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
          <span>{categoryName}</span>
          <span>•</span>
          <time dateTime={submittedAt.toISOString()}>{formattedDate}</time>
          <span>•</span>
          <span
            className="inline-flex rounded px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor:
                status === 'ACCEPTED'
                  ? '#dcfce7'
                  : status === 'REJECTED'
                    ? '#fee2e2'
                    : status === 'UNDER_REVIEW'
                      ? '#fef3c7'
                      : '#e5e7eb',
              color:
                status === 'ACCEPTED'
                  ? '#166534'
                  : status === 'REJECTED'
                    ? '#991b1b'
                    : status === 'UNDER_REVIEW'
                      ? '#92400e'
                      : '#374151',
            }}
          >
            {STATUS_LABELS[status]}
          </span>
        </div>
      </div>
      {hasAttachment && (
        <span
          className="shrink-0 inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
          aria-label="Has attachment"
        >
          📎
        </span>
      )}
    </div>
  );
}
