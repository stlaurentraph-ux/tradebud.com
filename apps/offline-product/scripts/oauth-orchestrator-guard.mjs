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

  if (!signInSheet.includes('completeOAuthFromDeepLink')) {
    issues.push('SignInSheetContext must use completeOAuthFromDeepLink for warm deep links');
  }
  if (signInSheet.includes('sessionFromOAuthCallbackUrl')) {
    issues.push('SignInSheetContext must not call sessionFromOAuthCallbackUrl directly');
  }

  if (!callback.includes('runOAuthColdStartCallback')) {
    issues.push('auth/callback.tsx must use runOAuthColdStartCallback');
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
