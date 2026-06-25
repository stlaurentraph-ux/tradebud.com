'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { InboxRequest } from '@/lib/use-requests';
import {
  getInboundCampaignBannerCta,
  getInboundCampaignBannerMessage,
  getInboundCampaignBannerTitle,
} from '@/lib/workflow-terminology-labels';

type InboundCampaignBannerProps = {
  request: InboxRequest;
  onFulfill: () => void;
  t?: (key: string) => string;
};

export function InboundCampaignBanner({ request, onFulfill, t }: InboundCampaignBannerProps) {
  const dueLabel = new Date(request.due_at).toLocaleDateString();
  return (
    <div
      className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950"
      data-testid="inbound-campaign-banner"
    >
      <p className="font-medium">{getInboundCampaignBannerTitle(t)}</p>
      <p className="mt-1">
        {getInboundCampaignBannerMessage(t, {
          fromOrg: request.from_org,
          title: request.title,
          dueDate: dueLabel,
        })}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={onFulfill}>
          {getInboundCampaignBannerCta(t)}
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/">{t?.('workflow.inbox.inbound_banner.later') ?? 'Review dashboard later'}</Link>
        </Button>
      </div>
    </div>
  );
}
