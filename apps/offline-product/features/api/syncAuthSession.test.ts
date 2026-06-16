import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/security/syncAuthStorage', () => ({
  clearSyncAuthCredentials: vi.fn(async () => undefined),
  loadSyncAuthCredentials: vi.fn(async () => null),
  saveOAuthSyncAuthCredentials: vi.fn(async () => undefined),
  saveSyncAuthCredentials: vi.fn(async () => undefined),
}));

import {
  clearPersistedSyncAuth,
  getSyncAuthMethod,
  hasSyncAuthSession,
  saveAndApplyOAuthSyncAuth,
  setAuthCredentials,
} from './syncAuthSession';

describe('syncAuthSession', () => {
  beforeEach(async () => {
    await clearPersistedSyncAuth();
  });

  it('hasSyncAuthSession is false when cleared', () => {
    expect(hasSyncAuthSession()).toBe(false);
    expect(getSyncAuthMethod()).toBeNull();
  });

  it('hasSyncAuthSession is true after password credentials are set', () => {
    setAuthCredentials('farmer@example.com', 'secret');
    expect(hasSyncAuthSession()).toBe(true);
    expect(getSyncAuthMethod()).toBe('password');
  });

  it('hasSyncAuthSession is true after OAuth credentials are saved', async () => {
    await saveAndApplyOAuthSyncAuth('farmer@example.com', 'refresh-token-abc');
    expect(hasSyncAuthSession()).toBe(true);
    expect(getSyncAuthMethod()).toBe('oauth');
  });

  it('clears password and OAuth session state', async () => {
    await saveAndApplyOAuthSyncAuth('farmer@example.com', 'refresh-token-abc');
    await clearPersistedSyncAuth();
    expect(hasSyncAuthSession()).toBe(false);
    expect(getSyncAuthMethod()).toBeNull();
  });
});
