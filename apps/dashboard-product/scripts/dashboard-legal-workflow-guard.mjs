#!/usr/bin/env node
/**
 * Ensures legal workflow + DDS registries align with types and lib/rbac.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractArray, extractUnion, readFile } from './dashboard-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function extractLegalMatrixRoles(rbacSource) {
  const match = rbacSource.match(
    /const LEGAL_ROLE_PERMISSION_MATRIX: Record<LegalWorkflowRole, LegalWorkflowPermission\[\]> = \{([\s\S]*?)\n\};/,
  );
  if (!match) return [];
  return [...match[1].matchAll(/^\s{2}([A-Z_]+):/gm)].map((m) => m[1]);
}

function extractWorkflowMapping(rbacSource) {
  const match = rbacSource.match(
    /getWorkflowTypeForRole\(role: LegalWorkflowRole\): WorkflowType \{[\s\S]*?const mapping: Record<LegalWorkflowRole, WorkflowType> = \{([\s\S]*?\n  \};\s*\n  return mapping)/,
  );
  if (!match) return new Map();
  const map = new Map();
  for (const row of match[1].matchAll(/^\s+([A-Z_]+):\s*'([^']+)'/gm)) {
    map.set(row[1], row[2]);
  }
  return map;
}

function extractRegistryWorkflowMapping(registrySource) {
  const match = registrySource.match(
    /export const DASHBOARD_LEGAL_ROLE_TO_WORKFLOW[\s\S]*?= \{([\s\S]*?)\n\};/,
  );
  if (!match) return new Map();
  const map = new Map();
  for (const row of match[1].matchAll(/^\s{2}([A-Z_]+):\s*'([^']+)'/gm)) {
    map.set(row[1], row[2]);
  }
  return map;
}

function main() {
  const issues = [];
  const registry = readFile(root, 'lib/dashboardLegalWorkflowRegistry.ts');
  const types = readFile(root, 'types/index.ts');
  const rbac = readFile(root, 'lib/rbac.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/dashboard-legal-workflow-registry.md');

  const regLegalRoles = extractArray(registry, 'DASHBOARD_LEGAL_WORKFLOW_ROLES');
  const typeLegalRoles = extractUnion(types, 'LegalWorkflowRole');
  const matrixLegalRoles = extractLegalMatrixRoles(rbac);
  const regWorkflowTypes = extractArray(registry, 'DASHBOARD_WORKFLOW_TYPES');
  const typeWorkflowTypes = extractUnion(types, 'WorkflowType');
  const regDds = extractArray(registry, 'DASHBOARD_DDS_STATUSES');
  const typeDds = extractUnion(types, 'DDSStatus');
  const regCompliance = extractArray(registry, 'DASHBOARD_PACKAGE_COMPLIANCE_STATUSES');
  const typeCompliance = extractUnion(types, 'PackageComplianceStatus');
  const rbacWorkflowMap = extractWorkflowMapping(rbac);
  const registryWorkflowMap = extractRegistryWorkflowMapping(registry);

  for (const role of regLegalRoles) {
    if (!typeLegalRoles.includes(role)) issues.push(`LegalWorkflowRole type missing: ${role}`);
    if (!matrixLegalRoles.includes(role)) issues.push(`LEGAL_ROLE_PERMISSION_MATRIX missing: ${role}`);
  }

  for (const role of typeLegalRoles) {
    if (!regLegalRoles.includes(role)) issues.push(`registry missing LegalWorkflowRole: ${role}`);
  }

  for (const [role, workflow] of registryWorkflowMap) {
    const rbacWorkflow = rbacWorkflowMap.get(role);
    if (!rbacWorkflow) {
      issues.push(`getWorkflowTypeForRole missing role: ${role}`);
    } else if (rbacWorkflow !== workflow) {
      issues.push(`workflow mapping drift for ${role}: rbac=${rbacWorkflow} registry=${workflow}`);
    }
  }

  for (const wf of regWorkflowTypes) {
    if (!typeWorkflowTypes.includes(wf)) issues.push(`WorkflowType missing: ${wf}`);
  }

  for (const status of typeWorkflowTypes) {
    if (!regWorkflowTypes.includes(status)) issues.push(`registry missing WorkflowType: ${status}`);
  }

  for (const status of regDds) {
    if (!typeDds.includes(status)) issues.push(`DDSStatus type missing: ${status}`);
  }

  for (const status of typeDds) {
    if (!regDds.includes(status)) issues.push(`registry missing DDSStatus: ${status}`);
  }

  for (const status of regCompliance) {
    if (!typeCompliance.includes(status)) issues.push(`PackageComplianceStatus missing: ${status}`);
  }

  if (!rbac.includes('canProceedWithWorkflow')) {
    issues.push('lib/rbac.ts missing canProceedWithWorkflow()');
  }

  for (const blocked of extractArray(registry, 'DASHBOARD_LEGAL_WORKFLOW_BLOCKED_ROLES')) {
    if (!rbac.includes(`'${blocked}'`)) {
      issues.push(`canProceedWithWorkflow must reference blocked role: ${blocked}`);
    }
  }

  if (!fs.existsSync(mdPath)) {
    issues.push('missing dashboard-legal-workflow-registry.md');
  }

  if (issues.length === 0) {
    console.log('dashboard-legal-workflow-guard: OK');
    process.exit(0);
  }

  console.error('dashboard-legal-workflow-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
