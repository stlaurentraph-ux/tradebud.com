'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSponsorView } from '@/lib/sponsor-view';

const actions = [
  { action: 'Access escalation: North Highlands Cooperative', scope: 'Org scope', status: 'Pending approval' },
  { action: 'Visibility policy update: Evidence fields', scope: 'Network scope', status: 'Awaiting review' },
  { action: 'Risk profile threshold change: Kivu network', scope: 'Programme scope', status: 'Blocked by policy' },
];

export default function DelegatedAdminPage() {
  const sponsorView = useSponsorView();

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Delegated Admin"
        subtitle={
          sponsorView === 'country'
            ? 'Policy-bound interventions for network activation and cooperative support'
            : 'Policy-bound interventions for supplier enablement and compliance performance'
        }
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Delegated Admin' }]}
      />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Scoped Action Console</CardTitle>
            <CardDescription>
              {sponsorView === 'country'
                ? 'Intervene within sponsor-approved boundaries to unblock organisation activation and readiness.'
                : 'Intervene within sponsor-approved boundaries to unblock supplier compliance and evidence workflows.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="mb-2">
              <Badge variant="outline">
                Emphasis: {sponsorView === 'country' ? 'Country programme' : 'Brand sponsor'}
              </Badge>
            </div>
            {actions.map((item) => (
              <div key={item.action} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.scope}</p>
                </div>
                <Badge variant="outline">{item.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
