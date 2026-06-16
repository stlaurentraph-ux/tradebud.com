import {
  approveConsentGrant,
  denyConsentGrant,
  revokeConsentGrant,
} from '@/features/api/consentGrants';
import { pingTracebudApi } from '@/features/network/pingTracebudApi';
import {
  deletePendingSyncAction,
  loadPendingSyncActions,
  markPendingSyncAttempt,
  type PendingSyncAction,
} from '@/features/state/persistence';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';

export type ConsentQueueActionType = 'consent_approve' | 'consent_deny' | 'consent_revoke';

export type ProcessPendingConsentQueueResult = {
  completed: number;
  failedActions: number;
  skippedOffline: boolean;
};

type ConsentQueuePayload = {
  grantId: string;
  revocationReason?: string;
};

const CONSENT_ACTION_TYPES = new Set<ConsentQueueActionType>([
  'consent_approve',
  'consent_deny',
  'consent_revoke',
]);

function isConsentActionType(value: string): value is ConsentQueueActionType {
  return CONSENT_ACTION_TYPES.has(value as ConsentQueueActionType);
}

function parsePayload(raw: string): ConsentQueuePayload | null {
  try {
    const parsed = JSON.parse(raw) as ConsentQueuePayload;
    if (!parsed?.grantId || typeof parsed.grantId !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function processPendingConsentQueue(): Promise<ProcessPendingConsentQueueResult> {
  const online = await pingTracebudApi();
  if (!online) {
    return { completed: 0, failedActions: 0, skippedOffline: true };
  }

  let completed = 0;
  let failedActions = 0;
  const actions = (await loadPendingSyncActions())
    .filter(
      (row): row is PendingSyncAction & { actionType: ConsentQueueActionType } =>
        isConsentActionType(row.actionType),
    )
    .sort((a, b) => a.createdAt - b.createdAt);

  for (const row of actions) {
    const payload = parsePayload(row.payloadJson);
    if (!payload) {
      await deletePendingSyncAction(row.id);
      continue;
    }

    const result = await executeConsentQueueRow(row.actionType, payload);
    if (result.ok) {
      await deletePendingSyncAction(row.id);
      completed += 1;
      if (row.actionType === 'consent_approve') {
        trackEvent(ANALYTICS_EVENTS.CONSENT_GRANT_APPROVED, { grantId: payload.grantId, queued: true });
      } else if (row.actionType === 'consent_deny') {
        trackEvent(ANALYTICS_EVENTS.CONSENT_GRANT_DENIED, { grantId: payload.grantId, queued: true });
      } else {
        trackEvent(ANALYTICS_EVENTS.CONSENT_GRANT_REVOKED, { grantId: payload.grantId, queued: true });
      }
      continue;
    }

    failedActions += 1;
    await markPendingSyncAttempt(row.id, {
      attempts: row.attempts + 1,
      lastError: result.message ?? 'consent_queue_failed',
    });
  }

  return { completed, failedActions, skippedOffline: false };
}

async function executeConsentQueueRow(
  actionType: ConsentQueueActionType,
  payload: ConsentQueuePayload,
): Promise<{ ok: boolean; message?: string }> {
  if (actionType === 'consent_approve') {
    return approveConsentGrant(payload.grantId);
  }
  if (actionType === 'consent_deny') {
    return denyConsentGrant(payload.grantId);
  }
  return revokeConsentGrant(payload.grantId, payload.revocationReason?.trim() || 'Revoked offline');
}

export function consentQueueActionTypeForVerb(
  verb: 'approve' | 'deny' | 'revoke',
): ConsentQueueActionType {
  if (verb === 'approve') return 'consent_approve';
  if (verb === 'deny') return 'consent_deny';
  return 'consent_revoke';
}

export function isConsentPendingSyncAction(row: PendingSyncAction): boolean {
  return isConsentActionType(row.actionType);
}
