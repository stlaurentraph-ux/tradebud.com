'use client';

import { useContext } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { AsyncState } from '@/components/common/async-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useContentCalendar } from '@/lib/use-content';
import { LocaleContext } from '@/lib/locale-context';
import { buildAppBreadcrumbs, translatePageHeader } from '@/lib/nav-labels';
import { getWorkflowAsyncStateCopy } from '@/lib/workflow-terminology-labels';

export default function ContentCalendarPage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const pageHeader = translatePageHeader(t, 'content_calendar', { title: "Content Calendar", subtitle: "Scheduled posts and newsletters over the next cycles." });
  const { items, isLoading, error, reload } = useContentCalendar();

  return (
    <div className="flex flex-col">
      <AppHeader
        title={pageHeader.title}
        subtitle={pageHeader.subtitle}
        breadcrumbs={buildAppBreadcrumbs(t, { name: 'Content Calendar' })}
      />
      <div className="flex-1 p-6">
        {isLoading ? (
          <AsyncState mode="loading" title={getWorkflowAsyncStateCopy('content.calendar', 'loading', t).title} />
        ) : error ? (
          <AsyncState mode="error" title={getWorkflowAsyncStateCopy('content.calendar', 'error', t).title} description={error} onRetry={reload} />
        ) : items.length === 0 ? (
          <AsyncState mode="empty" title={getWorkflowAsyncStateCopy('content.calendar', 'empty', t).title} description={getWorkflowAsyncStateCopy('content.calendar', 'empty', t).description} />
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{item.hook ?? item.content_ideas?.title ?? 'Untitled content'}</span>
                    <Badge variant="outline">{item.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-4">
                  <div><span className="font-medium text-foreground">Channel:</span> {item.channel}</div>
                  <div><span className="font-medium text-foreground">Pillar:</span> {item.pillar ?? 'n/a'}</div>
                  <div><span className="font-medium text-foreground">Format:</span> {item.format ?? 'n/a'}</div>
                  <div><span className="font-medium text-foreground">Scheduled:</span> {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : 'n/a'}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
