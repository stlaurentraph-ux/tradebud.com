'use client';

import { Presentation } from 'lucide-react';
import { useDemoData } from '@/lib/demo-data-context';

export function DemoDataBanner() {
  const { demoDataEnabled } = useDemoData();
  if (!demoDataEnabled) return null;

  return (
    <div
      className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2">
        <Presentation className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          <strong>Demo data mode</strong> is on. Screens show sample records only — actions do not write to production.
        </span>
      </div>
    </div>
  );
}
