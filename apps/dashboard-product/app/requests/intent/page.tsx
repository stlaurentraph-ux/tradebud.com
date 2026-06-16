'use client';

import { useContext, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { LocaleContext } from '@/lib/locale-context';
import { getRequestIntentCopy } from '@/lib/request-intent-copy';

type CampaignDecision = 'accept' | 'refuse';

const STORAGE_KEY = 'tracebud_pending_request_decision_intent';

export default function RequestDecisionIntentPage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    const campaignId = searchParams.get('campaign')?.trim() ?? '';
    const decisionRaw = searchParams.get('decision')?.trim().toLowerCase();
    const recipientEmail = searchParams.get('recipient')?.trim() ?? '';
    const token = searchParams.get('token')?.trim() ?? '';
    const decision: CampaignDecision | null =
      decisionRaw === 'accept' || decisionRaw === 'refuse' ? decisionRaw : null;

    if (campaignId && decision) {
      const payload = {
        campaignId,
        decision,
        recipientEmail: recipientEmail || undefined,
        token: token || undefined,
        capturedAt: new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
      void (async () => {
        let recordedDirectly = false;
        if (recipientEmail && token) {
          try {
            const response = await fetch('/api/requests/campaigns/decision-intent/public', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                campaignId,
                decision,
                recipientEmail,
                token,
              }),
            });
            if (response.ok && typeof window !== 'undefined') {
              window.sessionStorage.removeItem(STORAGE_KEY);
              recordedDirectly = true;
            }
          } catch {
            // Keep pending intent in session for post-login reconciliation.
          }
        }
        if (cancelled) return;
        const nextTarget = `/outreach?campaign=${encodeURIComponent(campaignId)}&decision=${encodeURIComponent(decision)}${recipientEmail ? `&recipient=${encodeURIComponent(recipientEmail)}` : ''}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
        router.replace(
          `/login?next=${encodeURIComponent(nextTarget)}&intent=${encodeURIComponent(decision)}&campaign=${encodeURIComponent(campaignId)}${recordedDirectly ? '&recorded=1' : ''}`,
        );
      })();
      return;
    }
    router.replace('/outreach');
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-foreground">{getRequestIntentCopy('loading_title', t)}</h1>
        <p className="text-sm text-muted-foreground">{getRequestIntentCopy('loading_description', t)}</p>
      </div>
    </div>
  );
}
