type BrowserStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function durableStore(): BrowserStore | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function legacyStore(): BrowserStore | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

/** Read onboarding UI flags from localStorage, migrating any legacy sessionStorage value. */
export function readOnboardingFlag(key: string): string | null {
  const durable = durableStore();
  if (!durable) return null;

  const fromLocal = durable.getItem(key);
  if (fromLocal !== null) return fromLocal;

  const legacy = legacyStore();
  if (!legacy) return null;

  const fromSession = legacy.getItem(key);
  if (fromSession !== null) {
    durable.setItem(key, fromSession);
    legacy.removeItem(key);
  }
  return fromSession;
}

export function writeOnboardingFlag(key: string, value: string): void {
  const durable = durableStore();
  if (!durable) return;
  durable.setItem(key, value);
  legacyStore()?.removeItem(key);
}

export function removeOnboardingFlag(key: string): void {
  durableStore()?.removeItem(key);
  legacyStore()?.removeItem(key);
}

export function getWelcomeAckKey(userId: string): string {
  return `tracebud_welcome_ack_${userId}`;
}

export function isWelcomeAcknowledged(userId: string): boolean {
  return readOnboardingFlag(getWelcomeAckKey(userId)) === '1';
}

export function acknowledgeWelcome(userId: string): void {
  writeOnboardingFlag(getWelcomeAckKey(userId), '1');
}
