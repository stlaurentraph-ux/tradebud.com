'use client';

import { Presentation } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useDemoData } from '@/lib/demo-data-context';

export function DemoDataSidebarToggle() {
  const { isToggleAvailable, demoDataEnabled, setDemoDataEnabled } = useDemoData();
  if (!isToggleAvailable) return null;

  return (
    <div className="mb-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
      <label className="flex cursor-pointer items-center gap-2 text-xs text-white/80">
        <Checkbox
          checked={demoDataEnabled}
          onCheckedChange={(checked) => setDemoDataEnabled(checked === true)}
          aria-label="Use demo data"
          className="border-white/40 data-[state=checked]:bg-amber-400 data-[state=checked]:text-amber-950"
        />
        <Presentation className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Demo data</span>
      </label>
    </div>
  );
}
