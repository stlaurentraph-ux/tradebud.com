'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { AuthStatusCard } from '@/components/auth-status-card';

const FIELD_APP_DEEP_LINK_SCHEME = 'tracebudoffline://campaign';

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
  const { campaignId, deepLink } = useMemo(() => {
    if (!isClient) {
      return { campaignId: null as string | null, deepLink: null as string | null };
    }
    const params = new URLSearchParams(window.location.search);
    const id = params.get('campaign')?.trim() || params.get('campaignId')?.trim() || null;
    if (!id) {
      return { campaignId: null, deepLink: null };
    }
    const target = new URL(FIELD_APP_DEEP_LINK_SCHEME);
    target.searchParams.set('campaign', id);
    return { campaignId: id, deepLink: target.toString() };
  }, [isClient]);

  useEffect(() => {
    if (!deepLink) return;
    window.location.replace(deepLink);
  }, [deepLink]);

  if (!campaignId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <AuthStatusCard
          title="Invite link incomplete"
          detail="This link is missing campaign details. Ask your buyer or cooperative to resend the request email."
          error
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <AuthStatusCard
        title="Open Tracebud on your phone"
        detail="We're opening the Tracebud field app so you can review what data is being requested and choose what to share."
        loading={Boolean(deepLink)}
        primaryAction={
          deepLink
            ? { label: 'Open Tracebud app', href: deepLink }
            : undefined
        }
        secondaryAction={{ label: 'Install Tracebud', href: 'https://tracebud.com' }}
        footer="Sign in with the same email address that received this request."
        troubleshoot={
          showTroubleshoot && deepLink
            ? `Manual link: ${deepLink}`
            : undefined
        }
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
