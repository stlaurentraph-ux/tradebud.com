#!/usr/bin/env node
/**
 * Maestro E2E approval gate — require explicit human opt-in before emulator jobs.
 *
 * PR: needs label `maestro:run` (configurable in maestro-golden-path-ci.json).
 * push / workflow_dispatch: approved here; expensive jobs use GitHub Environment
 * `maestro-e2e` for a second required-reviewer pause.
 *
 * Outputs (GITHUB_OUTPUT): e2e_approved, e2e_approval_reason
 */
import fs from 'node:fs';
import path from 'node:path';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../../..');
const manifestPath = path.join(repoRoot, 'product-os/04-quality/maestro-golden-path-ci.json');

function writeOutput(name, value) {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) {
    console.log(`[approval] ${name}=${value}`);
    return;
  }
  appendFileSync(out, `${name}=${value}\n`);
}

function loadManifest() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing manifest: ${manifestPath}`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function parseEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) return {};
  return JSON.parse(fs.readFileSync(eventPath, 'utf8'));
}

async function githubRequest(pathname) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required for maestro-ci-approval-gate');
  const repo = process.env.GITHUB_REPOSITORY;
  const url = `https://api.github.com/repos/${repo}${pathname}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${pathname} failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function prHasApprovalLabel(prNumber, label) {
  const data = await githubRequest(`/issues/${prNumber}/labels?per_page=100`);
  return Array.isArray(data) && data.some((entry) => entry.name === label);
}

async function main() {
  const manifest = loadManifest();
  const approvalLabel = manifest.e2eApproval?.prLabel ?? 'maestro:run';
  const eventName = process.env.GITHUB_EVENT_NAME ?? 'unknown';
  const event = parseEvent();

  if (eventName === 'workflow_dispatch') {
    writeOutput('e2e_approved', 'true');
    writeOutput('e2e_approval_reason', 'workflow_dispatch');
    console.log('[approval] workflow_dispatch — E2E approved (operator started run)');
    return;
  }

  if (eventName === 'push') {
    writeOutput('e2e_approved', 'true');
    writeOutput('e2e_approval_reason', 'push_uses_environment');
    console.log('[approval] push — E2E jobs will wait on GitHub Environment maestro-e2e');
    return;
  }

  if (eventName === 'pull_request') {
    const prNumber = event.pull_request?.number;
    if (!prNumber) {
      throw new Error('pull_request event missing pull_request.number');
    }
    const approved = await prHasApprovalLabel(prNumber, approvalLabel);
    writeOutput('e2e_approved', approved ? 'true' : 'false');
    writeOutput(
      'e2e_approval_reason',
      approved ? 'pr_label_present' : 'pr_label_missing',
    );
    if (approved) {
      console.log(`[approval] PR #${prNumber} has label ${approvalLabel} — E2E approved`);
    } else {
      console.log(
        `[approval] PR #${prNumber} missing label ${approvalLabel} — emulator Maestro will not run`,
      );
    }
    return;
  }

  writeOutput('e2e_approved', 'false');
  writeOutput('e2e_approval_reason', 'unsupported_event');
  console.log(`[approval] unsupported event ${eventName} — E2E not approved`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
