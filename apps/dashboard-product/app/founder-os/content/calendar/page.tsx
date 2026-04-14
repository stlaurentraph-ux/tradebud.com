'use client';

import { useState } from 'react';
import { AsyncState } from '@/components/common/async-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContentCalendar } from '@/lib/use-content';

export default function FounderOsContentCalendarPage() {
  const { items, isLoading, error, reload, createItem, ensureWeeklyTarget } = useContentCalendar();
  const [message, setMessage] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [form, setForm] = useState({
    channel: 'linkedin_post',
    pillar: 'eudr',
    hook: '',
    scheduled_at: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await createItem({
        channel: form.channel,
        pillar: form.pillar,
        hook: form.hook,
        scheduled_at: form.scheduled_at || undefined,
      });
      setForm((p) => ({ ...p, hook: '', scheduled_at: '' }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="text-2xl font-semibold">Founder OS - Content Calendar</h1>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Weekly publishing target</p>
              <p className="text-3xl font-semibold">
                {
                  items.filter((item) => {
                    if (!item.scheduled_at || item.channel !== 'linkedin_post') return false;
                    const now = new Date();
                    const day = now.getDay();
                    const diff = day === 0 ? -6 : 1 - day;
                    const monday = new Date(now);
                    monday.setDate(now.getDate() + diff);
                    monday.setHours(0, 0, 0, 0);
                    const nextMonday = new Date(monday);
                    nextMonday.setDate(monday.getDate() + 7);
                    const scheduled = new Date(item.scheduled_at);
                    return scheduled >= monday && scheduled < nextMonday;
                  }).length
                } / 2
              </p>
            </div>
            <Button
              variant="outline"
              disabled={isPlanning}
              onClick={() => {
                setIsPlanning(true);
                setMessage(null);
                void ensureWeeklyTarget(new Date().toISOString().slice(0, 10), 2)
                  .then((added) => setMessage(added > 0 ? `Added ${added} post slot(s).` : 'No new post slots needed this week.'))
                  .catch((err) => setMessage(err instanceof Error ? err.message : 'Failed to plan weekly posts.'))
                  .finally(() => setIsPlanning(false));
              }}
            >
              {isPlanning ? 'Planning...' : 'Plan 2 posts this week'}
            </Button>
          </CardContent>
        </Card>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Add calendar item</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-2 md:grid-cols-4">
              <Input placeholder="Channel" required value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))} />
              <Input placeholder="Pillar" value={form.pillar} onChange={(e) => setForm((p) => ({ ...p, pillar: e.target.value }))} />
              <Input placeholder="Hook" value={form.hook} onChange={(e) => setForm((p) => ({ ...p, hook: e.target.value }))} />
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))} />
              <Button type="submit" className="md:col-span-4" disabled={isSaving}>{isSaving ? 'Adding...' : 'Add item'}</Button>
            </form>
          </CardContent>
        </Card>
        {isLoading ? (
          <AsyncState mode="loading" title="Loading content calendar..." />
        ) : error ? (
          <AsyncState mode="error" title="Failed to load content calendar" description={error} onRetry={reload} />
        ) : items.length === 0 ? (
          <AsyncState mode="empty" title="No content scheduled yet" description="Add calendar items to see publishing rhythm." />
        ) : (
          items.map((item) => (
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
          ))
        )}
      </div>
    </div>
  );
}
