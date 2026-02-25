/**
 * Skeleton loader for the idea list layout.
 * Uses Tailwind animate-pulse to mimic list structure while loading.
 */
export function IdeaListSkeleton(): JSX.Element {
  const rows = 5;
  return (
    <div className="idea-list-skeleton" data-testid="idea-list-skeleton">
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded border border-gray-200 p-4">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 rounded bg-gray-200 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
                <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
              </div>
            </div>
            <div className="h-6 w-6 shrink-0 rounded bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
