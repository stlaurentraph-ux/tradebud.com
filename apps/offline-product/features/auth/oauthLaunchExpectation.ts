import { getSetting, setSetting } from '@/features/state/persistence';

const OAUTH_LAUNCH_EXPECTED_KEY = 'oauth_launch_expected';

let memoryOAuthLaunchExpected = false;

/** Set when browser/native OAuth starts — cleared when OAuth finishes or fails. */
export function markOAuthLaunchExpected(): void {
  memoryOAuthLaunchExpected = true;
  void setSetting(OAUTH_LAUNCH_EXPECTED_KEY, '1').catch(() => undefined);
}

export async function clearOAuthLaunchExpected(): Promise<void> {
  memoryOAuthLaunchExpected = false;
  await setSetting(OAUTH_LAUNCH_EXPECTED_KEY, '0').catch(() => undefined);
}

/** True while an OAuth flow is in flight (memory or persisted across process death). */
export async function isOAuthLaunchExpected(): Promise<boolean> {
  if (memoryOAuthLaunchExpected) return true;
  return (await getSetting(OAUTH_LAUNCH_EXPECTED_KEY)) === '1';
}

/** @internal Vitest only */
export function __resetOAuthLaunchExpectationForTests(): void {
  memoryOAuthLaunchExpected = false;
}
