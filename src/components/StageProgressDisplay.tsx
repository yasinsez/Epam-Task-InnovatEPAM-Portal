import type { CurrentStageInfo } from '@/lib/services/idea-service';

type StageProgressDisplayProps = {
  /** Current stage info when in multi-stage pipeline */
  currentStage: CurrentStageInfo;
  /** Optional: ordered list of completed stage names (from stage history) for path display */
  completedStageNames?: string[];
};

/**
 * Displays multi-stage review progress for submitters.
 * Shows "Stage X of Y: Stage Name" and optional completed path (Stage1 ✓ → Stage2 ✓ → Stage3 (current)).
 *
 * @param currentStage - Current stage with position and total
 * @param completedStageNames - Optional list of completed stage names for path display
 */
export function StageProgressDisplay({
  currentStage,
  completedStageNames = [],
}: Readonly<StageProgressDisplayProps>): JSX.Element {
  const pathParts: string[] = [];
  if (completedStageNames.length > 0) {
    pathParts.push(...completedStageNames.map((n) => `${n} ✓`));
  }
  pathParts.push(`${currentStage.name} (current)`);

  return (
    <section className="mt-4 rounded border border-gray-200 p-4">
      <h3 className="mb-2 text-sm font-semibold text-gray-700">Review Progress</h3>
      <p className="text-base font-medium text-gray-900">
        Stage {currentStage.position} of {currentStage.totalStages}: {currentStage.name}
      </p>
      {pathParts.length > 1 && (
        <p className="mt-2 text-sm text-gray-600">
          {pathParts.join(' → ')}
        </p>
      )}
    </section>
  );
}
