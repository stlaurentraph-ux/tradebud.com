'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';

const cooperativeGuides = [
  'Member onboarding and consent capture',
  'Portability request review and approval',
  'Plot geometry remediation and duplicate handling',
  'Yield-cap blockers and batch appeal workflows',
  'Premium governance records and committee approvals',
  'Field sync conflicts and offline submission recovery',
];

const defaultGuides = [
  'Shipments and declaration readiness',
  'Evidence management and retention',
  'Compliance issue remediation',
  'Reporting snapshots and exports',
];

export default function HelpPage() {
  const { user } = useAuth();
  const isCooperative = user?.active_role === 'cooperative';

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Help"
        subtitle={
          isCooperative
            ? 'Guidance for field operations, consent, portability, governance, and shipment readiness'
            : 'Workflow guidance, troubleshooting, and support resources'
        }
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Help' }]}
      />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Help Center</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Search documentation, troubleshooting guides, and workflow walkthroughs.</p>
            <p>
              {isCooperative
                ? 'For cooperative workflows, start with Members, Field Operations, Lots & Batches, Governance, and Audit Log.'
                : 'For importer workflows, start with Shipments, Compliance, Evidence, and Reporting guides.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isCooperative ? 'Cooperative Guides' : 'Recommended Guides'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(isCooperative ? cooperativeGuides : defaultGuides).map((guide) => (
              <div key={guide} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-sm">{guide}</span>
                <Badge variant="outline">Guide</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
