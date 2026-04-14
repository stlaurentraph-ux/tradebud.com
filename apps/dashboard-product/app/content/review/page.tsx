'use client';

import { useMemo } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { AsyncState } from '@/components/common/async-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useContentCalendar, useContentTasks } from '@/lib/use-content';

export default function ContentReviewPage() {
  const { items, isLoading: isCalendarLoading, error: calendarError, reload: reloadCalendar } = useContentCalendar();
  const { tasks, isLoading: isTasksLoading, error: tasksError, reload: reloadTasks } = useContentTasks();

  const needsReview = useMemo(
    () => items.filter((item) => item.review_status === 'needs_review' || item.review_status === 'draft'),
    [items]
  );

  const missed = useMemo(() => items.filter((item) => item.status === 'missed'), [items]);
  const overdueTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'done' && task.due_date && new Date(task.due_date) < new Date()),
    [tasks]
  );

  const isLoading = isCalendarLoading || isTasksLoading;
  const error = calendarError ?? tasksError;

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Content Review"
        subtitle="Review queue, missed items, and execution risk indicators."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Content Review' }]}
      />
      <div className="flex-1 space-y-6 p-6">
        {isLoading ? (
          <AsyncState mode="loading" title="Loading review data..." />
        ) : error ? (
          <AsyncState
            mode="error"
            title="Failed to load review data"
            description={error}
            onRetry={() => {
              void reloadCalendar();
              void reloadTasks();
            }}
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Needs review</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{needsReview.length}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Missed items</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{missed.length}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Overdue tasks</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{overdueTasks.length}</p></CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Review queue</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {needsReview.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items awaiting review.</p>
                ) : needsReview.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded border p-2 text-sm">
                    <span>{item.hook ?? item.content_ideas?.title ?? 'Untitled'}</span>
                    <Badge variant="outline">{item.review_status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
