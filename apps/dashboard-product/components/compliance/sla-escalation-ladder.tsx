'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  ArrowUp,
  User,
  UserPlus,
  CheckCircle,
  XCircle,
  Bell,
  Calendar,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ComplianceIssue, ComplianceIssueSeverity } from '@/types';

// ============================================================
// SLA CONFIGURATION
// Based on GRADING_ANALYSIS must-fix #6: SLA Escalation Ladder
// ============================================================

export interface SLAConfig {
  severity: ComplianceIssueSeverity;
  initial_sla_hours: number;
  escalation_levels: EscalationLevel[];
}

export interface EscalationLevel {
  level: number;
  name: string;
  trigger_hours_before_breach: number;
  action: 'notify' | 'escalate' | 'auto_hold';
  target_role: string;
  notification_type: 'email' | 'in_app' | 'both';
}

// SLA configurations per severity
export const SLA_CONFIGS: Record<ComplianceIssueSeverity, SLAConfig> = {
  BLOCKING: {
    severity: 'BLOCKING',
    initial_sla_hours: 48,
    escalation_levels: [
      {
        level: 1,
        name: 'Initial Assignment',
        trigger_hours_before_breach: 48,
        action: 'notify',
        target_role: 'Assigned Owner',
        notification_type: 'both',
      },
      {
        level: 2,
        name: 'First Reminder',
        trigger_hours_before_breach: 24,
        action: 'notify',
        target_role: 'Assigned Owner',
        notification_type: 'both',
      },
      {
        level: 3,
        name: 'Manager Escalation',
        trigger_hours_before_breach: 12,
        action: 'escalate',
        target_role: 'Team Manager',
        notification_type: 'both',
      },
      {
        level: 4,
        name: 'Compliance Lead',
        trigger_hours_before_breach: 6,
        action: 'escalate',
        target_role: 'Compliance Lead',
        notification_type: 'both',
      },
      {
        level: 5,
        name: 'Auto-Hold',
        trigger_hours_before_breach: 0,
        action: 'auto_hold',
        target_role: 'System',
        notification_type: 'both',
      },
    ],
  },
  WARNING: {
    severity: 'WARNING',
    initial_sla_hours: 72,
    escalation_levels: [
      {
        level: 1,
        name: 'Initial Assignment',
        trigger_hours_before_breach: 72,
        action: 'notify',
        target_role: 'Assigned Owner',
        notification_type: 'in_app',
      },
      {
        level: 2,
        name: 'First Reminder',
        trigger_hours_before_breach: 48,
        action: 'notify',
        target_role: 'Assigned Owner',
        notification_type: 'both',
      },
      {
        level: 3,
        name: 'Manager Alert',
        trigger_hours_before_breach: 24,
        action: 'escalate',
        target_role: 'Team Manager',
        notification_type: 'both',
      },
      {
        level: 4,
        name: 'SLA Breach',
        trigger_hours_before_breach: 0,
        action: 'notify',
        target_role: 'Compliance Lead',
        notification_type: 'both',
      },
    ],
  },
  INFO: {
    severity: 'INFO',
    initial_sla_hours: 168, // 7 days
    escalation_levels: [
      {
        level: 1,
        name: 'Initial Assignment',
        trigger_hours_before_breach: 168,
        action: 'notify',
        target_role: 'Assigned Owner',
        notification_type: 'in_app',
      },
      {
        level: 2,
        name: 'Reminder',
        trigger_hours_before_breach: 72,
        action: 'notify',
        target_role: 'Assigned Owner',
        notification_type: 'in_app',
      },
      {
        level: 3,
        name: 'SLA Breach',
        trigger_hours_before_breach: 0,
        action: 'notify',
        target_role: 'Team Manager',
        notification_type: 'email',
      },
    ],
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function calculateSLAStatus(issue: ComplianceIssue): {
  hoursRemaining: number;
  percentageRemaining: number;
  currentLevel: EscalationLevel | null;
  nextEscalation: EscalationLevel | null;
  isBreached: boolean;
} {
  const config = SLA_CONFIGS[issue.severity];
  const dueAt = new Date(issue.sla_due_at || new Date());
  const now = new Date();
  const hoursRemaining = Math.max(0, (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60));
  const percentageRemaining = Math.max(0, Math.min(100, (hoursRemaining / config.initial_sla_hours) * 100));
  const isBreached = issue.sla_breached || hoursRemaining <= 0;

  // Find current escalation level
  let currentLevel: EscalationLevel | null = null;
  let nextEscalation: EscalationLevel | null = null;

  for (let i = 0; i < config.escalation_levels.length; i++) {
    const level = config.escalation_levels[i];
    if (hoursRemaining <= level.trigger_hours_before_breach) {
      currentLevel = level;
      if (i < config.escalation_levels.length - 1) {
        nextEscalation = config.escalation_levels[i + 1];
      }
    }
  }

  return {
    hoursRemaining,
    percentageRemaining,
    currentLevel,
    nextEscalation,
    isBreached,
  };
}

export function formatTimeRemaining(hours: number): string {
  if (hours <= 0) return 'Overdue';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  if (hours < 48) return `${Math.round(hours)}h (${Math.round(hours / 24)}d)`;
  return `${Math.round(hours / 24)}d`;
}

// ============================================================
// COMPONENTS
// ============================================================

interface SLAProgressBarProps {
  issue: ComplianceIssue;
  showLabel?: boolean;
  className?: string;
}

/**
 * SLA Progress Bar - visual indicator of time remaining
 */
export function SLAProgressBar({ issue, showLabel = true, className }: SLAProgressBarProps) {
  const { hoursRemaining, percentageRemaining, isBreached } = calculateSLAStatus(issue);

  const getProgressColor = () => {
    if (isBreached) return 'bg-red-500';
    if (percentageRemaining <= 25) return 'bg-red-500';
    if (percentageRemaining <= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">SLA</span>
          <span className={cn(isBreached ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
            {formatTimeRemaining(hoursRemaining)}
          </span>
        </div>
      )}
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn('h-full transition-all', getProgressColor())}
          style={{ width: `${100 - percentageRemaining}%` }}
        />
      </div>
    </div>
  );
}

interface SLACountdownBadgeProps {
  issue: ComplianceIssue;
  size?: 'sm' | 'md';
}

/**
 * SLA Countdown Badge - compact display of time remaining
 */
export function SLACountdownBadge({ issue, size = 'md' }: SLACountdownBadgeProps) {
  const { hoursRemaining, isBreached } = calculateSLAStatus(issue);

  const getBadgeStyle = () => {
    if (isBreached) return 'bg-red-500/20 text-red-500';
    if (hoursRemaining <= 12) return 'bg-red-500/20 text-red-400';
    if (hoursRemaining <= 24) return 'bg-amber-500/20 text-amber-400';
    return 'bg-emerald-500/20 text-emerald-400';
  };

  return (
    <Badge className={cn(getBadgeStyle(), size === 'sm' && 'text-xs px-2 py-0.5')}>
      <Clock className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
      {formatTimeRemaining(hoursRemaining)}
    </Badge>
  );
}

interface SLAEscalationLadderProps {
  issue: ComplianceIssue;
  onRequestExtension?: (issueId: string, reason: string) => void;
  onManualEscalate?: (issueId: string, targetRole: string) => void;
}

/**
 * SLA Escalation Ladder - full escalation timeline view
 */
export function SLAEscalationLadder({
  issue,
  onRequestExtension,
  onManualEscalate,
}: SLAEscalationLadderProps) {
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [extensionReason, setExtensionReason] = useState('');
  const config = SLA_CONFIGS[issue.severity];
  const { hoursRemaining, currentLevel, isBreached } = calculateSLAStatus(issue);

  const getStepStatus = (level: EscalationLevel) => {
    if (isBreached && level.trigger_hours_before_breach === 0) return 'active';
    if (hoursRemaining <= level.trigger_hours_before_breach) return 'completed';
    return 'pending';
  };

  const getStepIcon = (level: EscalationLevel, status: string) => {
    if (status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    }
    if (status === 'active') {
      if (level.action === 'auto_hold') return <XCircle className="h-5 w-5 text-red-500" />;
      if (level.action === 'escalate') return <ArrowUp className="h-5 w-5 text-amber-500" />;
      return <Bell className="h-5 w-5 text-blue-500" />;
    }
    return <Clock className="h-5 w-5 text-muted-foreground" />;
  };

  const handleRequestExtension = () => {
    if (onRequestExtension && extensionReason.trim()) {
      onRequestExtension(issue.id, extensionReason);
      setExtensionDialogOpen(false);
      setExtensionReason('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              SLA Escalation Timeline
            </CardTitle>
            <CardDescription>
              {issue.severity} severity - {config.initial_sla_hours}h initial SLA
            </CardDescription>
          </div>
          <SLACountdownBadge issue={issue} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          <SLAProgressBar issue={issue} />

          {/* Escalation Steps */}
          <div className="relative">
            {config.escalation_levels.map((level, index) => {
              const status = getStepStatus(level);
              const isLast = index === config.escalation_levels.length - 1;

              return (
                <div key={level.level} className="relative flex items-start gap-4 pb-6">
                  {/* Connector Line */}
                  {!isLast && (
                    <div
                      className={cn(
                        'absolute left-[22px] top-8 h-full w-0.5',
                        status === 'completed' ? 'bg-emerald-500' : 'bg-secondary'
                      )}
                    />
                  )}

                  {/* Step Icon */}
                  <div
                    className={cn(
                      'relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-2',
                      status === 'completed' && 'border-emerald-500 bg-emerald-500/10',
                      status === 'active' && 'border-amber-500 bg-amber-500/10',
                      status === 'pending' && 'border-secondary bg-background'
                    )}
                  >
                    {getStepIcon(level, status)}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={cn('font-medium', status === 'pending' && 'text-muted-foreground')}>
                          {level.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {level.target_role} - {level.action}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {level.trigger_hours_before_breach === 0
                            ? 'At breach'
                            : `${level.trigger_hours_before_breach}h before due`}
                        </p>
                        {status === 'active' && (
                          <Badge variant="outline" className="mt-1">
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t">
            {!isBreached && (
              <Button variant="outline" size="sm" onClick={() => setExtensionDialogOpen(true)}>
                <Calendar className="mr-2 h-4 w-4" />
                Request Extension
              </Button>
            )}
            {onManualEscalate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onManualEscalate(issue.id, 'Compliance Lead')}
              >
                <ArrowUp className="mr-2 h-4 w-4" />
                Manual Escalate
              </Button>
            )}
          </div>
        </div>

        {/* Extension Request Dialog */}
        <Dialog open={extensionDialogOpen} onOpenChange={setExtensionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request SLA Extension</DialogTitle>
              <DialogDescription>
                Provide a reason for extending the SLA deadline. This will be recorded in the audit log.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Current Deadline</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(issue.sla_due_at || '').toLocaleString()}
                </p>
              </div>
              <div>
                <Label>Reason for Extension</Label>
                <Textarea
                  placeholder="Explain why an extension is needed..."
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExtensionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequestExtension} disabled={!extensionReason.trim()}>
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

interface SLASummaryCardProps {
  issues: ComplianceIssue[];
  className?: string;
}

/**
 * SLA Summary Card - overview of SLA status across issues
 */
export function SLASummaryCard({ issues, className }: SLASummaryCardProps) {
  const breached = issues.filter((i) => calculateSLAStatus(i).isBreached).length;
  const atRisk = issues.filter((i) => {
    const status = calculateSLAStatus(i);
    return !status.isBreached && status.hoursRemaining <= 24;
  }).length;
  const healthy = issues.length - breached - atRisk;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">SLA Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-emerald-600">{healthy}</p>
            <p className="text-xs text-muted-foreground">On Track</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{atRisk}</p>
            <p className="text-xs text-muted-foreground">At Risk</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{breached}</p>
            <p className="text-xs text-muted-foreground">Breached</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
