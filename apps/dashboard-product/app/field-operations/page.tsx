'use client';

import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Smartphone, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const queueItems = [
  { name: 'Missing member profile', count: 12, severity: 'high' },
  { name: 'Missing consent grant', count: 9, severity: 'high' },
  { name: 'Missing geometry upgrade', count: 15, severity: 'medium' },
  { name: 'Unresolved duplicate reviews', count: 6, severity: 'medium' },
];

export default function FieldOperationsPage() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<{
    total_farmers: number;
    total_plots: number;
    compliant_plots: number;
    members_missing_consent: number;
    requests_overdue: number;
  }>({
    total_farmers: 0,
    total_plots: 0,
    compliant_plots: 0,
    members_missing_consent: 0,
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

  const coverage = insights.total_plots > 0 ? Math.round((insights.compliant_plots / insights.total_plots) * 100) : 0;
  const queueSummaries = [
    { name: 'Missing member profile', count: Math.max(0, insights.total_farmers - insights.compliant_plots), severity: 'high' },
    { name: 'Missing consent grant', count: insights.members_missing_consent, severity: 'high' },
    { name: 'Overdue request follow-up', count: insights.requests_overdue, severity: 'medium' },
  ];

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Field Operations"
        subtitle="Coordinate field agents, mobile capture quality, and remediation campaigns"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Field Operations' }]}
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{insights.total_farmers}</p>
                  <p className="text-xs text-muted-foreground">Active field agents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{coverage}%</p>
                  <p className="text-xs text-muted-foreground">Coverage completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{Math.max(0, insights.total_plots - insights.compliant_plots)}</p>
                  <p className="text-xs text-muted-foreground">Sync conflicts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{insights.requests_overdue}</p>
                  <p className="text-xs text-muted-foreground">Revoked devices</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Capture Remediation Queues</CardTitle>
            <Button size="sm">Create Campaign</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {(user?.active_role === 'cooperative' ? queueSummaries : queueItems).map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  {item.severity === 'high' ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm">{item.name}</span>
                </div>
                <Badge variant="outline">{item.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
