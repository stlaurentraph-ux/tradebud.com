'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export type ComplianceStatus = 'compliant' | 'warning' | 'failed' | 'pending';

interface ComplianceCheckItem {
  id: string;
  title: string;
  description: string;
  status: ComplianceStatus;
  severity: 'critical' | 'warning' | 'info';
}

interface ComplianceCheckListProps {
  checks: ComplianceCheckItem[];
  loading?: boolean;
}

const statusConfig = {
  compliant: {
    icon: CheckCircle,
    className: 'text-green-500',
    bgClassName: 'bg-green-500/10 border-green-500/20',
    label: 'Passed',
  },
  warning: {
    icon: AlertTriangle,
    className: 'text-amber-500',
    bgClassName: 'bg-amber-500/10 border-amber-500/20',
    label: 'Warning',
  },
  failed: {
    icon: AlertCircle,
    className: 'text-destructive',
    bgClassName: 'bg-destructive/10 border-destructive/20',
    label: 'Failed',
  },
  pending: {
    icon: Clock,
    className: 'text-primary',
    bgClassName: 'bg-primary/10 border-primary/20',
    label: 'Pending',
  },
};

export function ComplianceCheckList({ checks, loading }: ComplianceCheckListProps) {
  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.status === 'compliant').length;
  const failedChecks = checks.filter((c) => c.status === 'failed').length;
  const warningChecks = checks.filter((c) => c.status === 'warning').length;

  const compliancePercentage = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Compliance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overall Compliance</p>
              <p className="mt-1 text-3xl font-bold">{Math.round(compliancePercentage)}%</p>
            </div>
            <div className="space-y-1 text-right">
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-500">{passedChecks}</span>
                  <span className="text-muted-foreground"> Passed</span>
                </div>
                {warningChecks > 0 && (
                  <div>
                    <span className="font-medium text-amber-500">{warningChecks}</span>
                    <span className="text-muted-foreground"> Warnings</span>
                  </div>
                )}
                {failedChecks > 0 && (
                  <div>
                    <span className="font-medium text-destructive">{failedChecks}</span>
                    <span className="text-muted-foreground"> Failed</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-2 rounded-full transition-all ${
                compliancePercentage === 100
                  ? 'bg-green-500'
                  : compliancePercentage >= 75
                    ? 'bg-amber-500'
                    : 'bg-destructive'
              }`}
              style={{ width: `${compliancePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Compliance Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance Checks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded bg-secondary" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {checks.map((check) => {
                const config = statusConfig[check.status];
                const Icon = config.icon;

                return (
                  <div key={check.id} className={`rounded-lg border p-4 ${config.bgClassName}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${config.className}`} />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-foreground">{check.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{check.description}</p>
                      </div>
                      <span
                        className={`whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${config.className}`}
                      >
                        {config.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
