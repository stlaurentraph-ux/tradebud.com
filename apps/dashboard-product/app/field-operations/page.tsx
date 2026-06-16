'use client';

import { useEffect, useContext, useMemo, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MapPin, Smartphone, Users, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { useTenureReviewQueue } from '@/lib/use-tenure-review-queue';
import { useAuth } from '@/lib/auth-context';
import { GeometryRemediationPanel } from '@/components/field-operations/geometry-remediation-panel';
import { LocaleContext } from '@/lib/locale-context';
import { buildAppBreadcrumbs } from '@/lib/nav-labels';
import {
  getComplianceReviewHubTenureAwaitingBadge,
  getComplianceReviewHubTenureCta,
  getFieldOpsCreateCampaignCta,
  getFieldOpsPageSubtitle,
  getFieldOpsPageTitle,
  getFieldOpsQueueItemLabel,
  getFieldOpsRemediationQueuesTitle,
  getFieldOpsStatLabel,
  getFieldOpsTenureDescription,
  getTenureReviewPageTitle,
} from '@/lib/workflow-terminology-labels';

type QueueItemKey =
  | 'missing_member_profile'
  | 'missing_consent_grant'
  | 'missing_geometry_upgrade'
  | 'duplicate_reviews'
  | 'overdue_request_followup';

const STATIC_QUEUE_ITEMS: Array<{ key: QueueItemKey; count: number; severity: 'high' | 'medium' }> = [
  { key: 'missing_member_profile', count: 12, severity: 'high' },
  { key: 'missing_consent_grant', count: 9, severity: 'high' },
  { key: 'missing_geometry_upgrade', count: 15, severity: 'medium' },
  { key: 'duplicate_reviews', count: 6, severity: 'medium' },
];

export default function FieldOperationsPage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { user } = useAuth();
  const { items: tenureReviewItems } = useTenureReviewQueue();
  const tenureManualCount = tenureReviewItems.filter((item) => item.parse_status === 'MANUAL_REQUIRED').length;
  const [insights, setInsights] = useState<{
    total_farmers: number;
    total_plots: number;
    compliant_plots: number;
    members_missing_consent: number;
    requests_overdue: number;
  }>({
    total_farmers: 0,
    total_plots: 0,
    compliant_plots: 0,
    members_missing_consent: 0,
    requests_overdue: 0,
  });

  useEffect(() => {
    const token = window.sessionStorage.getItem('tracebud_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    void fetch('/api/cooperative/insights', { headers, cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: { metrics?: Partial<typeof insights> }) => {
        if (!payload.metrics) return;
        setInsights((previous) => ({ ...previous, ...payload.metrics }));
      })
      .catch(() => undefined);
  }, []);

  const coverage = insights.total_plots > 0 ? Math.round((insights.compliant_plots / insights.total_plots) * 100) : 0;
  const queueSummaries = useMemo(
    () => [
      {
        key: 'missing_member_profile' as const,
        count: Math.max(0, insights.total_farmers - insights.compliant_plots),
        severity: 'high' as const,
      },
      {
        key: 'missing_consent_grant' as const,
        count: insights.members_missing_consent,
        severity: 'high' as const,
      },
      {
        key: 'overdue_request_followup' as const,
        count: insights.requests_overdue,
        severity: 'medium' as const,
      },
    ],
    [insights],
  );

  const queueItems = user?.active_role === 'cooperative' ? queueSummaries : STATIC_QUEUE_ITEMS;

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getFieldOpsPageTitle(t)}
        subtitle={getFieldOpsPageSubtitle(t)}
        breadcrumbs={buildAppBreadcrumbs(t, { name: 'Field Operations' })}
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{insights.total_farmers}</p>
                  <p className="text-xs text-muted-foreground">{getFieldOpsStatLabel('active_agents', t)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{coverage}%</p>
                  <p className="text-xs text-muted-foreground">{getFieldOpsStatLabel('coverage', t)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{Math.max(0, insights.total_plots - insights.compliant_plots)}</p>
                  <p className="text-xs text-muted-foreground">{getFieldOpsStatLabel('sync_conflicts', t)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{insights.requests_overdue}</p>
                  <p className="text-xs text-muted-foreground">{getFieldOpsStatLabel('revoked_devices', t)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <GeometryRemediationPanel />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {getTenureReviewPageTitle(t)}
            </CardTitle>
            {tenureManualCount > 0 ? (
              <Badge variant="destructive">
                {getComplianceReviewHubTenureAwaitingBadge(tenureManualCount, t)}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>{getFieldOpsTenureDescription(t)}</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/compliance/tenure-review">{getComplianceReviewHubTenureCta(t)}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{getFieldOpsRemediationQueuesTitle(t)}</CardTitle>
            <Button size="sm">{getFieldOpsCreateCampaignCta(t)}</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {queueItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  {item.severity === 'high' ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm">{getFieldOpsQueueItemLabel(item.key, t)}</span>
                </div>
                <Badge variant="outline">{item.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
