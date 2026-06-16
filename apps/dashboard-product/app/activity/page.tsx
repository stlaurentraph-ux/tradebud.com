'use client';

import { useContext } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocaleContext } from '@/lib/locale-context';
import { buildAppBreadcrumbs, translatePageHeader } from '@/lib/nav-labels';

export default function ActivityPage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const pageHeader = translatePageHeader(t, 'activity', { title: "Activity Feed", subtitle: "Cross-workflow events and recent operational changes" });
  return (
    <div className="flex flex-col">
      <AppHeader
        title={pageHeader.title}
        subtitle={pageHeader.subtitle}
        breadcrumbs={buildAppBreadcrumbs(t, { name: 'Activity' })}
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

