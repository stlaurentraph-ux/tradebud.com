'use client';

import { AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AsyncStateProps {
  mode: 'loading' | 'error' | 'empty';
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function AsyncState({ mode, title, description, onRetry }: AsyncStateProps) {
  if (mode === 'loading') {
    return (
      <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{title ?? 'Loading...'}</span>
        </div>
        {description ? <p className="mt-1 text-xs">{description}</p> : null}
      </div>
    );
  }

  if (mode === 'error') {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <div>
              <p className="font-medium">{title ?? 'Something went wrong'}</p>
              {description ? <p className="text-xs text-destructive/80">{description}</p> : null}
            </div>
          </div>
          {onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{title ?? 'No data yet'}</p>
      {description ? <p className="mt-1 text-xs">{description}</p> : null}
    </div>
  );
}

