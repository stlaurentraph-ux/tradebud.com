'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Send } from 'lucide-react';
import { useSponsorView } from '@/lib/sponsor-view';
import { NewRequestWizardDialog, type NewRequestResult } from '@/components/requests/wizard/new-request-wizard-dialog';

type ProgrammeStatus = 'Draft' | 'Sent' | 'Completed' | 'Archived';

type ProgrammeCampaign = {
  id: string;
  title: string;
  target: string;
  commodity: string;
  requestedBy: string;
  date: string;
  status: ProgrammeStatus;
};

const PROGRAMME_STATUS_TABS: ProgrammeStatus[] = ['Draft', 'Sent', 'Completed', 'Archived'];

const statusBadgeClass: Record<ProgrammeStatus, string> = {
  Draft: 'bg-slate-500/15 text-slate-700',
  Sent: 'bg-blue-500/15 text-blue-700',
  Completed: 'bg-emerald-500/15 text-emerald-700',
  Archived: 'bg-zinc-500/15 text-zinc-700',
};

const INITIAL_CAMPAIGNS: ProgrammeCampaign[] = [
  {
    id: 'PROG-2026-001',
    title: 'Q2 Open Chain Evidence Refresh',
    target: '12 cooperatives',
    commodity: 'Coffee',
    requestedBy: 'Sponsor Governance Team',
    date: '2026-04-20',
    status: 'Sent',
  },
  {
    id: 'PROG-2026-002',
    title: 'Living Income Baseline Collection',
    target: '4 exporter groups',
    commodity: 'Cocoa',
    requestedBy: 'Programme Office',
    date: '2026-04-18',
    status: 'Draft',
  },
  {
    id: 'PROG-2026-003',
    title: 'Regenerative Adoption Verification',
    target: '1,240 farmers',
    commodity: 'Coffee',
    requestedBy: 'Open Chain Delivery',
    date: '2026-04-11',
    status: 'Completed',
  },
];

function mapBackendStatus(status: string): ProgrammeStatus {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Archived';
    case 'QUEUED':
    case 'RUNNING':
    case 'PARTIAL':
    case 'EXPIRED':
    default:
      return 'Sent';
  }
}

function toProgrammeCampaign(record: Record<string, unknown>): ProgrammeCampaign {
  const targetCount =
    (Array.isArray(record.target_organization_ids) ? record.target_organization_ids.length : 0) +
    (Array.isArray(record.target_farmer_ids) ? record.target_farmer_ids.length : 0) +
    (Array.isArray(record.target_plot_ids) ? record.target_plot_ids.length : 0) +
    (Array.isArray(record.target_contact_emails) ? record.target_contact_emails.length : 0);

  return {
    id: String(record.id ?? `PROG-${Date.now()}`),
    title: String(record.title ?? record.request_type ?? 'Programme Campaign'),
    target: targetCount > 0 ? `${targetCount} recipients` : 'Network recipients',
    commodity: String(record.commodity ?? 'N/A'),
    requestedBy: String(record.created_by ?? 'Sponsor Programmes'),
    date: String(record.created_at ?? new Date().toISOString()),
    status: mapBackendStatus(String(record.status ?? 'RUNNING')),
  };
}

export default function ProgrammesPage() {
  const sponsorView = useSponsorView();
  const [statusTab, setStatusTab] = useState<ProgrammeStatus>('Draft');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<ProgrammeCampaign[]>(INITIAL_CAMPAIGNS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const filteredCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.status === statusTab),
    [campaigns, statusTab]
  );

  useEffect(() => {
    const token = window.sessionStorage.getItem('tracebud_token');
    setIsLoading(true);
    fetch('/api/requests/campaigns', {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: 'no-store',
    })
      .then((response) => response.json().then((payload) => ({ ok: response.ok, status: response.status, payload })))
      .then(({ ok, status, payload }) => {
        if (!ok) {
          setApiError(
            typeof payload?.error === 'string'
              ? payload.error
              : `Unable to load programme campaigns from backend (status ${status}).`
          );
          return;
        }
        if (Array.isArray(payload)) {
          const mapped = payload
            .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
            .map(toProgrammeCampaign);
          if (mapped.length > 0) {
            setCampaigns(mapped);
          }
        }
      })
      .catch(() => setApiError('Unable to load programme campaigns from backend.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleWizardComplete = (result: NewRequestResult) => {
    const token = window.sessionStorage.getItem('tracebud_token');
    setIsSaving(true);
    fetch('/api/requests/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        title: result.requestTypeLabel,
        description: `Programme campaign for ${result.commodity}`,
        request_type: 'GENERAL_EVIDENCE',
        status: result.status === 'Draft' ? 'DRAFT' : 'QUEUED',
        target_organization_ids: [],
        target_farmer_ids: [],
        target_plot_ids: [],
        target_contact_emails: [],
        due_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
        commodity: result.commodity,
      }),
    })
      .then((response) => response.json().then((payload) => ({ ok: response.ok, status: response.status, payload })))
      .then(({ ok, status, payload }) => {
        if (!ok) {
          setApiError(
            typeof payload?.error === 'string'
              ? payload.error
              : `Campaign saved locally only (backend status ${status}).`
          );
          const localFallback: ProgrammeCampaign = {
            id: `LOCAL-${Date.now()}`,
            title: result.requestTypeLabel,
            target: `${result.recipientCount} recipients`,
            commodity: result.commodity,
            requestedBy: 'Sponsor Programmes',
            date: new Date().toISOString(),
            status: result.status,
          };
          setCampaigns((previous) => [localFallback, ...previous]);
          setStatusTab(result.status);
          return;
        }
        setApiError(null);
        setCampaigns((previous) => [toProgrammeCampaign((payload as Record<string, unknown>) ?? {}), ...previous]);
        setStatusTab(result.status);
      })
      .catch(() => {
        setApiError('Campaign saved locally only (backend unavailable).');
        const localFallback: ProgrammeCampaign = {
          id: `LOCAL-${Date.now()}`,
          title: result.requestTypeLabel,
          target: `${result.recipientCount} recipients`,
          commodity: result.commodity,
          requestedBy: 'Sponsor Programmes',
          date: new Date().toISOString(),
          status: result.status,
        };
        setCampaigns((previous) => [localFallback, ...previous]);
        setStatusTab(result.status);
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Programmes"
        subtitle={
          sponsorView === 'country'
            ? 'Run sponsor programme campaigns and bulk requests to upstream organisations across the origin network'
            : 'Run sponsor programme campaigns and bulk requests to suppliers across the sponsored value chain'
        }
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Programmes' }]}
      />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Programme Campaigns</CardTitle>
              <CardDescription>
                {sponsorView === 'country'
                  ? 'Create and track bulk remediation or evidence requests to cooperatives, exporters, and country partners.'
                  : 'Create and track bulk remediation or evidence requests to upstream suppliers and partner organisations.'}
              </CardDescription>
            </div>
            <Button onClick={() => setIsWizardOpen(true)} disabled={isSaving}>
              <Plus className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'New Programme Campaign'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-2">
              <Badge variant="outline">
                Emphasis: {sponsorView === 'country' ? 'Country programme' : 'Brand sponsor'}
              </Badge>
            </div>
            {isLoading ? <p className="text-sm text-muted-foreground">Loading campaigns from backend...</p> : null}
            {apiError ? <p className="text-sm text-amber-700">{apiError}</p> : null}

            <Tabs value={statusTab} onValueChange={(value) => setStatusTab(value as ProgrammeStatus)}>
              <TabsList>
                {PROGRAMME_STATUS_TABS.map((status) => (
                  <TabsTrigger key={status} value={status}>
                    {status}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {filteredCampaigns.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <Send className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-foreground">No {statusTab.toLowerCase()} programme campaigns</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Launch a bulk request campaign to collect missing evidence, references, or compliance data.
                </p>
                <Button className="mt-4" variant="outline" onClick={() => setIsWizardOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Programme Campaign
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Requested by</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.id}</TableCell>
                      <TableCell>{campaign.title}</TableCell>
                      <TableCell>{campaign.target}</TableCell>
                      <TableCell>{campaign.commodity}</TableCell>
                      <TableCell>{campaign.requestedBy}</TableCell>
                      <TableCell>{new Date(campaign.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass[campaign.status]}>{campaign.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <NewRequestWizardDialog
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onComplete={handleWizardComplete}
        mode="campaign"
        title="New Programme Campaign"
        description="Launch a sponsor programme campaign to request data from upstream organisations."
      />
    </div>
  );
}
