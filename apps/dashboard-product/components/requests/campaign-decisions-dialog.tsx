'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { AsyncState } from '@/components/common/async-state';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  formatCampaignDecisionSource,
  useCampaignDecisions,
  type CampaignDecisionFilter,
} from '@/lib/use-campaign-decisions';

type CampaignDecisionsDialogProps = {
  campaignId: string | null;
  campaignTitle?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const FILTER_TABS: CampaignDecisionFilter[] = ['all', 'accept', 'refuse'];

function decisionBadgeClass(decision: 'accept' | 'refuse'): string {
  return decision === 'accept'
    ? 'bg-emerald-500/15 text-emerald-700'
    : 'bg-red-500/15 text-red-700';
}

export function CampaignDecisionsDialog({
  campaignId,
  campaignTitle,
  open,
  onOpenChange,
}: CampaignDecisionsDialogProps) {
  const [filter, setFilter] = useState<CampaignDecisionFilter>('all');
  const { data, isLoading, isLoadingMore, error, loadMore } = useCampaignDecisions(campaignId, {
    decision: filter,
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Recipient response timeline</DialogTitle>
          <DialogDescription>
            {campaignTitle?.trim()
              ? `${campaignTitle} — accept/refuse events recorded per recipient email.`
              : 'Accept and refuse events recorded per recipient email.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as CampaignDecisionFilter)}
        >
          <TabsList>
            {FILTER_TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="capitalize">
                {tab === 'all' ? 'All' : tab}
                {data?.counts ? (
                  <span className="ml-1 text-muted-foreground">
                    ({tab === 'all' ? data.counts.all : tab === 'accept' ? data.counts.accept : data.counts.refuse})
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <AsyncState mode="loading" title="Loading decision timeline..." />
        ) : error ? (
          <AsyncState mode="error" title="Could not load decisions" description={error} />
        ) : !data || data.decisions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            <Clock className="mx-auto mb-2 h-6 w-6 opacity-60" />
            No recipient decisions recorded yet for this campaign.
          </div>
        ) : (
          <div className="space-y-3">
            {data.last_synced_at ? (
              <p className="text-xs text-muted-foreground">
                Latest event: {new Date(data.last_synced_at).toLocaleString()}
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
                <Button variant="outline" size="sm" onClick={() => void loadMore()} disabled={isLoadingMore}>
                  {isLoadingMore ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
