import type { AuthSessionResult } from 'expo-auth-session';
import type { AuthSessionOpenOptions, DiscoveryDocument } from 'expo-auth-session';
import type { AuthRequest } from 'expo-auth-session';

import { OAuthFlowError } from '@/features/auth/oauthFlowError';

export const GOOGLE_NATIVE_PROMPT_TIMEOUT_MS = 90_000;

/** Prevent indefinite hangs when Chrome Custom Tabs never settles promptAsync. */
export async function promptAsyncWithTimeout(
  request: AuthRequest,
  discovery: DiscoveryDocument,
  options: AuthSessionOpenOptions | undefined,
  maxMs = GOOGLE_NATIVE_PROMPT_TIMEOUT_MS,
): Promise<AuthSessionResult> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      request.promptAsync(discovery, options),
      new Promise<AuthSessionResult>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new OAuthFlowError('sign_in_oauth_failed', {
              step: 'native_prompt_timeout',
              path: 'native',
            }),
          );
        }, maxMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
