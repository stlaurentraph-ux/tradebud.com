export type BackupCardStatusKind = 'info' | 'success' | 'error';

export type BackupCardStatus = {
  text: string | null;
  kind: BackupCardStatusKind | null;
  /** True when cloud parity hints are folded into `text` (do not render separately). */
  includesParityHints: boolean;
};

/** Drop trailing "tap Sync now …" tails so merged copy does not repeat the CTA. */
export function stripBackupParityCallToAction(hint: string): string {
  return hint.replace(/\s*[—–-]\s*tap Sync now.*$/i, '').trim();
}

function joinParityHints(hints: string[]): string | null {
  const cleaned = hints.map((h) => h.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;
  if (cleaned.length === 1) return cleaned[0]!;
  return cleaned.join(' ');
}

/**
 * One backup-card status line below Sync now — merges parity hints with the last sync outcome.
 */
export function resolveBackupCardStatus(input: {
  cloudParityHints: string[];
  syncMessage: string | null;
  syncMessageKind: BackupCardStatusKind | null;
  isSyncInProgress: boolean;
}): BackupCardStatus {
  if (input.isSyncInProgress) {
    return { text: null, kind: null, includesParityHints: true };
  }

  const parityLine = joinParityHints(input.cloudParityHints);
  const syncMessage = input.syncMessage?.trim() || null;

  if (!parityLine && !syncMessage) {
    return { text: null, kind: null, includesParityHints: false };
  }

  if (!parityLine) {
    return {
      text: syncMessage,
      kind: input.syncMessageKind,
      includesParityHints: false,
    };
  }

  if (!syncMessage) {
    return {
      text: parityLine,
      kind: 'info',
      includesParityHints: false,
    };
  }

  const parityLead = stripBackupParityCallToAction(parityLine);
  const merged = parityLead.endsWith('.')
    ? `${parityLead} ${syncMessage}`
    : `${parityLead}. ${syncMessage}`;

  return {
    text: merged,
    kind: input.syncMessageKind ?? 'info',
    includesParityHints: true,
  };
}
