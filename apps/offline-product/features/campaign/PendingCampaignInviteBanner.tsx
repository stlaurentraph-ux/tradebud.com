import { CampaignInvitePromptCard } from '@/features/campaign/CampaignInvitePromptCard';
import { useCampaignInvitePreview } from '@/features/campaign/useCampaignInvitePreview';

type PendingCampaignInviteBannerProps = {
  campaignId: string;
  isSignedIn: boolean;
  onDismiss: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

export function PendingCampaignInviteBanner(props: PendingCampaignInviteBannerProps) {
  const { preview, loading } = useCampaignInvitePreview(props.campaignId);
  return (
    <CampaignInvitePromptCard
      {...props}
      preview={preview}
      loading={loading}
    />
  );
}
