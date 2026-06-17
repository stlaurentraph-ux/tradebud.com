import { beforeEach, describe, expect, it, vi } from 'vitest';

let dismissedOnDevice = false;

vi.mock('@/features/security/syncAuthStorage', () => ({
  clearSyncAuthCredentials: vi.fn(async () => {
    dismissedOnDevice = true;
  }),
  isSyncAuthDismissedOnDevice: vi.fn(async () => dismissedOnDevice),
  loadSyncAuthCredentials: vi.fn(async () => null),
  saveOAuthSyncAuthCredentials: vi.fn(async () => {
    if (dismissedOnDevice) return;
  }),
  saveSyncAuthCredentials: vi.fn(async () => {
    if (dismissedOnDevice) return;
  }),
  activateSyncAuthOnSignIn: vi.fn(async () => {
    dismissedOnDevice = false;
  }),
}));

import {
  clearPersistedSyncAuth,
  getSyncAuthMethod,
  hasSyncAuthSession,
  hydrateSyncAuthFromSettings,
  saveAndApplySyncAuth,
  saveAndApplyOAuthSyncAuth,
  setAuthCredentials,
} from './syncAuthSession';

describe('syncAuthSession', () => {
  beforeEach(async () => {
    dismissedOnDevice = false;
    await clearPersistedSyncAuth();
    dismissedOnDevice = false;
  });

  it('hasSyncAuthSession is false when cleared', () => {
    expect(hasSyncAuthSession()).toBe(false);
    expect(getSyncAuthMethod()).toBeNull();
  });

  it('hasSyncAuthSession is true after password credentials are set', async () => {
    await saveAndApplySyncAuth('farmer@example.com', 'secret');
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

  it('hydrate clears memory when secure storage is empty', async () => {
    setAuthCredentials('farmer@example.com', 'secret');
    const { loadSyncAuthCredentials } = await import('@/features/security/syncAuthStorage');
    vi.mocked(loadSyncAuthCredentials).mockResolvedValueOnce(null);
    await hydrateSyncAuthFromSettings();
    expect(hasSyncAuthSession()).toBe(false);
  });

  it('stays signed out after clear even if legacy memory credentials linger', async () => {
    await saveAndApplyOAuthSyncAuth('farmer@example.com', 'refresh-token-abc');
    await clearPersistedSyncAuth();
    setAuthCredentials('farmer@example.com', 'secret');
    expect(hasSyncAuthSession()).toBe(false);
  });

  it('does not re-hydrate OAuth credentials after sign-out token rotation save', async () => {
    const storage = await import('@/features/security/syncAuthStorage');
    await saveAndApplyOAuthSyncAuth('farmer@example.com', 'refresh-token-abc');
    await clearPersistedSyncAuth();
    await storage.saveOAuthSyncAuthCredentials('farmer@example.com', 'rotated-token');
    await hydrateSyncAuthFromSettings();
    expect(hasSyncAuthSession()).toBe(false);
  });

  it('can sign in again after device sign-out cleared the dismissed latch', async () => {
    const storage = await import('@/features/security/syncAuthStorage');
    await saveAndApplyOAuthSyncAuth('farmer@example.com', 'refresh-token-abc');
    await clearPersistedSyncAuth();
    dismissedOnDevice = true;
    await saveAndApplyOAuthSyncAuth('farmer@example.com', 'refresh-token-next');
    expect(hasSyncAuthSession()).toBe(true);
    expect(getSyncAuthMethod()).toBe('oauth');
    expect(storage.activateSyncAuthOnSignIn).toHaveBeenCalled();
  });

  it('bumps auth UI generation on sign-out so stale refresh work can abort', async () => {
    const { getAuthUiGeneration } = await import('./syncAuthSession');
    const before = getAuthUiGeneration();
    await saveAndApplyOAuthSyncAuth('farmer@example.com', 'refresh-token-abc');
    await clearPersistedSyncAuth();
    expect(getAuthUiGeneration()).toBeGreaterThan(before);
  });
});
