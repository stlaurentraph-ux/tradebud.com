'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { AuthStatusCard } from '@/components/auth-status-card';

const FIELD_APP_DEEP_LINK_SCHEME = 'tracebudoffline://campaign';

type InvitePreview = {
  title: string;
  fromOrg: string;
  dueAt: string | null;
  deliveryChannel: 'email' | 'whatsapp' | 'desk_only';
  recipientLabel: string;
};

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function CampaignInvitePage() {
  const isClient = useIsClient();
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const { campaignId, claimToken, deepLink } = useMemo(() => {
    if (!isClient) {
      return {
        campaignId: null as string | null,
        claimToken: null as string | null,
        deepLink: null as string | null,
      };
    }
    const params = new URLSearchParams(window.location.search);
    const id = params.get('campaign')?.trim() || params.get('campaignId')?.trim() || null;
    const token = params.get('token')?.trim() || null;
    if (!id) {
      return { campaignId: null, claimToken: token, deepLink: null };
    }
    const target = new URL(FIELD_APP_DEEP_LINK_SCHEME);
    target.searchParams.set('campaign', id);
    if (token) {
      target.searchParams.set('token', token);
    }
    return { campaignId: id, claimToken: token, deepLink: target.toString() };
  }, [isClient]);

  useEffect(() => {
    if (!campaignId || !claimToken) {
      return;
    }
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    if (!apiBase) {
      return;
    }
    let cancelled = false;
    fetch(
      `${apiBase}/v1/public/requests/campaigns/${encodeURIComponent(campaignId)}/invite?token=${encodeURIComponent(claimToken)}`,
      { cache: 'no-store' },
    )
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            typeof body?.message === 'string' ? body.message : 'This invite link is no longer valid.',
          );
        }
        if (!cancelled) {
          setPreview(body.preview as InvitePreview);
          setPreviewError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPreview(null);
          setPreviewError(error instanceof Error ? error.message : 'Unable to load invite details.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [campaignId, claimToken]);

  useEffect(() => {
    if (!deepLink) return;
    window.location.replace(deepLink);
  }, [deepLink]);

  if (!campaignId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <AuthStatusCard
          title="Invite link incomplete"
          detail="This link is missing campaign details. Ask your buyer or cooperative to resend the request."
          error
        />
      </main>
    );
  }

  const footer =
    preview?.deliveryChannel === 'whatsapp'
      ? 'Open Tracebud on the phone that received this WhatsApp message.'
      : 'Sign in with the same email address that received this request.';

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <AuthStatusCard
        title={preview?.title ? `Request: ${preview.title}` : 'Open Tracebud on your phone'}
        detail={
          previewError ??
          (preview
            ? `${preview.fromOrg} asked you to share farm data${preview.dueAt ? ` by ${new Date(preview.dueAt).toLocaleDateString()}` : ''}.`
            : "We're opening the Tracebud field app so you can review what data is being requested and choose what to share.")
        }
        loading={Boolean(deepLink) && !previewError}
        primaryAction={
          deepLink
            ? { label: 'Open Tracebud app', href: deepLink }
            : undefined
        }
        secondaryAction={{ label: 'Install Tracebud', href: 'https://tracebud.com' }}
        footer={footer}
        troubleshoot={
          showTroubleshoot && deepLink
            ? `Manual link: ${deepLink}`
            : undefined
        }
        error={Boolean(previewError)}
      />
      {deepLink && !showTroubleshoot ? (
        <button
          type="button"
          onClick={() => setShowTroubleshoot(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            fontSize: '0.8125rem',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          Having trouble opening the app?
        </button>
      ) : null}
    </main>
  );
}
