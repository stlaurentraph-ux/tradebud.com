'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PermissionGate } from '@/components/common/permission-gate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Archive, Plus, Send } from 'lucide-react';
import { useSponsorView } from '@/lib/sponsor-view';
import { NewRequestWizardDialog, type NewRequestResult } from '@/components/requests/wizard/new-request-wizard-dialog';
import { useAuth } from '@/lib/auth-context';
import { useRequestCampaigns } from '@/lib/use-requests';
import { LocaleContext } from '@/lib/locale-context';
import { buildAppBreadcrumbs, translatePageHeader } from '@/lib/nav-labels';
import { SearchParamsPageBoundary } from '@/components/routing/search-params-page-boundary';
import {
  canArchiveCampaign,
  canSendDraftCampaign,
  DASHBOARD_OUTREACH_UI_STATUSES,
  mapCampaignStatusToOutreachUi,
  type DashboardOutreachUiStatus,
} from '@/lib/dashboardCrmOutreachRegistry';
import { DASHBOARD_EVENTS, trackDashboardEvent } from '@/lib/observability/analytics';
import {
  getOutreachArchiveLabel,
  getOutreachSendDraftLabel,
  getOutreachStatusLabel,
} from '@/lib/workflow-terminology-labels';

type ProgrammeStatus = DashboardOutreachUiStatus;

const PROGRAMME_STATUS_TABS: ProgrammeStatus[] = [...DASHBOARD_OUTREACH_UI_STATUSES];

const statusBadgeClass: Record<ProgrammeStatus, string> = {
  Draft: 'bg-slate-500/15 text-slate-700',
  Sent: 'bg-blue-500/15 text-blue-700',
  Completed: 'bg-emerald-500/15 text-emerald-700',
  Archived: 'bg-zinc-500/15 text-zinc-700',
};

function formatRecipientTarget(count: number): string {
  return count > 0 ? `${count} recipients` : 'Network recipients';
}

export default function ProgrammesPage() {
  return (
    <SearchParamsPageBoundary>
      <ProgrammesPageContent />
    </SearchParamsPageBoundary>
  );
}

function ProgrammesPageContent() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const pageHeader = translatePageHeader(t, 'programmes', { title: 'Programmes' });
  const searchParams = useSearchParams();
  const sponsorView = useSponsorView();
  const { user } = useAuth();
  const { campaigns, isLoading, error, reload, sendDraft, archive } = useRequestCampaigns(user?.tenant_id ?? null);
  const [statusTab, setStatusTab] = useState<ProgrammeStatus>('Draft');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyCampaignId, setBusyCampaignId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setIsWizardOpen(true);
    }
  }, [searchParams]);

  const filteredCampaigns = useMemo(
    () => campaigns.filter((campaign) => mapCampaignStatusToOutreachUi(campaign.status) === statusTab),
    [campaigns, statusTab],
  );

  const handleWizardComplete = (result: NewRequestResult) => {
    setStatusTab(result.status);
    reload();
  };

  const handleSendDraft = async (campaignId: string, requestType: string) => {
    setActionError(null);
    setBusyCampaignId(campaignId);
    try {
      await sendDraft(campaignId);
      trackDashboardEvent(DASHBOARD_EVENTS.CAMPAIGN_SEND_SUCCESS, {
        request_type: requestType,
        source: 'programmes_table',
      });
      setStatusTab('Sent');
    } catch (nextError) {
      trackDashboardEvent(DASHBOARD_EVENTS.CAMPAIGN_SEND_FAILURE, {
        request_type: requestType,
        source: 'programmes_table',
        reason: nextError instanceof Error ? nextError.message : 'unknown',
      });
      setActionError(nextError instanceof Error ? nextError.message : 'Failed to send draft campaign.');
    } finally {
      setBusyCampaignId(null);
    }
  };

  const handleArchive = async (campaignId: string, requestType: string) => {
    setActionError(null);
    setBusyCampaignId(campaignId);
    try {
      await archive(campaignId);
      trackDashboardEvent(DASHBOARD_EVENTS.CAMPAIGN_ARCHIVE_SUCCESS, {
        request_type: requestType,
        source: 'programmes_table',
      });
      setStatusTab('Archived');
    } catch (nextError) {
      trackDashboardEvent(DASHBOARD_EVENTS.CAMPAIGN_ARCHIVE_FAILURE, {
        request_type: requestType,
        source: 'programmes_table',
        reason: nextError instanceof Error ? nextError.message : 'unknown',
      });
      setActionError(nextError instanceof Error ? nextError.message : 'Failed to archive campaign.');
    } finally {
      setBusyCampaignId(null);
    }
  };

  const sendDraftLabel = getOutreachSendDraftLabel(user?.active_role, t);
  const archiveLabel = getOutreachArchiveLabel(t);

  return (
    <div className="flex flex-col">
      <AppHeader
        title={pageHeader.title}
        subtitle={
          sponsorView === 'country'
            ? 'Run sponsor programme campaigns and bulk requests to upstream organisations across the origin network'
            : 'Run sponsor programme campaigns and bulk requests to suppliers across the sponsored value chain'
        }
        breadcrumbs={buildAppBreadcrumbs(t, { name: 'Programmes' })}
        actions={
          <PermissionGate permission="requests:create">
            <Button onClick={() => setIsWizardOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New campaign
            </Button>
          </PermissionGate>
        }
      />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Programme Campaigns</CardTitle>
              <CardDescription>
                {sponsorView === 'country'
                  ? 'Create and track bulk remediation or evidence requests to cooperatives, exporters, and country partners.'
                  : 'Create and track bulk remediation or evidence requests to upstream suppliers and partner organisations.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-2">
              <Badge variant="outline">
                Emphasis: {sponsorView === 'country' ? 'Country programme' : 'Brand sponsor'}
              </Badge>
            </div>
            {isLoading ? <p className="text-sm text-muted-foreground">Loading campaigns from backend...</p> : null}
            {error ? <p className="text-sm text-amber-700">{error}</p> : null}
            {actionError ? <p className="text-sm text-amber-700">{actionError}</p> : null}

            <Tabs value={statusTab} onValueChange={(value) => setStatusTab(value as ProgrammeStatus)}>
              <TabsList>
                {PROGRAMME_STATUS_TABS.map((status) => (
                  <TabsTrigger key={status} value={status}>
                    {getOutreachStatusLabel(status, t)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {filteredCampaigns.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <Send className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-foreground">
                  No {statusTab.toLowerCase()} programme campaigns
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Launch a bulk request campaign to collect missing evidence, references, or compliance data.
                </p>
                <PermissionGate permission="requests:create">
                  <Button className="mt-4" variant="outline" onClick={() => setIsWizardOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Programme Campaign
                  </Button>
                </PermissionGate>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Request type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => {
                    const uiStatus = mapCampaignStatusToOutreachUi(campaign.status);
                    const recipientCount = campaign.target_contact_emails?.length ?? 0;
                    const isBusy = busyCampaignId === campaign.id;
                    const showSend = canSendDraftCampaign(campaign.status);
                    const showArchive = canArchiveCampaign(campaign.status);
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.id}</TableCell>
                        <TableCell>{campaign.title}</TableCell>
                        <TableCell>{formatRecipientTarget(recipientCount)}</TableCell>
                        <TableCell>{campaign.request_type.replace(/_/g, ' ').toLowerCase()}</TableCell>
                        <TableCell>
                          {new Date(campaign.updated_at ?? campaign.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadgeClass[uiStatus]}>{getOutreachStatusLabel(uiStatus, t)}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {showSend ? (
                              <PermissionGate permission="requests:send">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() => void handleSendDraft(campaign.id, campaign.request_type)}
                                >
                                  {sendDraftLabel}
                                </Button>
                              </PermissionGate>
                            ) : null}
                            {showArchive ? (
                              <PermissionGate permission="requests:archive">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() => void handleArchive(campaign.id, campaign.request_type)}
                                >
                                  <Archive className="mr-1 h-3.5 w-3.5" />
                                  {archiveLabel}
                                </Button>
                              </PermissionGate>
                            ) : null}
                            {!showSend && !showArchive ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : null}
                          </div>
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
