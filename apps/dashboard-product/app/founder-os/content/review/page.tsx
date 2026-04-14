'use client';

import { useMemo } from 'react';
import { AsyncState } from '@/components/common/async-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useContentCalendar, useContentTasks } from '@/lib/use-content';

export default function FounderOsContentReviewPage() {
  const { items, isLoading: loadingCalendar, error: calendarError, reload: reloadCalendar } = useContentCalendar();
  const { tasks, isLoading: loadingTasks, error: tasksError, reload: reloadTasks } = useContentTasks();

  const needsReview = useMemo(
    () => items.filter((item) => item.review_status === 'needs_review' || item.review_status === 'draft'),
    [items]
  );
  const missed = useMemo(() => items.filter((item) => item.status === 'missed'), [items]);
  const overdue = useMemo(
    () => tasks.filter((task) => task.status !== 'done' && task.due_date && new Date(task.due_date) < new Date()),
    [tasks]
  );

  const isLoading = loadingCalendar || loadingTasks;
  const error = calendarError ?? tasksError;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="text-2xl font-semibold">Founder OS - Content Review</h1>
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
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Needs review</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{needsReview.length}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Missed items</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{missed.length}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Overdue tasks</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{overdue.length}</p></CardContent></Card>
          </div>
        )}
      </div>
    </div>
  );
}
