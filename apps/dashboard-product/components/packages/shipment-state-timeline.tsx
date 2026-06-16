'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formatShipmentLifecycleBlockers,
  getShipmentLifecycleCurrentPrefix,
  getShipmentLifecycleFullTimelineLabel,
  getShipmentLifecycleStepCurrentLabel,
  getShipmentLifecycleTitle,
  getShipmentOnHoldMessage,
  getShipmentRejectedMessage,
  getShipmentStatusLabel,
} from '@/lib/status-labels';
import {
  getShipmentFlowIndex,
  getShipmentStateFlowSteps,
  isTerminalShipmentStatus,
} from '@/lib/shipment-state-machine';
import type { ShipmentStatus } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowRight, AlertTriangle, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';

interface ShipmentStateTimelineProps {
  status: ShipmentStatus;
  packageId?: string;
  blockingCount?: number;
  compact?: boolean;
  showTimelineLink?: boolean;
}

export function ShipmentStateTimeline({
  status,
  packageId,
  blockingCount = 0,
  compact = false,
  showTimelineLink = true,
}: ShipmentStateTimelineProps) {
  const { user } = useAuth();
  const { t } = useLocale();
  const role = user?.active_role;
  const currentIndex = getShipmentFlowIndex(status);
  const isTerminal = isTerminalShipmentStatus(status);
  const flowSteps = getShipmentStateFlowSteps(role).map((step) => ({
    ...step,
    label: getShipmentStatusLabel(step.status, role, t),
  }));

  return (
    <Card className="border-border bg-card">
      <CardHeader className={cn('pb-3', compact && 'pb-2')}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>
              {getShipmentLifecycleTitle(role, t)}
            </CardTitle>
            <CardDescription className="mt-1">
              {getShipmentLifecycleCurrentPrefix(t)}{' '}
              <span className="font-medium text-foreground">{getShipmentStatusLabel(status, role, t)}</span>
              {blockingCount > 0 ? formatShipmentLifecycleBlockers(blockingCount, t) : ''}
            </CardDescription>
          </div>
          {showTimelineLink && packageId ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/packages/${packageId}/timeline`}>
                {getShipmentLifecycleFullTimelineLabel(t)}
                <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between overflow-x-auto pb-1">
          {flowSteps.map((step, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex && !isTerminal;
            const isActive = isComplete || isCurrent;
            return (
              <div key={step.status} className="flex min-w-[4.5rem] flex-1 items-center">
                <div className="flex flex-1 flex-col items-center">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white',
                      isActive ? step.color : 'bg-gray-200 text-gray-500',
                      isCurrent && 'ring-4 ring-primary/20 ring-offset-2',
                    )}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {index + 1}
                  </div>
                  <p
                    className={cn(
                      'mt-2 text-center text-xs font-medium',
                      isActive ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </p>
                  {isCurrent ? (
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {getShipmentLifecycleStepCurrentLabel(t)}
                    </Badge>
                  ) : null}
                </div>
                {index < flowSteps.length - 1 ? (
                  <div
                    className={cn('mx-1 h-1 min-w-[1rem] flex-1 rounded', isComplete ? 'bg-primary' : 'bg-gray-200')}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {status === 'ON_HOLD' ? (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {getShipmentOnHoldMessage(role, t)}
          </div>
        ) : null}
        {status === 'REJECTED' ? (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {getShipmentRejectedMessage(role, t)}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
