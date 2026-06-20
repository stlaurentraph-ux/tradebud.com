#!/usr/bin/env node
/**
 * Fail fast before Expo/Metro starts — catches config and monorepo dependency mismatches
 * that otherwise surface as red screens on the physical device.
 *
 * Run automatically from scripts/start-metro-lan.sh; manual: npm run check:metro-start
 */
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const monorepoRoot = path.resolve(root, '../..');
const requireFromRoot = createRequire(path.join(root, 'package.json'));

let failed = false;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  console.error(`  ✗ ${msg}`);
  failed = true;
};
const warn = (msg) => console.warn(`  ⚠ ${msg}`);

function readPkgVersion(pkgRoot, name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(pkgRoot, 'node_modules', name, 'package.json'), 'utf8'))
      .version;
  } catch {
    return null;
  }
}

function checkAppConfigLoads() {
  const configPath = path.join(root, 'app.config.js');
  const source = fs.readFileSync(configPath, 'utf8');
  if (/\(\s*\w+\s*:\s*\{/.test(source) || /\(\s*\w+\s*:\s*string\b/.test(source)) {
    fail('app.config.js contains TypeScript parameter types — use plain JavaScript (.js is not transpiled)');
    return;
  }
  try {
    delete requireFromRoot.cache[configPath];
    requireFromRoot(configPath);
    ok('app.config.js loads (plain JavaScript)');
  } catch (error) {
    fail(
      `app.config.js failed to load: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function checkReactNativeAlignment() {
  const appRn = readPkgVersion(root, 'react-native');
  const rootRn = readPkgVersion(monorepoRoot, 'react-native');
  if (!appRn) {
    fail('apps/offline-product/node_modules/react-native missing — run npm install in apps/offline-product');
    return;
  }
  ok(`Field app react-native ${appRn}`);

  const metroConfig = fs.readFileSync(path.join(root, 'metro.config.js'), 'utf8');
  if (!metroConfig.includes('nodeModulesPaths = [appNodeModules]')) {
    fail('metro.config.js must resolve modules only from apps/offline-product/node_modules');
  } else {
    ok('metro.config.js uses app-only node_modules (no root RN leakage)');
  }
  if (!metroConfig.includes('WORKSPACE_MODULE_PREFIX')) {
    fail('metro.config.js must rewrite npm workspaces entry paths for device debug builds');
  } else {
    ok('metro.config.js rewrites workspaces bundle paths');
  }

  if (rootRn) {
    fail(
      `Monorepo root still has react-native ${rootRn} — remove RN/Expo from root package.json and run npm install at repo root`,
    );
  } else {
    ok('Root package.json has no react-native (workspaces-safe)');
  }
}

function checkMetroConfigLoads() {
  try {
    requireFromRoot('./metro.config.js');
    ok('metro.config.js loads');
  } catch (error) {
    fail(
      `metro.config.js failed to load: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function checkExpoConfig() {
  try {
    execSync('npx expo config --type public > /dev/null', {
      cwd: root,
      stdio: 'pipe',
      env: { ...process.env, CI: '1' },
    });
    ok('expo config resolves');
  } catch (error) {
    const stderr = error?.stderr?.toString?.() ?? '';
    fail(`expo config failed${stderr ? `: ${stderr.trim().slice(0, 240)}` : ''}`);
  }
}

console.log('\nMetro start validation\n');
checkAppConfigLoads();
checkReactNativeAlignment();
checkMetroConfigLoads();
checkExpoConfig();
console.log('');
process.exit(failed ? 1 : 0);
