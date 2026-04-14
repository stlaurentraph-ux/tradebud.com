'use client';

import { useMemo, useState } from 'react';
import { AsyncState } from '@/components/common/async-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useOutreachTemplates } from '@/lib/use-crm';

export default function FounderOsCrmTemplatesPage() {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ name: '', stage: 'follow_up', channel: 'linkedin', content: '' });
  const [isSaving, setIsSaving] = useState(false);
  const { templates, isLoading, error, reload, createTemplate } = useOutreachTemplates();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await createTemplate(form);
      setForm({ name: '', stage: 'follow_up', channel: 'linkedin', content: '' });
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((template) =>
      [template.name, template.stage, template.channel, template.content].join(' ').toLowerCase().includes(q)
    );
  }, [templates, query]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Founder OS - CRM Templates</h1>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates..." className="w-64" />
        </div>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Add template</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-2">
              <div className="grid gap-2 md:grid-cols-3">
                <Input placeholder="Template name" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                <Input placeholder="Stage (e.g. follow_up)" required value={form.stage} onChange={(e) => setForm((p) => ({ ...p, stage: e.target.value }))} />
                <Input placeholder="Channel (linkedin/internal_ai)" required value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))} />
              </div>
              <Textarea placeholder="Template content..." required value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} />
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Adding...' : 'Add template'}</Button>
            </form>
          </CardContent>
        </Card>
        {isLoading ? (
          <AsyncState mode="loading" title="Loading templates..." />
        ) : error ? (
          <AsyncState mode="error" title="Failed to load templates" description={error} onRetry={reload} />
        ) : filtered.length === 0 ? (
          <AsyncState mode="empty" title="No templates found" description="Adjust your filter or seed template data." />
        ) : (
          filtered.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{template.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{template.stage}</Badge>
                    <Badge variant="outline">{template.channel}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{template.content}</p>
                <Button size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(template.content); }}>
                  Copy
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
