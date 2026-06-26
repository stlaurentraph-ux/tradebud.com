/**
 * Stub for the platform-native OAuth sign-in providers in the vitest (node)
 * environment.
 *
 * `oauthOrchestrator.ts` statically imports `appleSignIn.native` and
 * `googleSignIn.native` via their `@/features/auth/...native` specifiers. Those
 * modules pull the native-only Expo tree (expo-apple-authentication ships JSX
 * the vite transform cannot parse, expo-web-browser runs a top-level native
 * side effect, etc.). Logic tests never invoke native sign-in, so the
 * orchestrator's import is aliased to this stub.
 *
 * This alias is keyed on the `@/...` specifier only; the dedicated
 * `googleSignIn.native.test.ts` imports the real module via its relative path
 * (`./googleSignIn.native`) and is therefore unaffected.
 */
import type { Session } from '@supabase/supabase-js';

const notAvailable = (): Promise<Session> => {
  throw new Error('Native OAuth sign-in is not available in the test environment');
};

export const signInWithAppleNative = notAvailable;
export const signInWithGoogleNative = notAvailable;
