'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { trackDashboardEvent, DASHBOARD_EVENTS } from '@/lib/observability/analytics';

interface UpstreamBlockerHomeAlertProps {
  count: number;
  role?: string;
}

export function UpstreamBlockerHomeAlert({ count, role }: UpstreamBlockerHomeAlertProps) {
  if (count <= 0) {
    return null;
  }

  const issuesHref = '/compliance/issues?ownership=upstream_blocker';
  const roleHint =
    role === 'importer'
      ? 'These block shared shipments you depend on for declaration readiness.'
      : 'These affect shared shipments in your network.';

  return (
    <Alert className="mb-4 border-violet-300 bg-violet-50">
      <AlertTriangle className="h-4 w-4 text-violet-700" aria-hidden="true" />
      <AlertDescription className="flex flex-col gap-3 text-violet-950 sm:flex-row sm:items-center sm:justify-between">
        <span>
          <strong>{count}</strong> upstream blocker{count === 1 ? '' : 's'} need remediation by an exporter or
          cooperative before your shipments can clear. {roleHint}
        </span>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="shrink-0 border-violet-300 bg-white hover:bg-violet-100"
        >
          <Link
            href={issuesHref}
            onClick={() =>
              trackDashboardEvent(DASHBOARD_EVENTS.UPSTREAM_BLOCKER_ALERT_CLICKED, {
                count,
                role,
              })
            }
          >
            View upstream blockers
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
