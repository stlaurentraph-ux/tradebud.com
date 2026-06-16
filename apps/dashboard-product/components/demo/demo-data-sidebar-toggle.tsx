'use client';

import { useContext } from 'react';
import { Presentation } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useDemoData } from '@/lib/demo-data-context';
import { LocaleContext } from '@/lib/locale-context';
import { getDemoDataCopy } from '@/lib/demo-data-copy';

export function DemoDataSidebarToggle() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { isToggleAvailable, demoDataEnabled, setDemoDataEnabled } = useDemoData();
  if (!isToggleAvailable) return null;

  return (
    <div className="mb-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
      <label className="flex cursor-pointer items-center gap-2 text-xs text-white/80">
        <Checkbox
          checked={demoDataEnabled}
          onCheckedChange={(checked) => setDemoDataEnabled(checked === true)}
          aria-label={getDemoDataCopy('checkbox_aria', t)}
          className="border-white/40 data-[state=checked]:bg-amber-400 data-[state=checked]:text-amber-950"
        />
        <Presentation className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{getDemoDataCopy('sidebar_label', t)}</span>
      </label>
    </div>
  );
}
