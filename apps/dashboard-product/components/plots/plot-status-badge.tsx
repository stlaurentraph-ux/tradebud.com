'use client';

import React from 'react';
import { Badge } from '../ui/badge';
import {
  deforestationScreeningStatusDetail,
  formatDeforestationScreeningStatusShort,
} from '@/lib/plot-deforestation-screening-status';
import { normalizeComplianceStatus } from '@/lib/plot-inventory';

interface PlotStatusBadgeProps {
  status: 'compliant' | 'non_compliant' | 'under_review' | 'pending_verification';
  size?: 'sm' | 'md';
}

const legacyStatusToScreening: Record<
  PlotStatusBadgeProps['status'],
  'deforestation_clear' | 'under_review' | 'pending_check' | 'deforestation_detected'
> = {
  compliant: 'deforestation_clear',
  non_compliant: 'deforestation_detected',
  under_review: 'under_review',
  pending_verification: 'pending_check',
};

export function PlotStatusBadge({ status, size = 'md' }: PlotStatusBadgeProps) {
  const screeningStatus = legacyStatusToScreening[status];
  const label = formatDeforestationScreeningStatusShort(screeningStatus);
  const title = deforestationScreeningStatusDetail(screeningStatus);

  const className =
    normalizeComplianceStatus(screeningStatus) === 'deforestation_clear'
      ? 'bg-green-100 text-green-800 hover:bg-green-100'
      : normalizeComplianceStatus(screeningStatus) === 'deforestation_detected'
        ? 'bg-red-100 text-red-800 hover:bg-red-100'
        : normalizeComplianceStatus(screeningStatus) === 'under_review'
          ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';

  return (
    <Badge
      variant="outline"
      title={title}
      className={`${className} ${size === 'sm' ? 'text-xs' : ''}`}
    >
      {label}
    </Badge>
  );
}
