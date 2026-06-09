// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  acknowledgeWelcome,
  isWelcomeAcknowledged,
  readOnboardingFlag,
} from './onboarding-persistence';

describe('onboarding-persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('migrates legacy sessionStorage flags into localStorage', () => {
    window.sessionStorage.setItem('tracebud_ob_skipped_user_1', '1');

    expect(readOnboardingFlag('tracebud_ob_skipped_user_1')).toBe('1');
    expect(window.localStorage.getItem('tracebud_ob_skipped_user_1')).toBe('1');
    expect(window.sessionStorage.getItem('tracebud_ob_skipped_user_1')).toBeNull();
  });

  it('persists welcome acknowledgement across reconnects', () => {
    expect(isWelcomeAcknowledged('user_1')).toBe(false);
    acknowledgeWelcome('user_1');
    expect(isWelcomeAcknowledged('user_1')).toBe(true);
  });
});
