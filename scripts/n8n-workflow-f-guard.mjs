#!/usr/bin/env node
/**
 * Guardrail 2.O.2 — n8n workflow-f contract vs Founder OS content schedule SQL.
 *
 * Run: npm run n8n:workflow-f:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const activationDocPath = path.join(
  repoRoot,
  'automation/n8n/founder-os/workflow-f-activation.md',
);

function readRepo(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadWorkflow() {
  const raw = readRepo('automation/n8n/founder-os/workflow-f-missed-schedule-alert.json');
  let workflow;
  try {
    workflow = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid workflow JSON: ${error.message}`);
  }
  return workflow;
}

function assertWorkflowShape(workflow) {
  if (workflow.meta?.slice !== '2.O.2') {
    throw new Error('workflow-f meta.slice must be 2.O.2');
  }
  if (workflow.trigger?.type !== 'cron') {
    throw new Error('workflow-f trigger.type must be cron');
  }
  if (workflow.trigger.timezone !== 'Europe/Oslo') {
    throw new Error('workflow-f trigger.timezone must be Europe/Oslo');
  }
  if (workflow.trigger.schedule !== '0 17 * * *') {
    throw new Error('workflow-f trigger.schedule must be 0 17 * * *');
  }

  const rpc = workflow.supabaseQueries?.dueTasksRpc;
  if (rpc?.function !== 'content_tasks_due') {
    throw new Error('workflow-f must call content_tasks_due RPC');
  }
  if (rpc?.urgencyFilter?.includes('high') !== true) {
    throw new Error('workflow-f dueTasksRpc must filter high urgency items');
  }

  const missed = workflow.supabaseQueries?.missedCalendarItems;
  if (!missed?.table?.includes('content_calendar')) {
    throw new Error('workflow-f must query content_calendar for missed items');
  }
  if (!String(missed.filter).includes("status <> 'published'")) {
    throw new Error('workflow-f missedCalendarItems filter must exclude published rows');
  }

  const guardrails = (workflow.guardrails ?? []).join(' ').toLowerCase();
  if (!guardrails.includes('europe/oslo')) {
    throw new Error('workflow-f guardrails must mention Europe/Oslo timezone');
  }
  if (!guardrails.includes('zero')) {
    throw new Error('workflow-f guardrails must skip alert when zero items');
  }
  if (!guardrails.includes('content_tasks_due')) {
    throw new Error('workflow-f guardrails must prefer content_tasks_due()');
  }

  if (!Array.isArray(workflow.sampleAlertItems) || workflow.sampleAlertItems.length === 0) {
    throw new Error('workflow-f sampleAlertItems must include at least one example');
  }
}

function assertSqlAlignment() {
  const sql = readRepo('supabase/migrations/20260413_002_founder_os_functions.sql');
  if (!sql.includes('CREATE OR REPLACE FUNCTION content_tasks_due')) {
    throw new Error('content_tasks_due function missing from founder_os_functions migration');
  }
  if (!sql.includes('missed_content AS')) {
    throw new Error('content_tasks_due must include missed_content CTE');
  }
  if (!sql.includes("cc.status <> 'published'")) {
    throw new Error('missed_content CTE must exclude published calendar rows');
  }

  const schemaSplit = readRepo('supabase/migrations/20260620120000_phase1_schema_split.sql');
  if (!schemaSplit.includes('content_calendar SET SCHEMA crm')) {
    throw new Error('phase1 schema split must move content_calendar to crm schema');
  }
}

function assertActivationDoc() {
  if (!fs.existsSync(activationDocPath)) {
    throw new Error('Missing workflow-f-activation.md runbook');
  }
  const doc = fs.readFileSync(activationDocPath, 'utf8');
  if (!doc.includes('content_tasks_due')) {
    throw new Error('activation doc must reference content_tasks_due');
  }
  if (!doc.includes('Europe/Oslo')) {
    throw new Error('activation doc must specify Europe/Oslo timezone');
  }
  if (!doc.includes('crm.content_calendar')) {
    throw new Error('activation doc must reference crm.content_calendar');
  }
}

function main() {
  const workflow = loadWorkflow();
  assertWorkflowShape(workflow);
  assertSqlAlignment();
  assertActivationDoc();
  console.log('n8n workflow-f guard passed (spec + Founder OS schedule SQL aligned).');
}

main();
