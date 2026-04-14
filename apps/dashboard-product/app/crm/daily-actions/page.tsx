'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { AsyncState } from '@/components/common/async-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDailyActions } from '@/lib/use-crm';

export default function CrmDailyActionsPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const { actions, isLoading, error, reload, markComplete } = useDailyActions(date);

  return (
    <div className="flex flex-col">
      <AppHeader
        title="CRM Daily Actions"
        subtitle="Prioritized outreach actions for today."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'CRM Daily Actions' }]}
        actions={
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-44"
          />
        }
      />
      <div className="flex-1 p-6">
        {isLoading ? (
          <AsyncState mode="loading" title="Loading daily actions..." />
        ) : error ? (
          <AsyncState mode="error" title="Failed to load daily actions" description={error} onRetry={reload} />
        ) : actions.length === 0 ? (
          <AsyncState mode="empty" title="No actions for this day" description="Try another date or generate actions in Supabase." />
        ) : (
          <div className="grid gap-4">
            {actions.map((action) => (
              <Card key={action.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{action.prospects?.name ?? 'Unknown prospect'} - {action.action_type}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{action.priority}</Badge>
                      {action.completed ? <Badge>done</Badge> : null}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{action.reason ?? 'No reason provided.'}</p>
                  <p className="text-xs text-muted-foreground">{action.prospects?.company ?? 'Unknown company'}</p>
                  {!action.completed ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        void markComplete(action.id);
                      }}
                    >
                      Mark complete
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
