'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ActivityPage() {
  return (
    <div className="flex flex-col">
      <AppHeader
        title="Activity Feed"
        subtitle="Cross-workflow events and recent operational changes"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Activity' }]}
      />
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Activity list route is now available and ready for data wiring.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

