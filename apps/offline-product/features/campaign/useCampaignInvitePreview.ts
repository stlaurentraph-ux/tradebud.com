import { useCallback, useEffect, useState } from 'react';

import { fetchAndCacheCampaignInvitePreview } from '@/features/campaign/fetchAndCacheCampaignInvitePreview';
import {
  readPendingCampaignInvitePreview,
  type CampaignInvitePreview,
} from '@/features/campaign/campaignInviteContext';

export function useCampaignInvitePreview(campaignId: string | null | undefined) {
  const [preview, setPreview] = useState<CampaignInvitePreview | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const id = campaignId?.trim();
    if (!id) {
      setPreview(null);
      return null;
    }
    const cached = await readPendingCampaignInvitePreview();
    if (cached?.campaignId === id) {
      setPreview(cached);
    }
    setLoading(true);
    try {
      const claimToken = await readPendingCampaignClaimToken();
      const fetched = await fetchAndCacheCampaignInvitePreview(id, claimToken);
      if (fetched) {
        setPreview(fetched);
        return fetched;
      }
      return cached?.campaignId === id ? cached : null;
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { preview, loading, refresh };
}
