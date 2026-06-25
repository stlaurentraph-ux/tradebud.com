#!/usr/bin/env node
/**
 * Ensures OAuth logic is centralized in oauthOrchestrator (single state machine entry point).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function main() {
  const issues = [];
  const orchestrator = read('features/auth/oauthOrchestrator.ts');
  const signIn = read('features/auth/oauthSignIn.ts');
  const bridge = read('features/auth/oauthCallbackBridge.ts');
  const signInSheet = read('features/auth/SignInSheetContext.tsx');
  const callback = read('app/auth/callback.tsx');
  const syncAuth = read('features/api/syncAuthSession.ts');

  const orchestratorOnlyExports = [
    'runOAuthSignIn',
    'completeOAuthFromDeepLink',
    'runOAuthColdStartCallback',
    'clearOAuthOrchestratorState',
  ];
  const waiterReExports = ['deliverOAuthDeepLink', 'beginOAuthCallbackWait'];

  function hasDirectExport(name) {
    return (
      orchestrator.includes(`export function ${name}`) ||
      orchestrator.includes(`export async function ${name}`)
    );
  }

  for (const name of orchestratorOnlyExports) {
    if (!hasDirectExport(name)) {
      issues.push(`oauthOrchestrator.ts must export ${name}`);
    }
  }

  for (const name of waiterReExports) {
    const reExported =
      orchestrator.includes(`export {`) &&
      orchestrator.includes(name) &&
      orchestrator.includes("from '@/features/auth/oauthCallbackWaiter'");
    if (!hasDirectExport(name) && !reExported) {
      issues.push(`oauthOrchestrator.ts must export ${name}`);
    }
  }

  if (!signIn.includes('runOAuthSignIn as signInWithOAuthProvider')) {
    issues.push('oauthSignIn.ts must re-export runOAuthSignIn as signInWithOAuthProvider');
  }
  if (signIn.split('\n').length > 5) {
    issues.push('oauthSignIn.ts must remain a thin re-export wrapper');
  }

  if (!bridge.includes("from '@/features/auth/oauthCallbackWaiter'")) {
    issues.push('oauthCallbackBridge.ts must re-export from oauthCallbackWaiter');
  }

  if (!orchestrator.includes('shouldAllowGoogleNativeBrowserFallback')) {
    issues.push('oauthOrchestrator.ts must delegate browser fallback to oauthOrchestratorPolicy');
  }
  if (!fs.existsSync(path.join(root, 'features/auth/oauthOrchestratorPolicy.ts'))) {
    issues.push('missing features/auth/oauthOrchestratorPolicy.ts');
  }

  if (!fs.existsSync(path.join(root, 'features/auth/oauthCallbackWaiter.ts'))) {
    issues.push('missing features/auth/oauthCallbackWaiter.ts');
  }

  if (!signInSheet.includes('isOAuthProviderSignInInFlight')) {
    issues.push('SignInSheetContext must defer deep links while isOAuthProviderSignInInFlight');
  }
  if (!signInSheet.includes('completeOAuthFromDeepLink')) {
    issues.push('SignInSheetContext must use completeOAuthFromDeepLink for warm deep links');
  }
  if (!orchestrator.includes('isOAuthProviderSignInInFlight')) {
    issues.push('oauthOrchestrator.ts must export isOAuthProviderSignInInFlight');
  }
  if (!signInSheet.includes('isGoogleNativeOAuthRedirectUrl')) {
    issues.push('SignInSheetContext must dismiss browser on Google native oauth2redirect deep links');
  }
  if (signInSheet.includes('sessionFromOAuthCallbackUrl')) {
    issues.push('SignInSheetContext must not call sessionFromOAuthCallbackUrl directly');
  }

  if (!callback.includes('runOAuthColdStartCallback')) {
    issues.push('auth/callback.tsx must use runOAuthColdStartCallback');
  }
  if (!fs.existsSync(path.join(root, 'features/auth/oauthColdStartLaunch.ts'))) {
    issues.push('missing features/auth/oauthColdStartLaunch.ts');
  }
  if (!callback.includes('shouldExitOAuthIntermediaryScreen')) {
    issues.push('auth/callback.tsx must exit intermediary screen via oauthColdStartLaunch');
  }
  if (!callback.includes('resolveOAuthColdStartUrl')) {
    issues.push('auth/callback.tsx must poll for cold-start OAuth URL via resolveOAuthColdStartUrl');
  }
  if (!callback.includes('hasActiveOAuthCallbackWaiter')) {
    issues.push('auth/callback.tsx must defer to in-flight browser OAuth via hasActiveOAuthCallbackWaiter');
  }
  if (!callback.includes('probeOAuthColdStartLaunchKind')) {
    issues.push('auth/callback.tsx must probe stale /auth/callback routes via probeOAuthColdStartLaunchKind');
  }
  if (!fs.existsSync(path.join(root, 'features/auth/oauthLaunchExpectation.ts'))) {
    issues.push('missing features/auth/oauthLaunchExpectation.ts');
  }
  if (!fs.existsSync(path.join(root, 'components/layout/LauncherRouteReset.tsx'))) {
    issues.push('missing components/layout/LauncherRouteReset.tsx');
  }
  if (!read('app/_layout.tsx').includes('LauncherRouteReset')) {
    issues.push('app/_layout.tsx must mount LauncherRouteReset for stale Android route restore');
  }
  if (!fs.existsSync(path.join(root, 'features/auth/resolveOAuthColdStartUrl.ts'))) {
    issues.push('missing features/auth/resolveOAuthColdStartUrl.ts');
  }

  const googleNative = read('features/auth/googleSignIn.native.ts');
  if (!googleNative.includes('promptAsyncWithTimeout')) {
    issues.push('googleSignIn.native.ts must use promptAsyncWithTimeout to avoid hung CCT');
  }

  if (!orchestrator.includes('getOAuthBrowserSessionOptions')) {
    issues.push('oauthOrchestrator.ts must use getOAuthBrowserSessionOptions for browser OAuth');
  }
  if (!fs.existsSync(path.join(root, 'features/auth/oauthBrowserSessionOptions.ts'))) {
    issues.push('missing features/auth/oauthBrowserSessionOptions.ts');
  }
  if (!fs.existsSync(path.join(root, 'features/auth/googleNativeOAuthRedirect.ts'))) {
    issues.push('missing features/auth/googleNativeOAuthRedirect.ts');
  }
  if (!fs.existsSync(path.join(root, 'features/auth/androidGoogleOAuthCapability.ts'))) {
    issues.push('missing features/auth/androidGoogleOAuthCapability.ts');
  }
  if (!orchestrator.includes('resolveAndroidGoogleOAuthRedirectHandlerInstalled')) {
    issues.push('oauthOrchestrator.ts must probe installed APK for Google oauth2redirect handler');
  }
  const orchestratorPolicy = read('features/auth/oauthOrchestratorPolicy.ts');
  if (!orchestratorPolicy.includes('androidNativeRedirectInstalled')) {
    issues.push('oauthOrchestratorPolicy must allow Android browser fallback when oauth2redirect is missing from APK');
  }

  if (!syncAuth.includes('clearOAuthOrchestratorState')) {
    issues.push('syncAuthSession must clear oauth orchestrator state on sign-out');
  }

  if (issues.length === 0) {
    console.log('oauth-orchestrator-guard: OK');
    process.exit(0);
  }

  console.error('oauth-orchestrator-guard: FAILED\n');
  for (const issue of issues) {
    console.error(`  → ${issue}`);
  }
  process.exit(1);
}

main();
