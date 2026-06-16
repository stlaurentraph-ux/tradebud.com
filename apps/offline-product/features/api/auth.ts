/**
 * Authentication API module — delegates to syncAuthSession (password + OAuth).
 */

export {
  clearPersistedSyncAuth,
  getAccessTokenFromSupabase,
  getAuthenticatedSupabaseClient,
  getAuthenticatedSupabaseUserId,
  getAuthCredentials,
  getSupabaseAuthClient,
  getSyncAuthMethod,
  hasSyncAuthSession,
  hydrateSyncAuthFromSettings,
  saveAndApplyOAuthSyncAuth,
  saveAndApplySyncAuth,
  setAuthCredentials,
  testBackendLogin,
} from './syncAuthSession';
