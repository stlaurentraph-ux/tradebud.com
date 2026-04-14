'use client';

import { AppHeader } from '@/components/layout/app-header';
import { AsyncState } from '@/components/common/async-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useContentTasks } from '@/lib/use-content';

export default function ContentTasksPage() {
  const { tasks, isLoading, error, reload, setStatus } = useContentTasks();

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Content Tasks"
        subtitle="Execution queue for drafting, review, scheduling, and analysis."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Content Tasks' }]}
      />
      <div className="flex-1 p-6">
        {isLoading ? (
          <AsyncState mode="loading" title="Loading content tasks..." />
        ) : error ? (
          <AsyncState mode="error" title="Failed to load content tasks" description={error} onRetry={reload} />
        ) : tasks.length === 0 ? (
          <AsyncState mode="empty" title="No content tasks yet" description="Generate tasks from cadence settings." />
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{task.task_type}</span>
                    <Badge variant="outline">{task.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{task.notes ?? 'No notes.'}</p>
                  <p className="text-xs text-muted-foreground">
                    Due: {task.due_date ? new Date(task.due_date).toLocaleString() : 'n/a'}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { void setStatus(task.id, 'in_progress'); }}>
                      In progress
                    </Button>
                    <Button size="sm" onClick={() => { void setStatus(task.id, 'done'); }}>
                      Mark done
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
