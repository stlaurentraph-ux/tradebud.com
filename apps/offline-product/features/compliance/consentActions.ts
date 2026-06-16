import type { ConsentGrant, ConsentGrantStatus } from '@/features/api/consentGrants';
import {
  approveConsentGrant,
  denyConsentGrant,
  revokeConsentGrant,
} from '@/features/api/consentGrants';
import { pingTracebudApi } from '@/features/network/pingTracebudApi';
import { consentQueueActionTypeForVerb } from '@/features/sync/processPendingConsentQueue';
import { enqueuePendingSync } from '@/features/state/persistence';

export type ConsentActionVerb = 'approve' | 'deny' | 'revoke';

export type ConsentActionResult =
  | { ok: true; queued: boolean }
  | { ok: false; message?: string };

function optimisticStatus(verb: ConsentActionVerb): ConsentGrantStatus {
  if (verb === 'approve') return 'active';
  if (verb === 'deny') return 'denied';
  return 'revoked';
}

export function applyOptimisticConsentStatus(
  items: ConsentGrant[],
  grantId: string,
  verb: ConsentActionVerb,
): ConsentGrant[] {
  const nextStatus = optimisticStatus(verb);
  const now = new Date().toISOString();
  return items.map((grant) =>
    grant.id === grantId
      ? {
          ...grant,
          status: nextStatus,
          granted_at: verb === 'approve' ? now : grant.granted_at,
          revoked_at: verb === 'revoke' ? now : grant.revoked_at,
        }
      : grant,
  );
}

export async function performConsentAction(params: {
  verb: ConsentActionVerb;
  grantId: string;
  revocationReason?: string;
}): Promise<ConsentActionResult> {
  const online = await pingTracebudApi();
  if (!online) {
    await enqueuePendingSync({
      createdAt: Date.now(),
      actionType: consentQueueActionTypeForVerb(params.verb),
      payloadJson: JSON.stringify({
        grantId: params.grantId,
        revocationReason: params.revocationReason,
      }),
      lastError: null,
    });
    return { ok: true, queued: true };
  }

  let res: { ok: boolean; message?: string };
  if (params.verb === 'approve') {
    res = await approveConsentGrant(params.grantId);
  } else if (params.verb === 'deny') {
    res = await denyConsentGrant(params.grantId);
  } else {
    res = await revokeConsentGrant(params.grantId, params.revocationReason ?? '');
  }

  if (!res.ok && (res.message?.includes('Network') || res.message?.includes('fetch'))) {
    await enqueuePendingSync({
      createdAt: Date.now(),
      actionType: consentQueueActionTypeForVerb(params.verb),
      payloadJson: JSON.stringify({
        grantId: params.grantId,
        revocationReason: params.revocationReason,
      }),
      lastError: null,
    });
    return { ok: true, queued: true };
  }

  if (!res.ok) {
    return { ok: false, message: res.message };
  }
  return { ok: true, queued: false };
}
