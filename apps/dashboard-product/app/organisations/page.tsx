'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSponsorView } from '@/lib/sponsor-view';

const organisations = [
  { name: 'North Highlands Cooperative', type: 'Cooperative', country: 'Peru', readiness: '92%', funding: 'Sponsored' },
  { name: 'Rift Valley Producer Alliance', type: 'Cooperative', country: 'Kenya', readiness: '84%', funding: 'Mixed' },
  { name: 'Atlantic Export Hub', type: 'Exporter', country: 'Ghana', readiness: '78%', funding: 'Pass-through' },
];

export default function OrganisationsPage() {
  const sponsorView = useSponsorView();
  const orderedOrganisations =
    sponsorView === 'country'
      ? organisations
      : [...organisations].sort((a, b) => {
          const score = (funding: string) => (funding === 'Sponsored' ? 0 : funding === 'Mixed' ? 1 : 2);
          return score(a.funding) - score(b.funding);
        });

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Organisations"
        subtitle={
          sponsorView === 'country'
            ? 'Sponsor-scoped directory for network activation, readiness, and country coverage'
            : 'Sponsor-scoped directory for supplier performance, funded coverage, and value-chain visibility'
        }
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Organisations' }]}
      />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Network Member Directory</CardTitle>
            <CardDescription>
              {sponsorView === 'country'
                ? 'Prioritises ecosystem activation and readiness by country and organisation type.'
                : 'Prioritises sponsored suppliers and value-chain entities with direct funding impact.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="mb-2">
              <Badge variant="outline">
                Emphasis: {sponsorView === 'country' ? 'Country programme' : 'Brand sponsor'}
              </Badge>
            </div>
            {orderedOrganisations.map((org) => (
              <div key={org.name} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{org.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {org.type} · {org.country}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Readiness {org.readiness}</Badge>
                  <Badge variant="secondary">{org.funding}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
