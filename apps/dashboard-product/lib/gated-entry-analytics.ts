export type DeferredGateKey = 'request_campaigns' | 'annual_reporting';

export interface GatedEntryContext {
  feature: 'mvp_gated';
  gate: DeferredGateKey;
}

const ALLOWED_GATES: readonly DeferredGateKey[] = ['request_campaigns', 'annual_reporting'] as const;

export function getGatedEntryContext(
  feature: string | null,
  gate: string | null,
): GatedEntryContext | null {
  if (feature !== 'mvp_gated' || !gate) {
    return null;
  }
  if (!ALLOWED_GATES.includes(gate as DeferredGateKey)) {
    return null;
  }
  return {
    feature: 'mvp_gated',
    gate: gate as DeferredGateKey,
  };
}

export function getGatedEntrySessionKey(context: GatedEntryContext): string {
  return `tb:gated-entry:${context.feature}:${context.gate}`;
}
