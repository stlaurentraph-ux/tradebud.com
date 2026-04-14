'use client';

import { useMemo, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { AsyncState } from '@/components/common/async-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOutreachTemplates } from '@/lib/use-crm';

export default function CrmTemplatesPage() {
  const [query, setQuery] = useState('');
  const { templates, isLoading, error, reload } = useOutreachTemplates();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((template) =>
      [template.name, template.stage, template.channel, template.content].join(' ').toLowerCase().includes(q)
    );
  }, [templates, query]);

  return (
    <div className="flex flex-col">
      <AppHeader
        title="CRM Templates"
        subtitle="Reusable outreach and internal prompt templates."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'CRM Templates' }]}
        actions={<Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search templates..." className="w-64" />}
      />
      <div className="flex-1 p-6">
        {isLoading ? (
          <AsyncState mode="loading" title="Loading templates..." />
        ) : error ? (
          <AsyncState mode="error" title="Failed to load templates" description={error} onRetry={reload} />
        ) : filtered.length === 0 ? (
          <AsyncState mode="empty" title="No templates found" description="Adjust your filter or seed template data." />
        ) : (
          <div className="grid gap-4">
            {filtered.map((template) => (
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard.writeText(template.content);
                    }}
                  >
                    Copy
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
