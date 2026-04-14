'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AsyncState } from '@/components/common/async-state';
import { emitAuditEvent } from '@/lib/audit-events';
import { useDailyActionHistory, useDailyActions, useOutreachActivity } from '@/lib/use-crm';
import { useContentCalendar } from '@/lib/use-content';

export default function FounderOsHomePage() {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isPlanningDaily, setIsPlanningDaily] = useState(false);
  const [isPlanningWeekly, setIsPlanningWeekly] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const { actions, isLoading: loadingActions, error: actionsError, ensureDailyTarget } = useDailyActions(today);
  const { actions: actionHistory, isLoading: loadingHistory, error: historyError } = useDailyActionHistory(30);
  const { items, isLoading: loadingCalendar, error: calendarError, ensureWeeklyTarget } = useContentCalendar();
  const { activities, isLoading: loadingActivity, error: activityError } = useOutreachActivity();
  const weekStart = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, []);
  const weekEnd = useMemo(() => {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + 7);
    return next;
  }, [weekStart]);

  const outreachStreak = useMemo(() => {
    const completedByDate = new Map<string, number>();
    for (const action of actionHistory) {
      if (!action.completed) continue;
      completedByDate.set(action.action_date, (completedByDate.get(action.action_date) ?? 0) + 1);
    }
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (let i = 0; i < 45; i += 1) {
      const day = cursor.getDay();
      if (day !== 0 && day !== 6) {
        const key = cursor.toISOString().slice(0, 10);
        if ((completedByDate.get(key) ?? 0) >= 3) streak += 1;
        else break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [actionHistory]);

  const postStreak = useMemo(() => {
    const countsByWeek = new Map<string, number>();
    for (const item of items) {
      if (item.channel !== 'linkedin_post' || !item.scheduled_at) continue;
      const d = new Date(item.scheduled_at);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      const key = monday.toISOString().slice(0, 10);
      countsByWeek.set(key, (countsByWeek.get(key) ?? 0) + 1);
    }
    let streak = 0;
    const cursor = new Date(weekStart);
    cursor.setHours(0, 0, 0, 0);
    for (let i = 0; i < 12; i += 1) {
      const key = cursor.toISOString().slice(0, 10);
      if ((countsByWeek.get(key) ?? 0) >= 2) streak += 1;
      else break;
      cursor.setDate(cursor.getDate() - 7);
    }
    return streak;
  }, [items, weekStart]);

  const outreachDone = actions.filter((item) => item.completed).length;
  const postsThisWeek = items.filter((item) => {
    if (!item.scheduled_at) return false;
    const date = new Date(item.scheduled_at);
    return item.channel === 'linkedin_post' && date >= weekStart && date < weekEnd;
  }).length;
  const exchangesThisWeek = activities.filter((activity) => {
    const date = new Date(activity.created_at);
    return date >= weekStart && date < weekEnd;
  }).length;

  const nextActions = actions
    .filter((item) => !item.completed)
    .slice(0, 3)
    .map((item) => `${item.action_type} - ${item.prospects?.name ?? 'Unknown prospect'}`);

  const loading = loadingActions || loadingHistory || loadingCalendar || loadingActivity;
  const error = actionsError ?? historyError ?? calendarError ?? activityError;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Today</h1>
          <p className="text-sm text-muted-foreground">Operate on two hard targets: 3 outreaches per weekday and 2 posts per week.</p>
        </div>

        {loading ? (
          <AsyncState mode="loading" title="Loading daily operating context..." />
        ) : error ? (
          <AsyncState mode="error" title="Failed to load operating context" description={error} />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Outreach today</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{outreachDone} / 3</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Posts this week</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{postsThisWeek} / 2</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Exchanges this week</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{exchangesThisWeek}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Open outreach actions</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{actions.filter((item) => !item.completed).length}</p></CardContent></Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Auto-plan</CardTitle>
                <CardDescription>Fill your weekly operating targets automatically.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={isPlanningDaily}
                  onClick={() => {
                    setIsPlanningDaily(true);
                    setActionMessage(null);
                    void ensureDailyTarget(today, 3)
                      .then((added) => {
                        void emitAuditEvent({
                          event_type: 'REQUEST_CAMPAIGN_STARTED',
                          entity_type: 'founder_os_daily_plan',
                          entity_id: today,
                          payload: { date: today, target: 3, actions_added: added },
                        });
                        setActionMessage(added > 0 ? `Added ${added} outreach action(s).` : 'No new outreach actions needed.');
                      })
                      .catch((err) => setActionMessage(err instanceof Error ? err.message : 'Failed to plan outreach actions.'))
                      .finally(() => setIsPlanningDaily(false));
                  }}
                >
                  {isPlanningDaily ? 'Planning...' : 'Plan 3 outreach today'}
                </Button>
                <Button
                  variant="outline"
                  disabled={isPlanningWeekly}
                  onClick={() => {
                    setIsPlanningWeekly(true);
                    setActionMessage(null);
                    void ensureWeeklyTarget(today, 2)
                      .then((added) => {
                        void emitAuditEvent({
                          event_type: 'REQUEST_CAMPAIGN_STARTED',
                          entity_type: 'founder_os_weekly_plan',
                          entity_id: weekStart.toISOString().slice(0, 10),
                          payload: { week_start: weekStart.toISOString().slice(0, 10), target: 2, slots_added: added },
                        });
                        setActionMessage(added > 0 ? `Added ${added} post slot(s) this week.` : 'No new post slots needed this week.');
                      })
                      .catch((err) => setActionMessage(err instanceof Error ? err.message : 'Failed to plan weekly posts.'))
                      .finally(() => setIsPlanningWeekly(false));
                  }}
                >
                  {isPlanningWeekly ? 'Planning...' : 'Plan 2 posts this week'}
                </Button>
                <div className="w-full pt-2 text-sm text-muted-foreground">
                  <span className="mr-4">Outreach streak: {outreachStreak} weekday(s)</span>
                  <span>Publishing streak: {postStreak} week(s)</span>
                </div>
                <Button asChild><Link href="/founder-os/crm/daily-actions">Open outreach queue</Link></Button>
                <Button asChild variant="secondary"><Link href="/founder-os/content/calendar">Open content board</Link></Button>
                {actionMessage ? <p className="w-full text-sm text-muted-foreground">{actionMessage}</p> : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Next best outreach actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {nextActions.length === 0 ? <p className="text-sm text-muted-foreground">No pending outreach. You are clear.</p> : nextActions.map((item) => <p key={item} className="text-sm">{item}</p>)}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
