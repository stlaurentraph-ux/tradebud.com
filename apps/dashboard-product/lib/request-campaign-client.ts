import { parseBackendErrorMessage } from '@/lib/request-campaign-payload';

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? window.sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function sendRequestCampaign(campaignId: string): Promise<void> {
  const response = await fetch(`/api/requests/campaigns/${encodeURIComponent(campaignId)}/send`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseBackendErrorMessage(body, 'Failed to send campaign.'));
  }
}

export async function archiveRequestCampaign(campaignId: string): Promise<void> {
  const response = await fetch(`/api/requests/campaigns/${encodeURIComponent(campaignId)}/archive`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseBackendErrorMessage(body, 'Failed to archive campaign.'));
  }
}

export async function resendCampaignRecipientInvite(
  campaignId: string,
  recipientEmail: string,
): Promise<void> {
  const response = await fetch(
    `/api/requests/campaigns/${encodeURIComponent(campaignId)}/recipients/resend`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ recipient_email: recipientEmail }),
    },
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseBackendErrorMessage(body, 'Failed to resend invite.'));
  }
}
