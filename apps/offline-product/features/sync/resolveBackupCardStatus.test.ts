import { describe, expect, it } from 'vitest';

import {
  resolveBackupCardStatus,
  stripBackupParityCallToAction,
} from './resolveBackupCardStatus';

describe('stripBackupParityCallToAction', () => {
  it('removes trailing tap Sync now guidance', () => {
    expect(
      stripBackupParityCallToAction(
        'Producer or plot declarations on Tracebud are not on this device — tap Sync now to restore.',
      ),
    ).toBe('Producer or plot declarations on Tracebud are not on this device');
  });
});

describe('resolveBackupCardStatus', () => {
  const parity = [
    'Producer or plot declarations on Tracebud are not on this device — tap Sync now to restore.',
  ];
  const timeout =
    "Sync didn't finish in time. Your data is still saved on this device — tap Sync now when your connection is stronger.";

  it('returns parity only when there is no sync outcome', () => {
    expect(
      resolveBackupCardStatus({
        cloudParityHints: parity,
        syncMessage: null,
        syncMessageKind: null,
        isSyncInProgress: false,
      }),
    ).toEqual({
      text: parity[0],
      kind: 'info',
      includesParityHints: false,
    });
  });

  it('merges parity and timeout error into one line', () => {
    const result = resolveBackupCardStatus({
      cloudParityHints: parity,
      syncMessage: timeout,
      syncMessageKind: 'error',
      isSyncInProgress: false,
    });
    expect(result.includesParityHints).toBe(true);
    expect(result.kind).toBe('error');
    expect(result.text).toBe(
      'Producer or plot declarations on Tracebud are not on this device. Sync didn\'t finish in time. Your data is still saved on this device — tap Sync now when your connection is stronger.',
    );
  });

  it('hides status while sync is in progress', () => {
    expect(
      resolveBackupCardStatus({
        cloudParityHints: parity,
        syncMessage: timeout,
        syncMessageKind: 'error',
        isSyncInProgress: true,
      }),
    ).toEqual({
      text: null,
      kind: null,
      includesParityHints: true,
    });
  });

  it('returns sync outcome only when parity is clear', () => {
    expect(
      resolveBackupCardStatus({
        cloudParityHints: [],
        syncMessage: 'All caught up.',
        syncMessageKind: 'success',
        isSyncInProgress: false,
      }),
    ).toEqual({
      text: 'All caught up.',
      kind: 'success',
      includesParityHints: false,
    });
  });
});
