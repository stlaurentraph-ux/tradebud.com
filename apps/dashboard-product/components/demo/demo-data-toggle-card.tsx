'use client';

import { Presentation } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useDemoData } from '@/lib/demo-data-context';

export function DemoDataToggleCard() {
  const { isToggleAvailable, demoDataEnabled, setDemoDataEnabled } = useDemoData();
  if (!isToggleAvailable) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Presentation className="h-5 w-5" />
          Demo data
        </CardTitle>
        <CardDescription>
          Show realistic sample shipments, campaigns, inbox requests, and plots for live demos. Toggle off to use your
          tenant&apos;s real data again.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
          <Checkbox
            checked={demoDataEnabled}
            onCheckedChange={(checked) => setDemoDataEnabled(checked === true)}
            aria-label="Use demo data"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">Use demo data</p>
            <p className="text-sm text-muted-foreground">
              Applies across overview, shipments, outreach, inbox, and plots for your current role. Persists for this
              browser session only.
            </p>
          </div>
        </label>
      </CardContent>
    </Card>
  );
}
