'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Clock, Copy, RefreshCw, XCircle } from 'lucide-react';
import { AsyncState } from '@/components/common/async-state';
import { PermissionGate } from '@/components/common/permission-gate';
import { CampaignDeskQrPrintSheet } from '@/components/requests/campaign-desk-qr-print-sheet';
import { CampaignRecipientFunnelSummary } from '@/components/requests/campaign-recipient-funnel-summary';
import { CampaignRecipientProgressStepper } from '@/components/requests/campaign-recipient-progress-stepper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CAMPAIGN_RECIPIENT_FILTERS,
  campaignFulfillmentSourceBadgeClass,
  campaignRecipientOnboardingBadgeClass,
  countCampaignRecipientsForFilter,
  filterCampaignRecipients,
  getCampaignRecipientDisplayLabel,
  getCampaignRecipientChannelIcon,
  getRecipientProgressSteps,
  type CampaignRecipientFilter,
  type CampaignRecipientTimelineEntry,
} from '@/lib/campaign-recipient-timeline';
import { resolveCampaignRecipientSenderActions } from '@/lib/campaign-recipient-sender-ui';
import { LocaleContext } from '@/lib/locale-context';
import { DASHBOARD_EVENTS, trackDashboardEvent } from '@/lib/observability/analytics';
import { resendCampaignRecipientInvite } from '@/lib/request-campaign-client';
import { cn } from '@/lib/utils';
import {
  formatCampaignDecisionSource,
  useCampaignDecisions,
  type CampaignDecisionFilter,
} from '@/lib/use-campaign-decisions';
import {
  getCampaignRecipientOnboardingStatusLabel,
  getCampaignRecipientFulfillmentSourceLabel,
  getCampaignRecipientDeskQrPrintLabel,
  getCampaignRecipientTimelineCopyEmailLabel,
  getCampaignRecipientTimelineCopyConnectLinkLabel,
  getCampaignRecipientTimelineCopyInboxLinkLabel,
  getCampaignRecipientTimelineResendInviteLabel,
  getCampaignRecipientTimelineDescription,
  getCampaignRecipientTimelineEmptyActivity,
  getCampaignRecipientTimelineEmptyFiltered,
  getCampaignRecipientTimelineEmptyRecipients,
  getCampaignRecipientTimelineError,
  getCampaignRecipientTimelineFilterLabel,
  getCampaignRecipientTimelineLastActivityLabel,
  getCampaignRecipientTimelineLatestDecisionLabel,
  getCampaignRecipientTimelineLoadMoreDecisions,
  getCampaignRecipientTimelineLoading,
  getCampaignRecipientTimelineTabActivity,
  getCampaignRecipientTimelineTabRecipients,
  getCampaignRecipientTimelineTitle,
} from '@/lib/workflow-terminology-labels';

type CampaignDecisionsDialogProps = {
  campaignId: string | null;
  campaignTitle?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DECISION_FILTER_TABS: CampaignDecisionFilter[] = ['all', 'accept', 'refuse'];

function decisionBadgeClass(decision: 'accept' | 'refuse'): string {
  return decision === 'accept'
    ? 'bg-emerald-500/15 text-emerald-700'
    : 'bg-red-500/15 text-red-700';
}

function formatRelativeTimestamp(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

function RecipientRow({
  campaignId,
  recipient,
  t,
  onResent,
}: {
  campaignId: string;
  recipient: CampaignRecipientTimelineEntry;
  t?: (key: string) => string;
  onResent?: () => void;
}) {
  const displayLabel = getCampaignRecipientDisplayLabel(recipient);
  const channelIcon = getCampaignRecipientChannelIcon(recipient.delivery_channel);
  const actions = resolveCampaignRecipientSenderActions(campaignId, recipient);
  const [copiedField, setCopiedField] = useState<'email' | 'connect' | 'inbox' | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [deskPrintOpen, setDeskPrintOpen] = useState(false);
  const [deskClaimUrl, setDeskClaimUrl] = useState<string | null>(null);
  const [deskClaimExpiresAt, setDeskClaimExpiresAt] = useState<string | null>(null);
  const [deskPrintLoading, setDeskPrintLoading] = useState(false);
  const relativeTime = formatRelativeTimestamp(recipient.updated_at);
  const steps = getRecipientProgressSteps(recipient.onboarding_status);

  const copyToClipboard = async (text: string, field: 'email' | 'connect' | 'inbox') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1500);
      if (field === 'connect' || field === 'inbox') {
        trackDashboardEvent(DASHBOARD_EVENTS.CAMPAIGN_RECIPIENT_LINK_COPIED, {
          campaign_id: campaignId,
          link_type: field,
        });
      }
    } catch {
      // Clipboard unavailable — ignore silently.
    }
  };

  const handleCopyEmail = async () => {
    if (!recipient.recipient_email) {
      return;
    }
    await copyToClipboard(recipient.recipient_email, 'email');
  };

  const handleResend = async () => {
    if (!recipient.recipient_email) {
      return;
    }
    setIsResending(true);
    try {
      await resendCampaignRecipientInvite(campaignId, recipient.recipient_email);
      trackDashboardEvent(DASHBOARD_EVENTS.CAMPAIGN_RECIPIENT_INVITE_RESENT, {
        campaign_id: campaignId,
      });
      onResent?.();
    } catch {
      trackDashboardEvent(DASHBOARD_EVENTS.CAMPAIGN_RECIPIENT_INVITE_RESEND_FAILURE, {
        campaign_id: campaignId,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handlePrintDeskQr = async () => {
    if (!recipient.contact_id) {
      return;
    }
    setDeskPrintLoading(true);
    try {
      const token = window.sessionStorage.getItem('tracebud_token');
      const response = await fetch(
        `/api/requests/campaigns/${encodeURIComponent(campaignId)}/recipients/${encodeURIComponent(recipient.contact_id)}/desk-claim-link`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      const body = (await response.json()) as {
        claimUrl?: string;
        claimExpiresAt?: string;
        error?: string;
      };
      if (!response.ok || !body.claimUrl) {
        throw new Error(body.error ?? 'Failed to prepare desk QR.');
      }
      setDeskClaimUrl(body.claimUrl);
      setDeskClaimExpiresAt(body.claimExpiresAt ?? null);
      setDeskPrintOpen(true);
    } catch {
      // Silent failure — buyer can retry.
    } finally {
      setDeskPrintLoading(false);
    }
  };

  return (
    <>
    <div className="flex flex-col gap-3 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          {channelIcon ? (
            <span className="shrink-0 text-base" aria-hidden="true" title={recipient.delivery_channel ?? undefined}>
              {channelIcon}
            </span>
          ) : null}
          <p className="truncate font-medium text-foreground" title={displayLabel}>
            {displayLabel}
          </p>
          {recipient.recipient_email ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => void handleCopyEmail()}
            aria-label={getCampaignRecipientTimelineCopyEmailLabel(t)}
            title={getCampaignRecipientTimelineCopyEmailLabel(t)}
          >
            <Copy className={cn('h-3.5 w-3.5', copiedField === 'email' && 'text-emerald-600')} aria-hidden="true" />
          </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={campaignRecipientOnboardingBadgeClass(recipient.onboarding_status)}>
            {getCampaignRecipientOnboardingStatusLabel(recipient.onboarding_status, t)}
          </Badge>
          {recipient.fulfillment_source ? (
            <Badge className={campaignFulfillmentSourceBadgeClass(recipient.fulfillment_source)}>
              {getCampaignRecipientFulfillmentSourceLabel(recipient.fulfillment_source, t)}
            </Badge>
          ) : null}
          {recipient.decision_source ? (
            <span className="text-xs text-muted-foreground">
              {formatCampaignDecisionSource(recipient.decision_source)}
            </span>
          ) : null}
          {relativeTime ? (
            <span className="text-xs text-muted-foreground">
              {getCampaignRecipientTimelineLastActivityLabel(relativeTime, t)}
            </span>
          ) : null}
        </div>
        {actions.canCopyConnectLink || actions.canCopyInboxLink || actions.canResendInvite ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {actions.canCopyConnectLink && actions.connectUrl ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void copyToClipboard(actions.connectUrl!, 'connect')}
              >
                <Copy
                  className={cn('mr-1 h-3.5 w-3.5', copiedField === 'connect' && 'text-emerald-600')}
                  aria-hidden="true"
                />
                {getCampaignRecipientTimelineCopyConnectLinkLabel(t)}
              </Button>
            ) : null}
            {actions.canCopyInboxLink && actions.inboxUrl ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void copyToClipboard(actions.inboxUrl!, 'inbox')}
              >
                <Copy
                  className={cn('mr-1 h-3.5 w-3.5', copiedField === 'inbox' && 'text-emerald-600')}
                  aria-hidden="true"
                />
                {getCampaignRecipientTimelineCopyInboxLinkLabel(t)}
              </Button>
            ) : null}
            {actions.canResendInvite ? (
              <PermissionGate permission="requests:send">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isResending}
                  onClick={() => void handleResend()}
                >
                  <RefreshCw
                    className={cn('mr-1 h-3.5 w-3.5', isResending && 'animate-spin')}
                    aria-hidden="true"
                  />
                  {getCampaignRecipientTimelineResendInviteLabel(t)}
                </Button>
              </PermissionGate>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        {recipient.delivery_channel === 'desk_only' && recipient.contact_id ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={deskPrintLoading}
            onClick={() => void handlePrintDeskQr()}
          >
            {getCampaignRecipientDeskQrPrintLabel(t)}
          </Button>
        ) : null}
        <CampaignRecipientProgressStepper steps={steps} compact t={t} />
      </div>
    </div>
    {deskClaimUrl ? (
      <CampaignDeskQrPrintSheet
        open={deskPrintOpen}
        onOpenChange={setDeskPrintOpen}
        recipientLabel={displayLabel}
        claimUrl={deskClaimUrl}
        claimExpiresAt={deskClaimExpiresAt}
        t={t}
      />
    ) : null}
    </>
  );
}

export function CampaignDecisionsDialog({
  campaignId,
  campaignTitle,
  open,
  onOpenChange,
}: CampaignDecisionsDialogProps) {
  const locale = useContext(LocaleContext);
  const t = locale?.t;
  const [activeTab, setActiveTab] = useState<'recipients' | 'activity'>('recipients');
  const [recipientFilter, setRecipientFilter] = useState<CampaignRecipientFilter>('all');
  const [decisionFilter, setDecisionFilter] = useState<CampaignDecisionFilter>('all');
  const { data, isLoading, isLoadingMore, error, loadMore, reload } = useCampaignDecisions(campaignId, {
    decision: decisionFilter,
    enabled: open,
  });

  useEffect(() => {
    if (!open || !campaignId || !data) {
      return;
    }
    trackDashboardEvent(DASHBOARD_EVENTS.CAMPAIGN_RECIPIENT_TIMELINE_VIEWED, {
      campaign_id: campaignId,
      recipient_count: data.recipients.length,
    });
  }, [open, campaignId, data]);

  const recipients = useMemo(() => data?.recipients ?? [], [data?.recipients]);
  const filteredRecipients = useMemo(
    () => filterCampaignRecipients(recipients, recipientFilter),
    [recipients, recipientFilter],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle>{getCampaignRecipientTimelineTitle(t)}</DialogTitle>
          <DialogDescription>{getCampaignRecipientTimelineDescription(campaignTitle, t)}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <AsyncState mode="loading" title={getCampaignRecipientTimelineLoading(t)} />
        ) : error ? (
          <AsyncState mode="error" title={getCampaignRecipientTimelineError(t)} description={error} />
        ) : (
          <>
            <CampaignRecipientFunnelSummary
              counts={data?.recipient_status_counts}
              totalRecipients={recipients.length}
              t={t}
            />

            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'recipients' | 'activity')}
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList>
                <TabsTrigger value="recipients">
                  {getCampaignRecipientTimelineTabRecipients(t)}
                  {recipients.length > 0 ? (
                    <span className="ml-1 text-muted-foreground">({recipients.length})</span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="activity">
                  {getCampaignRecipientTimelineTabActivity(t)}
                  {data?.counts ? (
                    <span className="ml-1 text-muted-foreground">({data.counts.all})</span>
                  ) : null}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recipients" className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
                {recipients.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    <Clock className="mx-auto mb-2 h-6 w-6 opacity-60" />
                    {getCampaignRecipientTimelineEmptyRecipients(t)}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {CAMPAIGN_RECIPIENT_FILTERS.map((filter) => {
                        const count = countCampaignRecipientsForFilter(recipients, filter);
                        return (
                          <Button
                            key={filter}
                            type="button"
                            size="sm"
                            variant={recipientFilter === filter ? 'default' : 'outline'}
                            onClick={() => setRecipientFilter(filter)}
                          >
                            {getCampaignRecipientTimelineFilterLabel(filter, t)}
                            <span className="ml-1 opacity-80">({count})</span>
                          </Button>
                        );
                      })}
                    </div>
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                      {filteredRecipients.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                          {getCampaignRecipientTimelineEmptyFiltered(t)}
                        </div>
                      ) : (
                        filteredRecipients.map((recipient) => (
                          <RecipientRow
                            key={recipient.contact_id ?? recipient.recipient_email ?? recipient.recipient_label}
                            campaignId={campaignId ?? ''}
                            recipient={recipient}
                            t={t}
                            onResent={reload}
                          />
                        ))
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="activity" className="mt-4 min-h-0 flex-1 overflow-y-auto">
                <Tabs
                  value={decisionFilter}
                  onValueChange={(value) => setDecisionFilter(value as CampaignDecisionFilter)}
                >
                  <TabsList>
                    {DECISION_FILTER_TABS.map((tab) => (
                      <TabsTrigger key={tab} value={tab} className="capitalize">
                        {tab === 'all' ? 'All' : tab}
                        {data?.counts ? (
                          <span className="ml-1 text-muted-foreground">
                            (
                            {tab === 'all'
                              ? data.counts.all
                              : tab === 'accept'
                                ? data.counts.accept
                                : data.counts.refuse}
                            )
                          </span>
                        ) : null}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {!data || data.decisions.length === 0 ? (
                  <div className="mt-3 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    {getCampaignRecipientTimelineEmptyActivity(t)}
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {data.last_synced_at ? (
                      <p className="text-xs text-muted-foreground">
                        {getCampaignRecipientTimelineLatestDecisionLabel(
                          formatRelativeTimestamp(data.last_synced_at) ?? '',
                          t,
                        )}
                      </p>
                    ) : null}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Decision</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Decided at</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.decisions.map((decision) => (
                          <TableRow key={`${decision.recipient_email}-${decision.decided_at}`}>
                            <TableCell className="font-medium">{decision.recipient_email}</TableCell>
                            <TableCell>
                              <Badge className={decisionBadgeClass(decision.decision)}>
                                {decision.decision === 'accept' ? (
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                ) : (
                                  <XCircle className="mr-1 h-3 w-3" />
                                )}
                                {decision.decision}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatCampaignDecisionSource(decision.source)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(decision.decided_at).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {data.pagination.has_more ? (
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void loadMore()}
                          disabled={isLoadingMore}
                        >
                          {isLoadingMore ? 'Loading...' : getCampaignRecipientTimelineLoadMoreDecisions(t)}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
