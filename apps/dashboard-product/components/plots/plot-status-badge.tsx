'use client';

import React from 'react';
import { Badge } from '../ui/badge';

interface PlotStatusBadgeProps {
  status: 'compliant' | 'non_compliant' | 'under_review' | 'pending_verification';
  size?: 'sm' | 'md';
}

const statusConfig = {
  compliant: {
    label: 'Compliant',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  non_compliant: {
    label: 'Non-Compliant',
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
  },
  under_review: {
    label: 'Under Review',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
  pending_verification: {
    label: 'Pending Verification',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  },
};

export function PlotStatusBadge({ status, size = 'md' }: PlotStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={`${config.className} ${size === 'sm' ? 'text-xs' : ''}`}>
      {config.label}
    </Badge>
  );
}
