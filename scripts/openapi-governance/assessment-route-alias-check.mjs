#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const ROOT = process.cwd();
const controllerPath = path.join(
  ROOT,
  'tracebud-backend',
  'src',
  'integrations',
  'assessment-requests.controller.ts',
);
const openapiPath = path.join(ROOT, 'docs', 'openapi', 'tracebud-v1-draft.yaml');

const canonicalOperations = [
  { method: 'post', path: '/v1/integrations/assessments/requests' },
  { method: 'get', path: '/v1/integrations/assessments/requests' },
  { method: 'get', path: '/v1/integrations/assessments/requests/{id}' },
  { method: 'patch', path: '/v1/integrations/assessments/requests/{id}/status' },
  { method: 'patch', path: '/v1/integrations/assessments/requests/{id}/opened' },
  { method: 'patch', path: '/v1/integrations/assessments/requests/{id}/in-progress' },
  { method: 'patch', path: '/v1/integrations/assessments/requests/{id}/submitted' },
  { method: 'patch', path: '/v1/integrations/assessments/requests/{id}/reviewed' },
  { method: 'patch', path: '/v1/integrations/assessments/requests/{id}/needs-changes' },
  { method: 'patch', path: '/v1/integrations/assessments/requests/{id}/cancelled' },
  { method: 'patch', path: '/v1/integrations/assessments/requests/{id}/sent' },
  { method: 'patch', path: '/v1/integrations/assessments/requests/{id}/title' },
  { method: 'patch', path: '/v1/integrations/assessments/requests/{id}/farmer' },
  { method: 'patch', path: '/v1/integrations/assessments/requests/{id}/pathway' },
  { method: 'patch', path: '/v1/integrations/assessments/requests/{id}/metadata' },
  { method: 'patch', path: '/v1/integrations/assessments/requests/{id}/touch' },
];

const forbiddenAliases = [
  ':id/reopen',
  ':id/review',
  ':id/send',
  ':id/progress',
  ':id/open',
  ':id/submit',
  ':id/cancel',
  ':id/changes',
  ':id/approve',
  ':id/reset',
  ':id/reassign',
  ':id/meta',
  ':id/path',
  ':id/details',
  ':id/refresh',
  ':id/reopen-for-farmer',
  ':id/review-complete',
  ':id/send-again',
  ':id/work',
  ':id/viewed',
  ':id/finalize',
  ':id/abort',
  ':id/request-changes',
  ':id/approve-review',
  ':id/restart',
  ':id/reassign-farmer',
  ':id/update-metadata',
  ':id/update-pathway',
  ':id/update-details',
  ':id/ping',
];

function fail(lines) {
  for (const line of lines) {
    console.error(line);
  }
  process.exit(1);
}

if (!fs.existsSync(controllerPath)) {
  fail([`[ASSESSMENT_ALIAS_CHECK] Missing controller: ${controllerPath}`]);
}
if (!fs.existsSync(openapiPath)) {
  fail([`[ASSESSMENT_ALIAS_CHECK] Missing OpenAPI draft: ${openapiPath}`]);
}

const source = fs.readFileSync(controllerPath, 'utf8');
const foundControllerAliases = forbiddenAliases.filter((alias) =>
  source.includes(`@Patch('${alias}')`) ||
  source.includes(`@Post('${alias}')`) ||
  source.includes(`@Get('${alias}')`),
);

const openapi = YAML.parse(fs.readFileSync(openapiPath, 'utf8'));
const openapiPaths = openapi?.paths && typeof openapi.paths === 'object' ? openapi.paths : {};

const missingCanonicalOps = canonicalOperations.filter((entry) => {
  const pathEntry = openapiPaths[entry.path];
  if (!pathEntry || typeof pathEntry !== 'object') {
    return true;
  }
  return !pathEntry[entry.method];
});

const foundOpenapiAliases = forbiddenAliases.filter((alias) => {
  const openapiPathAlias = `/v1/integrations/assessments/requests/${alias.replace(':id', '{id}')}`;
  return !!openapiPaths[openapiPathAlias];
});

if (
  foundControllerAliases.length > 0 ||
  foundOpenapiAliases.length > 0 ||
  missingCanonicalOps.length > 0
) {
  const lines = ['[ASSESSMENT_ALIAS_CHECK] FAIL'];
  if (foundControllerAliases.length > 0) {
    lines.push('Deprecated assessment alias routes detected in controller:');
    for (const alias of foundControllerAliases) {
      lines.push(`- ${alias}`);
    }
  }
  if (foundOpenapiAliases.length > 0) {
    lines.push('Deprecated assessment alias paths detected in OpenAPI draft:');
    for (const alias of foundOpenapiAliases) {
      lines.push(`- /v1/integrations/assessments/requests/${alias.replace(':id', '{id}')}`);
    }
  }
  if (missingCanonicalOps.length > 0) {
    lines.push('Missing canonical assessment operations in OpenAPI draft:');
    for (const missing of missingCanonicalOps) {
      lines.push(`- ${missing.method.toUpperCase()} ${missing.path}`);
    }
  }
  lines.push('Use canonical assessment request routes only and keep OpenAPI path parity.');
  fail(lines);
}

console.log(
  `[ASSESSMENT_ALIAS_CHECK] PASS - canonical assessment routes present in OpenAPI (${canonicalOperations.length} operations) and no deprecated aliases found.`,
);
