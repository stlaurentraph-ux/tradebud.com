'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import type { ShipmentStatus } from '@/types';
import { getShipmentStatusLabel } from '@/lib/status-labels';
import { getExporterShipmentOverviewCopy } from '@/lib/terminology-labels';
import { cn } from '@/lib/utils';

const PRIMARY_STAGES: ShipmentStatus[] = ['DRAFT', 'READY', 'SEALED', 'SUBMITTED', 'ON_HOLD'];
const SECONDARY_STAGES: ShipmentStatus[] = ['ACCEPTED', 'REJECTED'];

interface ExporterShipmentOverviewProps {
  packagesByStatus: Partial<Record<ShipmentStatus, number>>;
  t?: (key: string) => string;
}

export function ExporterShipmentOverview({ packagesByStatus, t }: ExporterShipmentOverviewProps) {
  const secondaryVisible = SECONDARY_STAGES.some((status) => (packagesByStatus[status] ?? 0) > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>{getExporterShipmentOverviewCopy('title', t)}</CardTitle>
          <CardDescription>{getExporterShipmentOverviewCopy('description', t)}</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/packages">
            {getExporterShipmentOverviewCopy('manage_cta', t)}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PRIMARY_STAGES.map((status) => {
            const count = packagesByStatus[status] ?? 0;
            return (
              <Link
                key={status}
                href="/packages"
                className={cn(
                  'rounded-lg border border-border p-3 transition-colors hover:bg-muted/50',
                  status === 'READY' && count > 0 && 'border-blue-200 bg-blue-50/40',
                  status === 'ON_HOLD' && count > 0 && 'border-amber-200 bg-amber-50/40',
                )}
              >
                <p className="text-2xl font-bold tabular-nums">{count}</p>
                <div className="mt-2">
                  <StatusChip status={status} role="exporter" size="sm" showIcon={false} />
                </div>
                <p className="sr-only">{getShipmentStatusLabel(status, 'exporter', t)}</p>
              </Link>
            );
          })}
        </div>
        {secondaryVisible ? (
          <div className="flex flex-wrap gap-3 border-t border-border pt-4 text-sm">
            {SECONDARY_STAGES.map((status) => {
              const count = packagesByStatus[status] ?? 0;
              if (count === 0) return null;
              return (
                <Link
                  key={status}
                  href="/packages"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 hover:bg-muted/50"
                >
                  <StatusChip status={status} role="exporter" size="sm" showIcon={false} />
                  <span className="font-semibold tabular-nums">{count}</span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
