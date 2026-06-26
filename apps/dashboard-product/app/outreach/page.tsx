'use client';

import { useEffect, useContext, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Send } from 'lucide-react';
import { CampaignDecisionsDialog } from '@/components/requests/campaign-decisions-dialog';
import { NewRequestWizardDialog, type NewRequestResult } from '@/components/requests/wizard/new-request-wizard-dialog';
import { useAuth } from '@/lib/auth-context';
import { useRequestCampaigns } from '@/lib/use-requests';
import { LocaleContext } from '@/lib/locale-context';
import { buildAppBreadcrumbs } from '@/lib/nav-labels';
import {
  getOutreachCardTitle,
  getOutreachEmptyDescription,
  getOutreachEmptyTitle,
  getOutreachLoadingMessage,
  getOutreachNewButtonLabel,
  getOutreachPageSubtitle,
  getOutreachPageTitle,
  getOutreachRecipientCountLabel,
  getOutreachResponsesSummary,
  getOutreachStatusLabel,
  getOutreachTableColumnLabel,
  getOutreachViewTimelineLabel,
  getOutreachWizardDescription,
} from '@/lib/workflow-terminology-labels';
import { SearchParamsPageBoundary } from '@/components/routing/search-params-page-boundary';

type OutreachStatus = 'Draft' | 'Sent' | 'Completed' | 'Archived';

type OutreachRequest = {
  id: string;
  counterpartName: string;
  commodity: string;
  date: string;
  status: OutreachStatus;
};

const OUTREACH_STATUS_TABS: OutreachStatus[] = ['Draft', 'Sent', 'Completed', 'Archived'];

const statusBadgeClass: Record<OutreachStatus, string> = {
  Draft: 'bg-slate-500/15 text-slate-700',
  Sent: 'bg-blue-500/15 text-blue-700',
  Completed: 'bg-emerald-500/15 text-emerald-700',
  Archived: 'bg-zinc-500/15 text-zinc-700',
};

function mapCampaignStatus(status: string): OutreachStatus {
  if (status === 'DRAFT') return 'Draft';
  if (status === 'QUEUED' || status === 'RUNNING') return 'Sent';
  if (status === 'COMPLETED' || status === 'PARTIAL') return 'Completed';
  return 'Archived';
}

export default function OutreachPage() {
  return (
    <SearchParamsPageBoundary>
      <OutreachPageContent />
    </SearchParamsPageBoundary>
  );
}

function OutreachPageContent() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const role = user?.active_role;
  const isImporter = role === 'importer';
  const { campaigns, isLoading, error, reload } = useRequestCampaigns(user?.tenant_id ?? null);
  const [statusTab, setStatusTab] = useState<OutreachStatus>('Draft');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [decisionsCampaignId, setDecisionsCampaignId] = useState<string | null>(null);
  const [decisionsCampaignTitle, setDecisionsCampaignTitle] = useState<string | null>(null);
  const [isDecisionsOpen, setIsDecisionsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
      setIsWizardOpen(true);
    }
  }, [searchParams]);

  const requests = useMemo<OutreachRequest[]>(
    () =>
      campaigns.map((campaign) => ({
        id: campaign.id,
        counterpartName: getOutreachRecipientCountLabel(campaign.target_contact_emails?.length ?? 0, t),
        commodity: campaign.request_type.replace(/_/g, ' ').toLowerCase(),
        date: campaign.updated_at ?? campaign.created_at,
        status: mapCampaignStatus(campaign.status),
      })),
    [campaigns, t],
  );

  const filteredRequests = useMemo(
    () => requests.filter((request) => request.status === statusTab),
    [requests, statusTab],
  );

  const handleWizardComplete = (result: NewRequestResult) => {
    setStatusTab(result.status);
    reload();
  };

  const openDecisionsTimeline = (campaignId: string, campaignTitle: string) => {
    setDecisionsCampaignId(campaignId);
    setDecisionsCampaignTitle(campaignTitle);
    setIsDecisionsOpen(true);
  };

  const breadcrumbName = isImporter ? 'Campaigns' : 'Outreach';
  const newButtonLabel = getOutreachNewButtonLabel(role, t);

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getOutreachPageTitle(role, t)}
        subtitle={getOutreachPageSubtitle(role, t)}
        breadcrumbs={buildAppBreadcrumbs(t, { name: breadcrumbName })}
      />

      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{getOutreachCardTitle(role, t)}</CardTitle>
            <Button onClick={() => setIsWizardOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {newButtonLabel}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                {error}
              </div>
            ) : null}
            <Tabs value={statusTab} onValueChange={(value) => setStatusTab(value as OutreachStatus)}>
              <TabsList>
                {OUTREACH_STATUS_TABS.map((status) => (
                  <TabsTrigger key={status} value={status}>
                    {getOutreachStatusLabel(status, t)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {isLoading ? (
              <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
                {getOutreachLoadingMessage(t)}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <Send className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-foreground">
                  {getOutreachEmptyTitle(statusTab, role, t)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{getOutreachEmptyDescription(role, t)}</p>
                <Button className="mt-4" variant="outline" onClick={() => setIsWizardOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {newButtonLabel}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{getOutreachTableColumnLabel('id', role, t)}</TableHead>
                    <TableHead>{getOutreachTableColumnLabel('counterpart', role, t)}</TableHead>
                    <TableHead>{getOutreachTableColumnLabel('commodity', role, t)}</TableHead>
                    <TableHead>{getOutreachTableColumnLabel('date', role, t)}</TableHead>
                    <TableHead>{getOutreachTableColumnLabel('responses', role, t)}</TableHead>
                    <TableHead>{getOutreachTableColumnLabel('status', role, t)}</TableHead>
                    <TableHead className="text-right">{getOutreachTableColumnLabel('actions', role, t)}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns
                    .filter((campaign) => mapCampaignStatus(campaign.status) === statusTab)
                    .map((campaign) => {
                      const status = mapCampaignStatus(campaign.status);
                      const recipientCount = campaign.target_contact_emails?.length ?? 0;
                      const accepted = campaign.accepted_count ?? 0;
                      const pending = campaign.pending_count ?? 0;
                      return (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">{campaign.id}</TableCell>
                          <TableCell>{getOutreachRecipientCountLabel(recipientCount, t)}</TableCell>
                          <TableCell>{campaign.request_type.replace(/_/g, ' ').toLowerCase()}</TableCell>
                          <TableCell>
                            {new Date(campaign.updated_at ?? campaign.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {getOutreachResponsesSummary(accepted, pending, t)}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusBadgeClass[status]}>{getOutreachStatusLabel(status, t)}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {status !== 'Draft' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDecisionsTimeline(campaign.id, campaign.title)}
                              >
                                {getOutreachViewTimelineLabel(t)}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <CampaignDecisionsDialog
        campaignId={decisionsCampaignId}
        campaignTitle={decisionsCampaignTitle}
        open={isDecisionsOpen}
        onOpenChange={(open) => {
          setIsDecisionsOpen(open);
          if (!open) {
            setDecisionsCampaignId(null);
            setDecisionsCampaignTitle(null);
          }
        }}
      />
      <NewRequestWizardDialog
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onComplete={handleWizardComplete}
        mode={isImporter ? 'campaign' : 'request'}
        title={newButtonLabel}
        description={getOutreachWizardDescription(role, t)}
      />
    </div>
  );
}
