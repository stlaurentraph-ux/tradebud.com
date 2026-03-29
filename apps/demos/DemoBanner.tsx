/** Shared top-of-page notice for public Next.js demos under `apps/demos/*`. */
export function DemoBanner() {
  return (
    <div className="bg-amber-950 text-amber-50 text-center text-xs sm:text-sm py-2.5 px-4 border-b border-amber-800/80 z-[100] relative">
      <strong className="font-semibold">Demonstration UI</strong>
      {' — '}Illustrative workflows and mock data only. Product architecture, regulatory scope, and roadmap are described on{' '}
      <a
        href="https://tracebud.com"
        className="underline font-medium text-white hover:text-amber-100"
        target="_blank"
        rel="noopener noreferrer"
      >
        tracebud.com
      </a>
      .
    </div>
  );
}
