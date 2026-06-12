/**
 * RoadmapBadge — small "Roadmap" pill for non-MVP solutions.
 *
 * Per V0_JUNE_2026_INSTRUCTIONS.md: every solution EXCEPT EUDR compliance is
 * on the roadmap and must be visually flagged as not-yet-available.
 */

type RoadmapBadgeProps = {
  label?: string;
  className?: string;
};

export function RoadmapBadge({ label = 'Roadmap', className = '' }: RoadmapBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
      {label}
    </span>
  );
}
