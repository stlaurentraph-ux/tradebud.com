#!/usr/bin/env node
/**
 * Guardrail 4.5 — dashboard Playwright golden paths vs manifest baseline.
 *
 * Run: npm run e2e:golden-paths:assert -w dashboard-product
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dashboardRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function readDashboard(relativePath) {
  const fullPath = path.join(dashboardRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadManifest() {
  let manifest;
  try {
    manifest = JSON.parse(
      readDashboard('qa/automation-baselines/dashboard-playwright-golden-paths.json'),
    );
  } catch (error) {
    throw new Error(`Invalid dashboard-playwright-golden-paths.json: ${error.message}`);
  }
  return manifest;
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '4.6') {
    throw new Error('manifest slice must be 4.6');
  }
  if (manifest.goldenTenantId !== 'tenant_rwanda_001') {
    throw new Error('manifest goldenTenantId must be tenant_rwanda_001');
  }
  if (manifest.smoke?.role !== 'compliance_manager') {
    throw new Error('manifest smoke.role must be compliance_manager');
  }
  if (manifest.smoke?.onboardingStepKey !== 'create_first_campaign') {
    throw new Error('manifest smoke.onboardingStepKey must be create_first_campaign');
  }
  if (!Array.isArray(manifest.paths) || manifest.paths.length !== 6) {
    throw new Error('manifest must define exactly six golden paths');
  }
  const ids = manifest.paths.map((item) => item.id);
  if (
    !ids.includes('login_shell') ||
    !ids.includes('login_stub') ||
    !ids.includes('onboarding_read_write') ||
    !ids.includes('outreach_send_archive') ||
    !ids.includes('compliance_issues_status') ||
    !ids.includes('exporter_package_readiness')
  ) {
    throw new Error(
      'manifest paths must include login_shell, login_stub, onboarding_read_write, outreach_send_archive, compliance_issues_status, and exporter_package_readiness',
    );
  }
}

function assertSpecAlignment(manifest) {
  const specFiles = new Set(manifest.paths.map((item) => item.specFile));
  for (const specFile of specFiles) {
    const spec = readDashboard(specFile);
    for (const pathItem of manifest.paths.filter((item) => item.specFile === specFile)) {
      if (!spec.includes(`test('${pathItem.testName}'`)) {
        throw new Error(`spec missing test "${pathItem.testName}" in ${specFile}`);
      }
    }
  }

  const primarySpec = readDashboard('e2e/golden-paths.spec.ts');
  if (!primarySpec.includes('/login')) {
    throw new Error('golden-paths spec must cover /login route');
  }
  if (!primarySpec.includes('Sign in to your account')) {
    throw new Error('golden-paths spec must assert login shell copy');
  }

  const loginStubPath = manifest.paths.find((item) => item.id === 'login_stub');
  const apiMocks = readDashboard('e2e/helpers/api-mocks.ts');
  if (
    (!primarySpec.includes('page.route(') && !apiMocks.includes('page.route(')) ||
    (!primarySpec.includes(loginStubPath.mockedApi) && !apiMocks.includes(loginStubPath.mockedApi))
  ) {
    throw new Error('login stub spec must mock Supabase password grant');
  }

  const onboardingPath = manifest.paths.find((item) => item.id === 'onboarding_read_write');
  if (!primarySpec.includes(onboardingPath.mockedApi) && !apiMocks.includes(onboardingPath.mockedApi)) {
    throw new Error('onboarding spec must mock /api/launch/onboarding');
  }
  if (
    !primarySpec.includes('create_first_campaign') &&
    !readDashboard('e2e/helpers/smoke-session.ts').includes('create_first_campaign')
  ) {
    throw new Error('onboarding spec must use golden smoke step key');
  }
  if (
    !primarySpec.includes('compliance_manager') &&
    !readDashboard('e2e/helpers/smoke-session.ts').includes('compliance_manager')
  ) {
    throw new Error('onboarding spec must use golden smoke role');
  }

  const outreachPath = manifest.paths.find((item) => item.id === 'outreach_send_archive');
  const outreachSpec = readDashboard(outreachPath.specFile);
  if (!outreachSpec.includes(outreachPath.mockedApi) && !apiMocks.includes(outreachPath.mockedApi)) {
    throw new Error('outreach spec must mock /api/requests/campaigns');
  }
  if (!outreachSpec.includes('/outreach')) {
    throw new Error('outreach spec must navigate to /outreach');
  }
  if (!outreachSpec.includes('Archive') && !outreachSpec.includes('archive')) {
    throw new Error('outreach spec must exercise archive action');
  }

  const issuesPath = manifest.paths.find((item) => item.id === 'compliance_issues_status');
  const issuesSpec = readDashboard(issuesPath.specFile);
  if (!issuesSpec.includes(issuesPath.mockedApi) && !apiMocks.includes(issuesPath.mockedApi)) {
    throw new Error('compliance issues spec must mock /api/requests/issues');
  }
  if (!issuesSpec.includes('/compliance/issues')) {
    throw new Error('compliance issues spec must navigate to /compliance/issues');
  }

  const exporterPath = manifest.paths.find((item) => item.id === 'exporter_package_readiness');
  const exporterSpec = readDashboard(exporterPath.specFile);
  if (!exporterSpec.includes(exporterPath.mockedApi) && !apiMocks.includes(exporterPath.mockedApi)) {
    throw new Error('exporter readiness spec must mock /api/harvest/packages');
  }
  if (!exporterSpec.includes('Assemble Shipment')) {
    throw new Error('exporter readiness spec must assert assemble shipment gate');
  }
  if (!readDashboard('e2e/helpers/smoke-session.ts').includes('GOLDEN_EXPORTER_SMOKE')) {
    throw new Error('smoke-session helper must define GOLDEN_EXPORTER_SMOKE');
  }
}

function assertPlaywrightConfig(manifest) {
  const config = readDashboard('playwright.config.ts');
  if (!config.includes("testDir: './e2e'")) {
    throw new Error('playwright.config.ts must set testDir to ./e2e');
  }
  if (!config.includes('npm run start')) {
    throw new Error('playwright.config.ts webServer must start built dashboard app');
  }
  if (!config.includes('NEXT_PUBLIC_SENTRY_ENABLED')) {
    throw new Error('playwright.config.ts must disable Sentry for local/CI runs');
  }
  if (!config.includes('/login')) {
    throw new Error('playwright.config.ts must probe /login readiness URL');
  }

  const smokeSession = readDashboard('e2e/helpers/smoke-session.ts');
  if (!smokeSession.includes(manifest.goldenTenantId)) {
    throw new Error('smoke-session helper must reference golden tenant id');
  }
  if (!smokeSession.includes(manifest.smoke.role) || !smokeSession.includes(manifest.smoke.onboardingStepKey)) {
    throw new Error('smoke-session helper must reference golden smoke role and step key');
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(readDashboard('package.json'));
  if (!pkg.scripts?.['e2e:golden-paths']) {
    throw new Error('package.json must define e2e:golden-paths script');
  }
  if (!pkg.scripts?.['e2e:golden-paths:assert']) {
    throw new Error('package.json must define e2e:golden-paths:assert script');
  }
  if (!pkg.devDependencies?.['@playwright/test']) {
    throw new Error('package.json must include @playwright/test devDependency');
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertSpecAlignment(manifest);
  assertPlaywrightConfig(manifest);
  assertPackageScripts();
  console.log(
    `Dashboard Playwright guard passed (${manifest.paths.length} golden paths, tenant=${manifest.goldenTenantId}).`,
  );
}

main();
