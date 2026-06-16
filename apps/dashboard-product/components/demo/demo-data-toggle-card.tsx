'use client';

import { useContext } from 'react';
import { Presentation } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useDemoData } from '@/lib/demo-data-context';
import { LocaleContext } from '@/lib/locale-context';
import { getDemoDataCopy } from '@/lib/demo-data-copy';

export function DemoDataToggleCard() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { isToggleAvailable, demoDataEnabled, setDemoDataEnabled } = useDemoData();
  if (!isToggleAvailable) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Presentation className="h-5 w-5" />
          {getDemoDataCopy('card_title', t)}
        </CardTitle>
        <CardDescription>{getDemoDataCopy('card_description', t)}</CardDescription>
      </CardHeader>
      <CardContent>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
          <Checkbox
            checked={demoDataEnabled}
            onCheckedChange={(checked) => setDemoDataEnabled(checked === true)}
            aria-label={getDemoDataCopy('checkbox_aria', t)}
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">{getDemoDataCopy('checkbox_label', t)}</p>
            <p className="text-sm text-muted-foreground">{getDemoDataCopy('checkbox_hint', t)}</p>
          </div>
        </label>
      </CardContent>
    </Card>
  );
}
