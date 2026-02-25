/**
 * Skeleton loader for the idea detail layout.
 * Uses Tailwind animate-pulse to mimic detail structure while loading.
 */
export function IdeaDetailSkeleton(): JSX.Element {
  return (
    <div className="idea-detail-skeleton page-container" data-testid="idea-detail-skeleton">
      <div className="mb-4 h-4 w-24 rounded bg-gray-200 animate-pulse" />
      <div className="h-8 w-3/4 rounded bg-gray-200 animate-pulse mb-4" />
      <div className="flex gap-2 mb-6">
        <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
        <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
      </div>
      <section className="mb-6">
        <div className="h-5 w-24 rounded bg-gray-200 animate-pulse mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
        </div>
      </section>
      <section>
        <div className="h-5 w-20 rounded bg-gray-200 animate-pulse mb-3" />
        <div className="h-10 w-48 rounded bg-gray-200 animate-pulse" />
      </section>
    </div>
  );
}
