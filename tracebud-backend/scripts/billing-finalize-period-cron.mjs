#!/usr/bin/env node
/**
 * Month-end billing cron helper.
 *
 * Calls POST /api/v1/billing/invoices/finalize-period-cron on the Tracebud API.
 *
 * Required env:
 *   TRACEBUD_API_BASE — e.g. https://api.tracebud.com/api
 *   BILLING_SCHEDULER_TOKEN — shared secret (x-tracebud-billing-token header)
 */

const apiBase = process.env.TRACEBUD_API_BASE?.replace(/\/$/, '');
const token = process.env.BILLING_SCHEDULER_TOKEN?.trim();

if (!apiBase) {
  console.error('TRACEBUD_API_BASE is required (e.g. https://api.tracebud.com/api)');
  process.exit(1);
}

if (!token) {
  console.error('BILLING_SCHEDULER_TOKEN is required');
  process.exit(1);
}

const url = `${apiBase}/v1/billing/invoices/finalize-period-cron`;

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'x-tracebud-billing-token': token,
    'Content-Type': 'application/json',
  },
});

const body = await response.json().catch(() => ({}));

if (!response.ok) {
  console.error('Billing finalize cron failed:', response.status, body);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      billingPeriod: body.billingPeriod,
      invoiceCount: body.invoiceCount,
      stripeAttempted: body.stripeAttempted,
      stripeSucceeded: body.stripeSucceeded,
    },
    null,
    2,
  ),
);
