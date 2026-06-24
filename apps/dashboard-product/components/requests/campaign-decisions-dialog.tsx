'use client';

import { useContext, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Clock, Copy, XCircle } from 'lucide-react';
import { AsyncState } from '@/components/common/async-state';
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
  campaignRecipientOnboardingBadgeClass,
  countCampaignRecipientsForFilter,
  filterCampaignRecipients,
  getRecipientProgressSteps,
  type CampaignRecipientFilter,
  type CampaignRecipientTimelineEntry,
} from '@/lib/campaign-recipient-timeline';
import { LocaleContext } from '@/lib/locale-context';
import { cn } from '@/lib/utils';
import {
  formatCampaignDecisionSource,
  useCampaignDecisions,
  type CampaignDecisionFilter,
} from '@/lib/use-campaign-decisions';
import {
  getCampaignRecipientOnboardingStatusLabel,
  getCampaignRecipientTimelineCopyEmailLabel,
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
  recipient,
  t,
}: {
  recipient: CampaignRecipientTimelineEntry;
  t?: (key: string) => string;
}) {
  const [copied, setCopied] = useState(false);
  const relativeTime = formatRelativeTimestamp(recipient.updated_at);
  const steps = getRecipientProgressSteps(recipient.onboarding_status);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(recipient.recipient_email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — ignore silently.
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-foreground" title={recipient.recipient_email}>
            {recipient.recipient_email}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => void handleCopyEmail()}
            aria-label={getCampaignRecipientTimelineCopyEmailLabel(t)}
            title={getCampaignRecipientTimelineCopyEmailLabel(t)}
          >
            <Copy className={cn('h-3.5 w-3.5', copied && 'text-emerald-600')} aria-hidden="true" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={campaignRecipientOnboardingBadgeClass(recipient.onboarding_status)}>
            {getCampaignRecipientOnboardingStatusLabel(recipient.onboarding_status, t)}
          </Badge>
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
      </div>
      <CampaignRecipientProgressStepper steps={steps} compact t={t} />
    </div>
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
  const { data, isLoading, isLoadingMore, error, loadMore } = useCampaignDecisions(campaignId, {
    decision: decisionFilter,
    enabled: open,
  });

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
                          <RecipientRow key={recipient.recipient_email} recipient={recipient} t={t} />
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
