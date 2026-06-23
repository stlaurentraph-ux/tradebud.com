export type HarvestBuyerInvite = {
  email: string;
  pending: boolean;
  inviteSent: boolean;
};

export function readHarvestSubmitBuyerInvite(response: unknown): HarvestBuyerInvite | null {
  if (!response || typeof response !== 'object') return null;
  const row = response as { buyerInvite?: unknown };
  const invite = row.buyerInvite;
  if (!invite || typeof invite !== 'object') return null;
  const payload = invite as {
    email?: unknown;
    pending?: unknown;
    inviteSent?: unknown;
  };
  const email = String(payload.email ?? '').trim();
  if (!email || payload.pending !== true) return null;
  return {
    email,
    pending: true,
    inviteSent: payload.inviteSent === true,
  };
}
