'use client';

import React from 'react';
import {
  RefreshCw,
  Send,
  MessageSquare,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

/**
 * TimelineRow - Audit trail event display
 * 
 * Displays timeline events with icons, timestamps, user info, and metadata
 * per UX_POLISH_SPECIFICATION Section B.4
 */

export type TimelineEventType =
  | 'status_change'
  | 'submission'
  | 'response_received'
  | 'owner_assigned'
  | 'comment_added'
  | 'alert'
  | 'approval'
  | 'rejection'
  | 'escalation'
  | 'document_uploaded'
  | 'system_event';

const EVENT_ICONS: Record<TimelineEventType, LucideIcon> = {
  status_change: RefreshCw,
  submission: Send,
  response_received: MessageSquare,
  owner_assigned: User,
  comment_added: MessageSquare,
  alert: AlertTriangle,
  approval: CheckCircle,
  rejection: XCircle,
  escalation: AlertTriangle,
  document_uploaded: FileText,
  system_event: Clock,
};

const EVENT_COLORS: Record<TimelineEventType, string> = {
  status_change: 'bg-blue-500',
  submission: 'bg-blue-600',
  response_received: 'bg-emerald-500',
  owner_assigned: 'bg-purple-500',
  comment_added: 'bg-gray-500',
  alert: 'bg-amber-500',
  approval: 'bg-emerald-600',
  rejection: 'bg-red-500',
  escalation: 'bg-amber-500',
  document_uploaded: 'bg-blue-400',
  system_event: 'bg-gray-400',
};

export interface TimelineEvent {
  id: string;
  eventType: TimelineEventType;
  timestamp: string; // ISO8601
  userName?: string;
  description: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface TimelineRowProps extends React.HTMLAttributes<HTMLDivElement> {
  event: TimelineEvent;
  isLast?: boolean;
  showRelativeTime?: boolean;
  compact?: boolean;
}

export function TimelineRow({
  event,
  isLast = false,
  showRelativeTime = true,
  compact = false,
  className,
  ...props
}: TimelineRowProps) {
  const Icon = EVENT_ICONS[event.eventType];
  const dotColor = EVENT_COLORS[event.eventType];
  const date = new Date(event.timestamp);
  const formattedDate = format(date, 'MMM d, h:mm a');
  const relativeTime = formatDistanceToNow(date, { addSuffix: true });

  const metadataEntries = event.metadata ? Object.entries(event.metadata) : [];

  return (
    <div className={cn('relative flex gap-3', className)} {...props}>
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex items-center justify-center rounded-full',
            dotColor,
            compact ? 'h-5 w-5' : 'h-6 w-6'
          )}
        >
          <Icon className={cn('text-white', compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-border min-h-[16px]" />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 pb-4', isLast && 'pb-0')}>
        {/* Primary line: description */}
        <p className={cn('font-medium text-foreground', compact ? 'text-xs' : 'text-sm')}>
          {event.description}
        </p>

        {/* Secondary line: user + timestamp */}
        <p className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>
          {event.userName ? (
            <>
              by <span className="font-medium">{event.userName}</span>
              {' '}
            </>
          ) : (
            <>System-generated </>
          )}
          {showRelativeTime ? (
            <span title={formattedDate}>{relativeTime}</span>
          ) : (
            <span>on {formattedDate}</span>
          )}
        </p>

        {/* Metadata */}
        {metadataEntries.length > 0 && (
          <div className={cn('mt-1 space-y-0.5', compact ? 'text-[10px]' : 'text-xs')}>
            {metadataEntries.map(([key, value]) => (
              <p key={key} className="text-muted-foreground">
                <span className="capitalize">{key.replace(/_/g, ' ')}</span>:{' '}
                <span className="font-mono">{String(value)}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  events: TimelineEvent[];
  maxHeight?: number;
  showRelativeTime?: boolean;
  compact?: boolean;
  emptyMessage?: string;
}

export function Timeline({
  events,
  maxHeight = 300,
  showRelativeTime = true,
  compact = false,
  emptyMessage = 'No events to display',
  className,
  ...props
}: TimelineProps) {
  if (events.length === 0) {
    return (
      <div
        className={cn('text-sm text-muted-foreground py-4 text-center', className)}
        {...props}
      >
        {emptyMessage}
      </div>
    );
  }

  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div
      className={cn('overflow-y-auto', className)}
      style={{ maxHeight }}
      {...props}
    >
      {sortedEvents.map((event, index) => (
        <TimelineRow
          key={event.id}
          event={event}
          isLast={index === sortedEvents.length - 1}
          showRelativeTime={showRelativeTime}
          compact={compact}
        />
      ))}
    </div>
  );
}
