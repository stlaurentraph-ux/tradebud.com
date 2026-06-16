'use client';

import { use, useContext } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/common/permission-gate';
import { ShipmentStateTimeline } from '@/components/packages/shipment-state-timeline';
import { Timeline } from '@/components/ui/timeline-row';
import { usePackageDetail } from '@/lib/use-package-detail';
import { usePackageReadiness } from '@/lib/use-package-readiness';
import { packageToTimelineEvents } from '@/lib/package-timeline';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import { ArrowLeft } from 'lucide-react';
import {
  buildPackageBreadcrumbs,
  getPackageLoadErrorPrefix,
  getPackageLoadingMessage,
  getPackageNotFoundMessage,
  getPackageTimelineAuditDescription,
  getPackageTimelineAuditTitle,
  getPackageTimelineBackLabel,
  getPackageTimelineBreadcrumbLabel,
  getPackageTimelinePageSubtitle,
  getPackageTimelinePageTitle,
} from '@/lib/workflow-terminology-labels';

interface TimelinePageProps {
  params: Promise<{ id: string }>;
}

export default function ShipmentTimelinePage({ params }: TimelinePageProps) {
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const role = user?.active_role;
  const { id } = use(params);
  const { pkg, isLoading, error } = usePackageDetail(id, user?.tenant_id ?? null);
  const { data: readiness } = usePackageReadiness(id);

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">{getPackageLoadingMessage(role, t)}</div>;
  }
  if (!pkg) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {error ? `${getPackageLoadErrorPrefix(role, t)}: ${error}` : getPackageNotFoundMessage(role, t)}
      </div>
    );
  }

  const timelineEvents = packageToTimelineEvents(pkg);
  const blockingCount = readiness?.blockers.length ?? 0;

  return (
    <PermissionGate permission="packages:view">
      <div className="flex flex-col">
        <AppHeader
          title={getPackageTimelinePageTitle(pkg.code, t)}
          subtitle={getPackageTimelinePageSubtitle(role, t)}
          breadcrumbs={buildPackageBreadcrumbs(role, pkg.code, id, { label: getPackageTimelineBreadcrumbLabel(t) }, t)}
          actions={
            <Button variant="outline" asChild>
              <Link href={`/packages/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {getPackageTimelineBackLabel(role, t)}
              </Link>
            </Button>
          }
        />

        <div className="flex-1 space-y-6 p-6">
          <ShipmentStateTimeline
            status={pkg.status}
            packageId={pkg.id}
            blockingCount={blockingCount}
            showTimelineLink={false}
          />

          <Card>
            <CardHeader>
              <CardTitle>{getPackageTimelineAuditTitle(role, t)}</CardTitle>
              <CardDescription>{getPackageTimelineAuditDescription(role, t)}</CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline events={timelineEvents} maxHeight={480} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGate>
  );
}
