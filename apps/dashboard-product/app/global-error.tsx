'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

import { DASHBOARD_EVENTS, trackDashboardEvent } from '@/lib/observability/analytics';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    trackDashboardEvent(DASHBOARD_EVENTS.REACT_RENDER_ERROR, {
      message: error.message,
      digest: error.digest ?? 'unknown',
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 font-sans">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            The dashboard encountered an unexpected error. You can try again or refresh the page.
          </p>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => reset()}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
