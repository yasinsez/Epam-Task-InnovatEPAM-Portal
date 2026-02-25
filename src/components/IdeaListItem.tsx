import Link from 'next/link';

export type IdeaListItemProps = {
  id: string;
  title: string;
  categoryName: string;
  submittedAt: Date;
  hasAttachment: boolean;
};

/**
 * Single idea row in the list. Displays title (link), category, date, attachment indicator.
 */
export function IdeaListItem({
  id,
  title,
  categoryName,
  submittedAt,
  hasAttachment,
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
