import { AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type HarvestBatchStatus = 'pass' | 'warning' | 'blocked';

export function calculateHarvestYieldCap(areaHa: number, expectedYieldKgPerHa: number): number {
  return areaHa * expectedYieldKgPerHa;
}

export function harvestBatchCapacityUtilizationPct(weightKg: number, capacityKg: number): number | null {
  if (capacityKg <= 0) return null;
  return Math.round((weightKg / capacityKg) * 100);
}

export function HarvestBatchStatusBadge({ status }: { status: HarvestBatchStatus }) {
  const config = {
    pass: {
      icon: CheckCircle,
      color: 'bg-emerald-500/20 text-emerald-600',
      label: 'Pass',
    },
    warning: {
      icon: AlertCircle,
      color: 'bg-amber-500/20 text-amber-600',
      label: 'Warning: above capacity',
    },
    blocked: {
      icon: AlertCircle,
      color: 'bg-destructive/20 text-destructive',
      label: 'Blocked: excess weight',
    },
  } as const;
  const { icon: Icon, color, label } = config[status];
  return (
    <Badge className={cn('gap-1', color)}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}
