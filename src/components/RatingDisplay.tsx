/**
 * Displays idea rating as "4/5" or "Not yet rated".
 * Used in idea list and detail views.
 */
export function RatingDisplay({
  rating,
  ratingDisplay,
}: {
  rating: number | null;
  ratingDisplay: string;
}): JSX.Element {
  return (
    <span
      className="inline-flex items-center rounded bg-amber-50 px-2 py-0.5 text-sm font-medium text-amber-800"
      title={rating != null ? `Rating: ${rating} out of 5` : 'Not yet rated'}
    >
      {ratingDisplay}
    </span>
  );
}
