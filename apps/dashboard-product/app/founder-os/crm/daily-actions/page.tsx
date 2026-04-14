'use client';

import { useState } from 'react';
import { AsyncState } from '@/components/common/async-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { emitAuditEvent } from '@/lib/audit-events';
import { useDailyActions } from '@/lib/use-crm';

export default function FounderOsCrmDailyActionsPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const { actions, isLoading, error, reload, markComplete, ensureDailyTarget } = useDailyActions(date);
  const completedCount = actions.filter((item) => item.completed).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Founder OS - CRM Daily Actions</h1>
          <div className="flex items-center gap-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
            <Button
              variant="outline"
              disabled={isPlanning}
              onClick={() => {
                setIsPlanning(true);
                setMessage(null);
                void ensureDailyTarget(date, 3)
                  .then((added) => {
                    void emitAuditEvent({
                      event_type: 'REQUEST_CAMPAIGN_STARTED',
                      entity_type: 'founder_os_daily_plan',
                      entity_id: date,
                      payload: { date, target: 3, actions_added: added, source: 'daily_actions_page' },
                    });
                    setMessage(added > 0 ? `Added ${added} action(s).` : 'No new actions needed for this date.');
                  })
                  .catch((err) => setMessage(err instanceof Error ? err.message : 'Failed to plan actions.'))
                  .finally(() => setIsPlanning(false));
              }}
            >
              {isPlanning ? 'Planning...' : 'Plan 3 actions'}
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Weekday outreach target</p>
            <p className="text-3xl font-semibold">{completedCount} / 3</p>
            {message ? <p className="mt-2 text-sm text-muted-foreground">{message}</p> : null}
          </CardContent>
        </Card>
        {isLoading ? (
          <AsyncState mode="loading" title="Loading daily actions..." />
        ) : error ? (
          <AsyncState mode="error" title="Failed to load daily actions" description={error} onRetry={reload} />
        ) : actions.length === 0 ? (
          <AsyncState mode="empty" title="No actions for this day" description="Try another date or generate actions in Supabase." />
        ) : (
          actions.map((action) => (
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
                {!action.completed ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      void markComplete(action.id)
                        .then(() =>
                          emitAuditEvent({
                            event_type: 'REQUEST_CAMPAIGN_RESPONSE_RECEIVED',
                            entity_type: 'founder_os_daily_action',
                            entity_id: action.id,
                            payload: { date, action_type: action.action_type, completed_at: new Date().toISOString() },
                          })
                        )
                        .catch((err) =>
                          setMessage(err instanceof Error ? err.message : 'Failed to mark action complete.')
                        );
                    }}
                  >
                    Mark complete
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
