'use client';

import { useState } from 'react';
import { AsyncState } from '@/components/common/async-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useOutreachActivity, useProspects } from '@/lib/use-crm';

export default function FounderOsCrmProspectsPage() {
  const { prospects, isLoading, error, reload, createProspect } = useProspects();
  const { activities, createActivity } = useOutreachActivity();
  const [form, setForm] = useState({ name: '', company: '', email: '', notes: '' });
  const [exchangeDraft, setExchangeDraft] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await createProspect(form);
      setForm({ name: '', company: '', email: '', notes: '' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="text-2xl font-semibold">Founder OS - CRM Prospects</h1>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Add prospect</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-2 md:grid-cols-4">
              <Input placeholder="Name" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Company" required value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} />
              <Input placeholder="Email (optional)" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Adding...' : 'Add'}</Button>
              <Textarea
                placeholder="Note (optional)"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="md:col-span-4"
              />
            </form>
          </CardContent>
        </Card>
        {isLoading ? (
          <AsyncState mode="loading" title="Loading prospects..." />
        ) : error ? (
          <AsyncState mode="error" title="Failed to load prospects" description={error} onRetry={reload} />
        ) : prospects.length === 0 ? (
          <AsyncState mode="empty" title="No prospects yet" description="Add leads from website forms or manual research." />
        ) : (
          prospects.map((prospect) => (
            <Card key={prospect.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{prospect.name}</span>
                  <Badge variant="outline">{prospect.stage}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                <div><span className="font-medium text-foreground">Company:</span> {prospect.company}</div>
                <div><span className="font-medium text-foreground">Email:</span> {prospect.email ?? 'n/a'}</div>
                <div><span className="font-medium text-foreground">Source:</span> {prospect.source ?? 'n/a'}</div>
                <div className="md:col-span-3"><span className="font-medium text-foreground">Note:</span> {prospect.notes ?? 'n/a'}</div>
                <div className="space-y-2 md:col-span-3">
                  <p className="font-medium text-foreground">Exchange log</p>
                  <div className="space-y-2">
                    {activities
                      .filter((activity) => activity.prospect_id === prospect.id)
                      .slice(0, 3)
                      .map((activity) => (
                        <div key={activity.id} className="rounded border p-2 text-xs">
                          <p>{activity.content}</p>
                          <p className="mt-1 text-muted-foreground">{new Date(activity.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Log exchange/note"
                      value={exchangeDraft[prospect.id] ?? ''}
                      onChange={(e) => setExchangeDraft((prev) => ({ ...prev, [prospect.id]: e.target.value }))}
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        const content = exchangeDraft[prospect.id]?.trim();
                        if (!content) return;
                        void createActivity({ prospect_id: prospect.id, content, activity_type: 'note', channel: 'manual' });
                        setExchangeDraft((prev) => ({ ...prev, [prospect.id]: '' }));
                      }}
                    >
                      Log exchange
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
