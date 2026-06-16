import { describe, expect, it } from 'vitest';
import {
  getVirginStateHeadingCopy,
  getVirginStateShellCopy,
  getVirginStateStepCopy,
  getVirginStepsForRole,
  VIRGIN_STEP_IDS,
} from '@/lib/virgin-state-copy';
import { getVirginStepCount } from '@/lib/virgin-state-progress';

describe('virgin-state-copy', () => {
  it('aligns step ids with virgin progress counts', () => {
    for (const role of Object.keys(VIRGIN_STEP_IDS) as Array<keyof typeof VIRGIN_STEP_IDS>) {
      expect(VIRGIN_STEP_IDS[role].length).toBe(getVirginStepCount(role));
    }
  });

  it('returns sponsor virgin heading fallback', () => {
    expect(getVirginStateHeadingCopy('sponsor', 'title')).toBe('Build your sponsor oversight network');
  });

  it('builds localized virgin steps with hrefs', () => {
    const steps = getVirginStepsForRole('exporter');
    expect(steps).toHaveLength(4);
    expect(steps[0].title).toBe('Register producers');
    expect(steps[0].href).toBe('/farmers/new');
    expect(getVirginStateStepCopy('sponsor', 'invite_contacts', 'ctaLabel')).toBe('Invite contact');
  });

  it('interpolates virgin shell progress copy', () => {
    expect(getVirginStateShellCopy('step_progress', undefined, { current: 2, total: 4 })).toBe('Step 2 of 4');
    expect(getVirginStateShellCopy('unlocks_after', undefined, { step: 1 })).toBe('Unlocks after step 1');
  });
});
