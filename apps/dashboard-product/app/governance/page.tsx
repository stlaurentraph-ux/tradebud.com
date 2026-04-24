'use client';

import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, Wallet, Users, FileCheck } from 'lucide-react';

const premiumDecisions = [
  { id: 'PD-0182', status: 'approved', amount: '$18,240', split: '70% cash / 30% services' },
  { id: 'PD-0181', status: 'distributed', amount: '$11,900', split: '65% cash / 35% services' },
  { id: 'PD-0180', status: 'proposed', amount: '$8,760', split: 'Pending committee vote' },
];

export default function GovernancePage() {
  const [insights, setInsights] = useState({
    total_farmers: 0,
    portability_reviews_pending: 0,
    active_campaigns: 0,
    requests_overdue: 0,
  });

  useEffect(() => {
    const token = window.sessionStorage.getItem('tracebud_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    void fetch('/api/cooperative/insights', { headers, cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: { metrics?: Partial<typeof insights> }) => {
        if (!payload.metrics) return;
        setInsights((previous) => ({ ...previous, ...payload.metrics }));
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Governance"
        subtitle="Manage cooperative structure, premium distribution, portability review, and Open Chain readiness"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Governance' }]}
      />

      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{insights.total_farmers}</p>
                  <p className="text-xs text-muted-foreground">Active members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold">$38,900</p>
                  <p className="text-xs text-muted-foreground">Premium pool tracked</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{insights.portability_reviews_pending}</p>
                  <p className="text-xs text-muted-foreground">Portability reviews pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{Math.max(0, 100 - insights.requests_overdue)}%</p>
                  <p className="text-xs text-muted-foreground">Health snapshot completion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Premium Distribution Decisions</CardTitle>
            <CardDescription>
              Auditable cooperative-level approvals with member communication and payout split context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {premiumDecisions.map((record) => (
              <div key={record.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{record.id}</p>
                  <p className="text-xs text-muted-foreground">{record.split}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold">{record.amount}</p>
                  <Badge variant="outline" className="capitalize">
                    {record.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
