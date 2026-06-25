import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';

const mocks = vi.hoisted(() => ({
  promptAsync: vi.fn(),
  exchangeCodeAsync: vi.fn(),
  dismissOAuthBrowserIfOpen: vi.fn(async () => undefined),
  captureGoogleNativeOAuthCode: vi.fn(),
  signInWithIdToken: vi.fn(),
}));

vi.mock('expo-crypto', () => ({
  randomUUID: () => 'raw-nonce',
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  digestStringAsync: vi.fn(async () => 'hashed-nonce'),
}));

vi.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: vi.fn(),
}));

vi.mock('expo-auth-session', () => ({
  AuthRequest: vi.fn().mockImplementation(() => ({
    promptAsync: mocks.promptAsync,
    codeVerifier: 'verifier',
  })),
  ResponseType: { Code: 'code' },
  exchangeCodeAsync: mocks.exchangeCodeAsync,
}));

vi.mock('@/features/auth/googleOAuthConfig', () => ({
  getGoogleOAuthClientIds: () => ({
    webClientId: 'web.apps.googleusercontent.com',
    clientId: 'android.apps.googleusercontent.com',
  }),
  getGoogleOAuthRedirectUri: () => 'com.googleusercontent.apps.android:/oauth2redirect',
}));

vi.mock('@/features/auth/oauthBrowserSessionOptions', () => ({
  getOAuthBrowserSessionOptions: () => ({ createTask: false, showInRecents: false }),
}));

vi.mock('@/features/auth/promptAsyncWithTimeout', () => ({
  promptAsyncWithTimeout: (
    request: { promptAsync: typeof mocks.promptAsync },
    discovery: unknown,
    options: unknown,
  ) => request.promptAsync(discovery, options),
}));

vi.mock('@/features/auth/googleNativeOAuthRedirect', () => ({
  captureGoogleNativeOAuthCode: mocks.captureGoogleNativeOAuthCode,
}));

vi.mock('@/features/auth/dismissOAuthBrowser', () => ({
  dismissOAuthBrowserIfOpen: mocks.dismissOAuthBrowserIfOpen,
}));

vi.mock('@/features/auth/oauthTelemetry', () => ({
  trackOAuthStep: vi.fn(),
}));

vi.mock('@/features/auth/oauthDiagnosticsStore', () => ({
  recordOAuthDiagnosticEvent: vi.fn(),
}));

vi.mock('@/features/auth/oauthRuntimeDiagnostics', () => ({
  logOAuthRuntimeDiagnostics: vi.fn(),
}));

vi.mock('@/features/api/syncAuthSession', () => ({
  getSupabaseAuthClient: () => ({
    auth: { signInWithIdToken: mocks.signInWithIdToken },
  }),
}));

import { signInWithGoogleNative } from './googleSignIn.native';

describe('signInWithGoogleNative', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.captureGoogleNativeOAuthCode.mockReturnValue({
      waitForCode: vi.fn(async () => 'recovered-code'),
      cancel: vi.fn(),
    });
    mocks.exchangeCodeAsync.mockResolvedValue({
      idToken: 'id-token',
      accessToken: 'access-token',
    });
    mocks.signInWithIdToken.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } as Session },
      error: null,
    });
  });

  it('uses promptAsync browser options that keep OAuth in the app task', async () => {
    mocks.promptAsync.mockResolvedValue({
      type: 'success',
      params: { code: 'direct-code' },
    });

    await signInWithGoogleNative();

    expect(mocks.promptAsync).toHaveBeenCalledWith(
      expect.any(Object),
      { createTask: false, showInRecents: false },
    );
    expect(mocks.dismissOAuthBrowserIfOpen).toHaveBeenCalled();
    expect(mocks.exchangeCodeAsync).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'direct-code' }),
      expect.any(Object),
    );
  });

  it('recovers auth code from oauth2redirect when promptAsync dismisses on Android', async () => {
    mocks.promptAsync.mockResolvedValue({ type: 'dismiss' });
    const waitForCode = vi.fn(async () => 'recovered-code');
    const cancel = vi.fn();
    mocks.captureGoogleNativeOAuthCode.mockReturnValue({ waitForCode, cancel });

    await signInWithGoogleNative();

    expect(waitForCode).toHaveBeenCalled();
    expect(cancel).toHaveBeenCalled();
    expect(mocks.exchangeCodeAsync).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'recovered-code' }),
      expect.any(Object),
    );
  });
});
