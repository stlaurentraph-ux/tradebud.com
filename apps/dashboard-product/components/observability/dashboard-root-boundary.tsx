'use client';

import type { ReactNode } from 'react';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { DASHBOARD_EVENTS, reportErrorToSentry, trackDashboardEvent } from '@/lib/observability/analytics';

export function DashboardRootBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      title="Dashboard unavailable"
      description="Tracebud hit an unexpected error. Try again — your session and tenant data are unchanged."
      onError={(error, errorInfo) => {
        reportErrorToSentry(error, {
          componentStack: errorInfo.componentStack,
          boundary: 'root',
        });
        trackDashboardEvent(DASHBOARD_EVENTS.REACT_RENDER_ERROR, {
          message: error.message,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
