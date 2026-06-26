#!/usr/bin/env node
/**
 * Guardrail 4.10 — Stripe webhook replay regression vs manifest baseline.
 *
 * Run: npm run billing:stripe:webhook:assert -w tracebud-backend
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(
  backendRoot,
  'qa/automation-baselines/stripe-webhook-replay.json',
);

function readBackend(relativePath) {
  const fullPath = path.join(backendRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadManifest() {
  try {
    return JSON.parse(readBackend('qa/automation-baselines/stripe-webhook-replay.json'));
  } catch (error) {
    throw new Error(`Invalid stripe-webhook-replay.json: ${error.message}`);
  }
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '4.10') {
    throw new Error('manifest slice must be 4.10');
  }
  if (manifest.webhookPath !== '/api/v1/billing/stripe/webhook') {
    throw new Error('manifest webhookPath must be /api/v1/billing/stripe/webhook');
  }
  if (!Array.isArray(manifest.supportedEventTypes) || manifest.supportedEventTypes.length !== 2) {
    throw new Error('manifest must define exactly two supported Stripe event types');
  }
  if (!Array.isArray(manifest.replayFixtures) || manifest.replayFixtures.length !== 2) {
    throw new Error('manifest must define exactly two replay fixtures');
  }
  if (!Array.isArray(manifest.testSuites) || manifest.testSuites.length < 2) {
    throw new Error('manifest must define at least two webhook replay test suites');
  }
}

function assertControllerWiring(manifest) {
  const controller = readBackend(manifest.controllerModule);
  if (!controller.includes("@Controller('v1/billing/stripe')")) {
    throw new Error(`${manifest.controllerModule} must expose v1/billing/stripe controller`);
  }
  if (!controller.includes("@Post('webhook')")) {
    throw new Error(`${manifest.controllerModule} must expose POST webhook handler`);
  }
  if (!controller.includes('constructWebhookEvent')) {
    throw new Error(`${manifest.controllerModule} must verify Stripe signatures`);
  }
  if (!controller.includes('handleStripeWebhookEvent')) {
    throw new Error(`${manifest.controllerModule} must delegate to BillingService.handleStripeWebhookEvent`);
  }
  if (!controller.includes('req.rawBody')) {
    throw new Error(`${manifest.controllerModule} must require raw request body for signature verification`);
  }
}

function assertBillingServiceHandlers(manifest) {
  const billingService = readBackend(manifest.billingServiceModule);
  for (const eventType of manifest.supportedEventTypes) {
    if (!billingService.includes(`event.type === '${eventType}'`)) {
      throw new Error(`${manifest.billingServiceModule} must handle ${eventType}`);
    }
  }
  if (!billingService.includes('applyStripeInvoicePaid')) {
    throw new Error(`${manifest.billingServiceModule} must reconcile paid invoices`);
  }
  if (!billingService.includes('applyStripeInvoicePaymentFailed')) {
    throw new Error(`${manifest.billingServiceModule} must reconcile failed invoices`);
  }
  if (!billingService.includes('stripe_webhook_events')) {
    throw new Error(`${manifest.billingServiceModule} must persist Stripe webhook event ids for dedupe`);
  }
  if (!billingService.includes('ON CONFLICT (stripe_event_id) DO NOTHING')) {
    throw new Error(`${manifest.billingServiceModule} must dedupe Stripe webhook replays by event id`);
  }
  if (!billingService.includes('invoice_status <> $3')) {
    throw new Error(`${manifest.billingServiceModule} must not downgrade paid invoices on payment_failed`);
  }
}

function assertSignatureModule(manifest) {
  const signatureModule = readBackend(manifest.signatureModule);
  if (!signatureModule.includes('STRIPE_WEBHOOK_SECRET')) {
    throw new Error(`${manifest.signatureModule} must read STRIPE_WEBHOOK_SECRET`);
  }
  if (!signatureModule.includes('timingSafeEqual')) {
    throw new Error(`${manifest.signatureModule} must verify signatures with timingSafeEqual`);
  }
}

function assertReplayFixturesUsed(manifest) {
  const replaySpec = readBackend('src/billing/billing-stripe-webhook.replay.spec.ts');
  for (const fixture of manifest.replayFixtures) {
    if (!replaySpec.includes(fixture.stripeInvoiceId)) {
      throw new Error(`replay spec must reference fixture stripeInvoiceId ${fixture.stripeInvoiceId}`);
    }
    if (!replaySpec.includes(fixture.stripeEventId)) {
      throw new Error(`replay spec must reference fixture stripeEventId ${fixture.stripeEventId}`);
    }
  }
}

function assertTestSuites(manifest) {
  for (const suite of manifest.testSuites) {
    const source = readBackend(suite.module);
    for (const testName of suite.requiredTests) {
      if (!source.includes(`it('${testName}'`) && !source.includes(`it("${testName}"`)) {
        throw new Error(`${suite.module} missing required test "${testName}"`);
      }
    }
  }
}

function assertPackageScript() {
  const pkg = JSON.parse(readBackend('package.json'));
  if (!pkg.scripts?.['billing:stripe:webhook:assert']) {
    throw new Error('package.json must define billing:stripe:webhook:assert script');
  }
}

function main() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Missing qa/automation-baselines/stripe-webhook-replay.json');
  }

  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertControllerWiring(manifest);
  assertBillingServiceHandlers(manifest);
  assertSignatureModule(manifest);
  assertReplayFixturesUsed(manifest);
  assertTestSuites(manifest);
  assertPackageScript();

  console.log(
    `Stripe webhook replay guard passed (${manifest.replayFixtures.length} fixtures, ${manifest.testSuites.length} test suites).`,
  );
}

main();
