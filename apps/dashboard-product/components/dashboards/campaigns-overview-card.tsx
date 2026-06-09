'use client';

import Link from 'next/link';
import { Plus, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { useRequestCampaigns } from '@/lib/use-requests';

interface CampaignsOverviewCardProps {
  title?: string;
  description: string;
  createHref: string;
  listHref: string;
  createLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyCtaLabel?: string;
  listLinkLabel?: string;
}

export function CampaignsOverviewCard({
  title = 'Campaigns',
  description,
  createHref,
  listHref,
  createLabel = 'New campaign',
  emptyTitle = 'No campaigns yet',
  emptyDescription = 'Create your first campaign to request missing upstream data from producers and partners.',
  emptyCtaLabel = 'Launch first campaign',
  listLinkLabel = 'View all campaigns',
}: CampaignsOverviewCardProps) {
  const { user } = useAuth();
  const { campaigns, isLoading } = useRequestCampaigns(user?.tenant_id ?? null);
  const activeCampaigns = campaigns.filter((campaign) =>
    ['DRAFT', 'QUEUED', 'RUNNING'].includes(campaign.status),
  ).length;
  const completedCampaigns = campaigns.filter((campaign) =>
    ['COMPLETED', 'PARTIAL'].includes(campaign.status),
  ).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button asChild size="sm">
          <Link href={createHref}>
            <Plus className="mr-2 h-4 w-4" />
            {createLabel}
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Total campaigns</p>
            <p className="mt-1 text-2xl font-bold">{isLoading ? '—' : campaigns.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="mt-1 text-2xl font-bold">{isLoading ? '—' : activeCampaigns}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="mt-1 text-2xl font-bold">{isLoading ? '—' : completedCampaigns}</p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading campaigns...</p>
        ) : campaigns.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Send className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">{emptyTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href={createHref}>{emptyCtaLabel}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {campaigns.slice(0, 3).map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{campaign.title || campaign.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.target_contact_emails?.length ?? 0} recipients ·{' '}
                    {new Date(campaign.updated_at ?? campaign.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline">{campaign.status}</Badge>
              </div>
            ))}
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href={listHref}>{listLinkLabel}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
