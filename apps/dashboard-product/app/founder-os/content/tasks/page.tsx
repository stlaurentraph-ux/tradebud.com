'use client';

import { useState } from 'react';
import { AsyncState } from '@/components/common/async-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContentTasks } from '@/lib/use-content';

export default function FounderOsContentTasksPage() {
  const { tasks, isLoading, error, reload, setStatus, createTask } = useContentTasks();
  const [form, setForm] = useState({ task_type: 'write_post', due_date: '', notes: '' });
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await createTask(form);
      setForm((p) => ({ ...p, notes: '', due_date: '' }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="text-2xl font-semibold">Founder OS - Content Tasks</h1>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Add task</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-2 md:grid-cols-3">
              <Input placeholder="Task type" required value={form.task_type} onChange={(e) => setForm((p) => ({ ...p, task_type: e.target.value }))} />
              <Input type="datetime-local" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} />
              <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              <Button type="submit" className="md:col-span-3" disabled={isSaving}>{isSaving ? 'Adding...' : 'Add task'}</Button>
            </form>
          </CardContent>
        </Card>
        {isLoading ? (
          <AsyncState mode="loading" title="Loading content tasks..." />
        ) : error ? (
          <AsyncState mode="error" title="Failed to load content tasks" description={error} onRetry={reload} />
        ) : tasks.length === 0 ? (
          <AsyncState mode="empty" title="No content tasks yet" description="Generate tasks from cadence settings." />
        ) : (
          tasks.map((task) => (
            <Card key={task.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{task.task_type}</span>
                  <Badge variant="outline">{task.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{task.notes ?? 'No notes.'}</p>
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
          ))
        )}
      </div>
    </div>
  );
}
