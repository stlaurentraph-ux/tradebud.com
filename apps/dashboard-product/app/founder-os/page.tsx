'use client';

import Link from 'next/link';
import { useContext, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AsyncState } from '@/components/common/async-state';
import { emitAuditEvent } from '@/lib/audit-events';
import { useDailyActionHistory, useDailyActions, useOutreachActivity } from '@/lib/use-crm';
import { useContentCalendar } from '@/lib/use-content';
import { LocaleContext } from '@/lib/locale-context';
import { getFounderOsCopy } from '@/lib/founder-os-copy';

export default function FounderOsHomePage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
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
      if (!action.completed || !action.action_date) continue;
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
    if (!activity.created_at) return false;
    const date = new Date(activity.created_at);
    return date >= weekStart && date < weekEnd;
  }).length;

  const nextActions = actions
    .filter((item) => !item.completed)
    .slice(0, 3)
    .map(
      (item) =>
        `${item.action_type} - ${item.prospects?.name ?? getFounderOsCopy('unknown_prospect', t)}`,
    );

  const loading = loadingActions || loadingHistory || loadingCalendar || loadingActivity;
  const error = actionsError ?? historyError ?? calendarError ?? activityError;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{getFounderOsCopy('page_title', t)}</h1>
          <p className="text-sm text-muted-foreground">{getFounderOsCopy('page_subtitle', t)}</p>
        </div>

        {loading ? (
          <AsyncState mode="loading" title={getFounderOsCopy('loading_title', t)} />
        ) : error ? (
          <AsyncState mode="error" title={getFounderOsCopy('error_title', t)} description={error} />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{getFounderOsCopy('stat_outreach_today', t)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{outreachDone} / 3</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{getFounderOsCopy('stat_posts_week', t)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{postsThisWeek} / 2</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{getFounderOsCopy('stat_exchanges_week', t)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{exchangesThisWeek}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{getFounderOsCopy('stat_open_actions', t)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{actions.filter((item) => !item.completed).length}</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>{getFounderOsCopy('auto_plan_title', t)}</CardTitle>
                <CardDescription>{getFounderOsCopy('auto_plan_description', t)}</CardDescription>
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
                        setActionMessage(
                          added > 0
                            ? getFounderOsCopy('outreach_added', t, { count: added })
                            : getFounderOsCopy('outreach_not_needed', t),
                        );
                      })
                      .catch((err) =>
                        setActionMessage(
                          err instanceof Error ? err.message : getFounderOsCopy('outreach_plan_failed', t),
                        ),
                      )
                      .finally(() => setIsPlanningDaily(false));
                  }}
                >
                  {isPlanningDaily
                    ? getFounderOsCopy('plan_outreach_loading', t)
                    : getFounderOsCopy('plan_outreach', t)}
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
                        setActionMessage(
                          added > 0
                            ? getFounderOsCopy('posts_added', t, { count: added })
                            : getFounderOsCopy('posts_not_needed', t),
                        );
                      })
                      .catch((err) =>
                        setActionMessage(
                          err instanceof Error ? err.message : getFounderOsCopy('posts_plan_failed', t),
                        ),
                      )
                      .finally(() => setIsPlanningWeekly(false));
                  }}
                >
                  {isPlanningWeekly
                    ? getFounderOsCopy('plan_posts_loading', t)
                    : getFounderOsCopy('plan_posts', t)}
                </Button>
                <div className="w-full pt-2 text-sm text-muted-foreground">
                  <span className="mr-4">
                    {getFounderOsCopy('outreach_streak', t, { count: outreachStreak })}
                  </span>
                  <span>{getFounderOsCopy('publishing_streak', t, { count: postStreak })}</span>
                </div>
                <Button asChild>
                  <Link href="/founder-os/crm/daily-actions">{getFounderOsCopy('open_outreach_queue', t)}</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/founder-os/content/calendar">{getFounderOsCopy('open_content_board', t)}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/founder-os/strategy/intelligence">GTM Intelligence</Link>
                </Button>
                {actionMessage ? <p className="w-full text-sm text-muted-foreground">{actionMessage}</p> : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{getFounderOsCopy('next_actions_title', t)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {nextActions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{getFounderOsCopy('next_actions_empty', t)}</p>
                ) : (
                  nextActions.map((item) => (
                    <p key={item} className="text-sm">
                      {item}
                    </p>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
