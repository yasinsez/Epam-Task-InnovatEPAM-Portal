import Link from 'next/link';
import type { IdeaStatus } from '@prisma/client';

const TRUNCATE_LENGTH = 50;

function truncate(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  const s = String(value);
  return s.length > TRUNCATE_LENGTH ? `${s.slice(0, TRUNCATE_LENGTH)}…` : s;
}

export type IdeaListItemProps = {
  id: string;
  title: string;
  categoryName: string;
  submittedAt: Date;
  hasAttachment: boolean;
  status: IdeaStatus;
  dynamicFieldValues?: Record<string, unknown> | null;
  dynamicFieldLabels?: Record<string, string>;
};

const STATUS_LABELS: Record<IdeaStatus, string> = {
  DRAFT: 'Draft',
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
  dynamicFieldValues,
  dynamicFieldLabels,
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
          {dynamicFieldValues &&
            Object.keys(dynamicFieldValues).length > 0 &&
            Object.entries(dynamicFieldValues).map(([key, val]) => (
              <span key={key} title={String(val)}>
                <span className="font-medium">
                  {(dynamicFieldLabels?.[key] ?? key)}:
                </span>{' '}
                {truncate(val)}
              </span>
            ))}
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
