#!/usr/bin/env node
/**
 * Guardrail 2.O.1 — n8n workflow-b contract vs marketing Founder OS sync.
 *
 * Run: npm run n8n:workflow-b:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const activationDocPath = path.join(
  repoRoot,
  'automation/n8n/founder-os/workflow-b-activation.md',
);

const LEAD_FORM_TYPES = ['exporter', 'importer', 'country', 'farmer', 'cooperative', 'pilot'];

function readRepo(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function assertIncludes(relativePath, needle, message) {
  const source = readRepo(relativePath);
  if (!source.includes(needle)) {
    throw new Error(`${relativePath}: ${message}`);
  }
}

function loadWorkflow() {
  const raw = readRepo('automation/n8n/founder-os/workflow-b-website-form-intake.json');
  let workflow;
  try {
    workflow = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid workflow JSON: ${error.message}`);
  }
  return workflow;
}

function assertWorkflowShape(workflow) {
  if (workflow.trigger?.type !== 'webhook') {
    throw new Error('workflow-b trigger.type must be webhook');
  }
  if (!workflow.trigger.path?.includes('website-lead-intake')) {
    throw new Error('workflow-b trigger.path must include website-lead-intake');
  }
  if (!workflow.primaryPipeline?.canonical?.includes('prospect-sync')) {
    throw new Error('workflow-b primaryPipeline must reference prospect-sync as canonical');
  }

  const guardrails = workflow.guardrails ?? [];
  const guardrailText = guardrails.join(' ').toLowerCase();
  if (!guardrailText.includes('idempotent')) {
    throw new Error('workflow-b guardrails must mention idempotent email matching');
  }
  if (!guardrailText.includes('do not replace')) {
    throw new Error('workflow-b guardrails must preserve existing website form pipeline');
  }

  const formTypes = workflow.payloadContract?.properties?.formType?.enum ?? [];
  for (const formType of LEAD_FORM_TYPES) {
    if (!formTypes.includes(formType)) {
      throw new Error(`workflow-b payloadContract.formType.enum missing ${formType}`);
    }
  }
  if (!formTypes.includes('waitlist')) {
    throw new Error('workflow-b payloadContract.formType.enum must include waitlist');
  }

  const mapping = workflow.prospectMapping ?? {};
  for (const source of ['website_form', 'website_pilot_form', 'website_waitlist']) {
    if (!mapping.source?.includes(source)) {
      throw new Error(`workflow-b prospectMapping.source missing ${source}`);
    }
  }
  if (mapping.activity_type !== 'identified') {
    throw new Error('workflow-b prospectMapping.activity_type must be identified');
  }
  if (mapping.channel !== 'website') {
    throw new Error('workflow-b prospectMapping.channel must be website');
  }
  if (!mapping.stage?.includes('identified') || !mapping.stage?.includes('pilot')) {
    throw new Error('workflow-b prospectMapping.stage must include identified and pilot');
  }

  if (!workflow.samplePayload?.email || !workflow.samplePayload?.formType) {
    throw new Error('workflow-b samplePayload must include email and formType');
  }
}

function assertMarketingAlignment() {
  assertIncludes('apps/marketing/lib/founder-os-mapper.ts', 'website_pilot_form', 'mapper pilot source');
  assertIncludes('apps/marketing/lib/founder-os-mapper.ts', 'website_form', 'mapper website_form source');
  assertIncludes('apps/marketing/lib/founder-os-mapper.ts', 'stage: isPilot ? "pilot" : "identified"', 'mapper stage mapping');
  assertIncludes('apps/marketing/lib/founder-os-mapper.ts', 'activity_type: "identified"', 'mapper activity_type');
  assertIncludes('apps/marketing/lib/founder-os-mapper.ts', 'channel: "website"', 'mapper channel');

  assertIncludes('apps/marketing/lib/prospect-sync.ts', 'syncLeadToProspects', 'prospect-sync entrypoint');
  assertIncludes('apps/marketing/lib/prospect-sync.ts', 'syncWaitlistToProspects', 'waitlist sync entrypoint');
  assertIncludes('apps/marketing/lib/prospect-sync.ts', "source: 'website_waitlist'", 'waitlist source constant');

  assertIncludes('apps/marketing/app/api/leads/route.ts', 'syncLeadToProspects', 'leads route must sync prospects');
  assertIncludes('apps/marketing/app/api/waitlist/route.ts', 'syncWaitlistToProspects', 'waitlist route must sync prospects');

  const leadsSource = readRepo('apps/marketing/app/api/leads/route.ts');
  for (const formType of LEAD_FORM_TYPES) {
    if (!leadsSource.includes(`"${formType}"`)) {
      throw new Error(`leads route schema missing formType ${formType}`);
    }
  }
}

function assertActivationDoc() {
  if (!fs.existsSync(activationDocPath)) {
    throw new Error('Missing workflow-b-activation.md runbook');
  }
  const doc = fs.readFileSync(activationDocPath, 'utf8');
  if (!doc.includes('notification-only')) {
    throw new Error('activation doc must describe notification-only mode');
  }
  if (!doc.includes('syncLeadToProspects')) {
    throw new Error('activation doc must reference syncLeadToProspects');
  }
}

function main() {
  const workflow = loadWorkflow();
  assertWorkflowShape(workflow);
  assertMarketingAlignment();
  assertActivationDoc();
  console.log('n8n workflow-b guard passed (spec + marketing Founder OS sync aligned).');
}

main();
