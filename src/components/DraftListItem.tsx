import Link from 'next/link';

export type DraftListItemProps = {
  id: string;
  title: string;
  updatedAt: string;
  attachmentCount: number;
  onDiscard: (id: string) => void;
  isDiscarding?: boolean;
  confirmDiscard?: boolean;
  onConfirmDiscard: () => void;
  onCancelDiscard: () => void;
};

/**
 * Single draft row in the list. Displays title (link), date, attachment count, Open and Discard actions.
 */
export function DraftListItem({
  id,
  title,
  updatedAt,
  attachmentCount,
  onDiscard,
  isDiscarding = false,
  confirmDiscard = false,
  onConfirmDiscard,
  onCancelDiscard,
}: DraftListItemProps): JSX.Element {
  const displayTitle = title || 'Untitled draft';
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(updatedAt));

  return (
    <div className="flex items-center justify-between gap-4 rounded border border-gray-200 p-4 hover:border-gray-300">
      <div className="flex-1 min-w-0">
        <Link
          href={`/ideas/submit?draftId=${id}`}
          className="text-lg font-medium text-blue-600 hover:underline truncate block"
        >
          {displayTitle}
        </Link>
        <div className="text-sm text-gray-600 mt-1">
          Updated {formattedDate}
          {attachmentCount > 0 && (
            <span className="ml-2">• {attachmentCount} attachment(s)</span>
          )}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Link href={`/ideas/submit?draftId=${id}`} className="btn btn--primary">
          Open
        </Link>
        {confirmDiscard ? (
          <>
            <span className="text-sm text-gray-600 self-center">Discard?</span>
            <button
              type="button"
              onClick={onConfirmDiscard}
              disabled={isDiscarding}
              className="btn btn--secondary text-red-700"
            >
              {isDiscarding ? '...' : 'Yes'}
            </button>
            <button type="button" onClick={onCancelDiscard} className="btn btn--secondary">
              No
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onDiscard(id)}
            disabled={isDiscarding}
            className="btn btn--secondary"
          >
            Discard
          </button>
        )}
      </div>
    </div>
  );
}
