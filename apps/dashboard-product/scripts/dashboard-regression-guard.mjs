#!/usr/bin/env node
/**
 * Dashboard API regression guard (slice 1.5).
 * Keeps app/api route inventory, backend proxy wiring, and OpenAPI path parity aligned.
 *
 * Run: npm run regression:routes:assert -w dashboard-product
 * Refresh baseline after intentional route adds:
 *   npm run regression:routes:baseline:refresh -w dashboard-product
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dashboardRoot = path.join(__dirname, '..');
const repoRoot = path.join(dashboardRoot, '../..');
const apiRoot = path.join(dashboardRoot, 'app', 'api');
const baselinePath = path.join(
  dashboardRoot,
  'qa/automation-baselines/dashboard-api-routes.json',
);
const openapiPath = path.join(repoRoot, 'docs/openapi/tracebud-v1-draft.yaml');

const INTERNAL_TOOL_PREFIXES = ['/api/crm/', '/api/content/'];
const DASHBOARD_AGGREGATE_PATHS = new Set(['/api/dashboard/summary', '/api/dashboard/sponsor-summary']);
const CONFIG_LOCAL_PATHS = new Set(['/api/integrations/coolfarm-sai/v2/scheduler/config']);
/** Routes that intentionally degrade to empty data when backend URL is unset (not 503). */
const SOFT_BACKEND_FALLBACK_PATHS = new Set([
  '/api/harvest/batch-intakes',
  '/api/harvest/shipment-assemblies',
]);

function listRouteFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) {
    return acc;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listRouteFiles(fullPath, acc);
      continue;
    }
    if (entry.isFile() && entry.name === 'route.ts') {
      acc.push(fullPath);
    }
  }
  return acc;
}

function routeFileToDashboardPath(routeFile) {
  const rel = path.relative(path.join(dashboardRoot, 'app'), path.dirname(routeFile));
  return `/${rel.replace(/\\/g, '/')}`;
}

function categorizeRoute(dashboardPath) {
  if (INTERNAL_TOOL_PREFIXES.some((prefix) => dashboardPath.startsWith(prefix))) {
    return 'internal-tools';
  }
  if (DASHBOARD_AGGREGATE_PATHS.has(dashboardPath)) {
    return 'dashboard-aggregate';
  }
  if (CONFIG_LOCAL_PATHS.has(dashboardPath)) {
    return 'config-local';
  }
  if (SOFT_BACKEND_FALLBACK_PATHS.has(dashboardPath)) {
    return 'backend-proxy-soft-fallback';
  }
  return 'backend-proxy';
}

function sanitizeExtractedPath(rawPath) {
  let pathKey = rawPath.split('?')[0];
  pathKey = pathKey.replace(/\$\{encodeURIComponent\((\w+)\)\}/g, '{$1}');
  pathKey = pathKey.replace(/\$\{(\w+)\}/g, '{$1}');
  pathKey = pathKey.replace(/\[([^\]]+)\]/g, '{$1}');
  pathKey = pathKey.replace(/\/{2,}/g, '/');
  return pathKey.replace(/\/+$/, '') || '/';
}

function extractBackendPaths(source) {
  const paths = new Set();

  for (const match of source.matchAll(/backendApiUrl\([^,]+,\s*[`']([^`']+)[`']/g)) {
    paths.add(sanitizeExtractedPath(match[1]));
  }

  for (const match of source.matchAll(/proxyJson\([^,]+,\s*[`']([^`']+)[`']/g)) {
    paths.add(sanitizeExtractedPath(match[1]));
  }

  for (const match of source.matchAll(
    /backendApiUrl\([^,]+,\s*`(\/v1\/[^`]*)\$\{encodeURIComponent\((\w+)\)\}([^`]*)`/g,
  )) {
    paths.add(sanitizeExtractedPath(`${match[1]}{${match[2]}}${match[3]}`));
  }

  for (const match of source.matchAll(
    /backendApiUrl\([^,]+,\s*`(\/v1\/[^`]*)\$\{(\w+)\}([^`]*)`/g,
  )) {
    paths.add(sanitizeExtractedPath(`${match[1]}{${match[2]}}${match[3]}`));
  }

  for (const match of source.matchAll(/fetch(?:Json|BackendJson)\(\s*[`']([^`']+)[`']/g)) {
    if (match[1].startsWith('/v1/')) {
      paths.add(sanitizeExtractedPath(match[1]));
    }
  }

  for (const match of source.matchAll(/[`'"](\/v1\/[^`'"\n]+)[`'"]/g)) {
    paths.add(sanitizeExtractedPath(match[1]));
  }

  return [...paths]
    .filter((value) => value.startsWith('/v1/') && !value.includes('${'))
    .sort();
}

function hasFailClosedBackendCheck(source, category) {
  if (category === 'internal-tools' || category === 'dashboard-aggregate' || category === 'config-local') {
    return true;
  }
  if (category === 'backend-proxy-soft-fallback') {
    return /TRACEBUD_BACKEND_URL/.test(source);
  }
  if (/getBackendBase\(/.test(source) || /proxyJson\(/.test(source)) {
    return true;
  }
  if (/TRACEBUD_BACKEND_URL/.test(source)) {
    if (/status:\s*503/.test(source) || /status: 503/.test(source)) {
      return true;
    }
    if (/TRACEBUD_BACKEND_URL is required/.test(source)) {
      return true;
    }
    if (/throw new Error\(['`]TRACEBUD_BACKEND_URL/.test(source)) {
      return true;
    }
  }
  return false;
}

function loadOpenApiPaths() {
  if (!fs.existsSync(openapiPath)) {
    throw new Error(`Missing OpenAPI draft: ${openapiPath}`);
  }
  const openapi = YAML.parse(fs.readFileSync(openapiPath, 'utf8'));
  return new Set(Object.keys(openapi?.paths ?? {}));
}

function scanRoutes() {
  const routes = listRouteFiles(apiRoot)
    .map((routeFile) => {
      const dashboardPath = routeFileToDashboardPath(routeFile);
      const source = fs.readFileSync(routeFile, 'utf8');
      const category = categorizeRoute(dashboardPath);
      return {
        dashboardPath,
        category,
        backendPaths: extractBackendPaths(source),
        failClosed: hasFailClosedBackendCheck(source, category),
      };
    })
    .sort((a, b) => a.dashboardPath.localeCompare(b.dashboardPath));

  const openapiPaths = loadOpenApiPaths();
  const allBackendPaths = [...new Set(routes.flatMap((route) => route.backendPaths))].sort();
  const openapiPinnedBackendPaths = allBackendPaths.filter((backendPath) => openapiPaths.has(backendPath));

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    openapiPinnedBackendPaths,
    routes,
  };
}

function setDiff(left, right) {
  return [...left].filter((item) => !right.has(item));
}

function main() {
  const writeBaseline = process.argv.includes('--write-baseline');
  const report = scanRoutes();

  if (writeBaseline) {
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.writeFileSync(baselinePath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(
      `Wrote dashboard API route baseline (${report.routes.length} routes, ${report.openapiPinnedBackendPaths.length} OpenAPI-pinned backend paths) → ${path.relative(dashboardRoot, baselinePath)}`,
    );
    return;
  }

  if (!fs.existsSync(baselinePath)) {
    console.error(
      `Missing baseline ${path.relative(dashboardRoot, baselinePath)}. Run regression:routes:baseline:refresh first.`,
    );
    process.exit(1);
  }

  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const openapiPaths = loadOpenApiPaths();
  const errors = [];

  const liveByPath = new Map(report.routes.map((route) => [route.dashboardPath, route]));
  const baseByPath = new Map((baseline.routes ?? []).map((route) => [route.dashboardPath, route]));

  for (const missing of setDiff(new Set(liveByPath.keys()), new Set(baseByPath.keys()))) {
    errors.push(`New dashboard API route not in baseline: ${missing} (run regression:routes:baseline:refresh after review)`);
  }
  for (const removed of setDiff(new Set(baseByPath.keys()), new Set(liveByPath.keys()))) {
    errors.push(`Removed dashboard API route still in baseline: ${removed}`);
  }

  for (const [dashboardPath, live] of liveByPath) {
    const base = baseByPath.get(dashboardPath);
    if (!base) {
      continue;
    }

    if (live.category !== base.category) {
      errors.push(`${dashboardPath}: category drift (${base.category} → ${live.category})`);
    }

    if (!live.failClosed) {
      errors.push(`${dashboardPath}: backend-proxy route missing fail-closed TRACEBUD_BACKEND_URL handling`);
    }

    const liveBackend = new Set(live.backendPaths);
    const baseBackend = new Set(base.backendPaths ?? []);
    for (const pathKey of setDiff(liveBackend, baseBackend)) {
      errors.push(`${dashboardPath}: new backend path ${pathKey} (update baseline after OpenAPI review)`);
    }
    for (const pathKey of setDiff(baseBackend, liveBackend)) {
      errors.push(`${dashboardPath}: removed backend path ${pathKey}`);
    }
  }

  const pinned = baseline.openapiPinnedBackendPaths ?? [];
  for (const backendPath of pinned) {
    if (!openapiPaths.has(backendPath)) {
      errors.push(`OpenAPI drift: pinned backend path removed from draft spec: ${backendPath}`);
    }
  }

  if (errors.length > 0) {
    console.error('Dashboard regression guard failed:\n');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Dashboard regression guard passed (${report.routes.length} API routes; ${pinned.length} OpenAPI-pinned backend paths).`,
  );
}

main();
