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
    className: 'text-green-600',
    bgClassName: 'bg-green-50',
    label: 'Passed',
  },
  warning: {
    icon: AlertTriangle,
    className: 'text-yellow-600',
    bgClassName: 'bg-yellow-50',
    label: 'Warning',
  },
  failed: {
    icon: AlertCircle,
    className: 'text-red-600',
    bgClassName: 'bg-red-50',
    label: 'Failed',
  },
  pending: {
    icon: Clock,
    className: 'text-blue-600',
    bgClassName: 'bg-blue-50',
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
              <p className="text-3xl font-bold mt-1">{Math.round(compliancePercentage)}%</p>
            </div>
            <div className="text-right space-y-1">
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-green-600 font-medium">{passedChecks}</span>
                  <span className="text-muted-foreground"> Passed</span>
                </div>
                {warningChecks > 0 && (
                  <div>
                    <span className="text-yellow-600 font-medium">{warningChecks}</span>
                    <span className="text-muted-foreground"> Warnings</span>
                  </div>
                )}
                {failedChecks > 0 && (
                  <div>
                    <span className="text-red-600 font-medium">{failedChecks}</span>
                    <span className="text-muted-foreground"> Failed</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                compliancePercentage === 100
                  ? 'bg-green-600'
                  : compliancePercentage >= 75
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
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
                <div key={i} className="animate-pulse h-20 bg-gray-100 rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {checks.map((check) => {
                const config = statusConfig[check.status];
                const Icon = config.icon;

                return (
                  <div key={check.id} className={`p-4 rounded-lg border ${config.bgClassName}`}>
                    <div className="flex gap-3 items-start">
                      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.className}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground">{check.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{check.description}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${config.className}`}>
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
