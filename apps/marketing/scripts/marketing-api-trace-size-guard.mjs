#!/usr/bin/env node
/**
 * Guard against Vercel serverless API bundle bloat (749MB regression).
 * Runs after `next build`; inspects route.js.nft.json traces under .next/server/app/api.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const marketingRoot = path.join(__dirname, '..');
const apiTraceRoot = path.join(marketingRoot, '.next', 'server', 'app', 'api');

/** Default 10MB — well below Vercel's 300MB limit; post-fix traces are ~250KB. */
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

function parseMaxBytes() {
  const raw = process.env.MARKETING_API_TRACE_MAX_BYTES?.trim();
  if (!raw) {
    return DEFAULT_MAX_BYTES;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid MARKETING_API_TRACE_MAX_BYTES: ${raw}`);
  }
  return parsed;
}

function listApiNftFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) {
    return acc;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listApiNftFiles(fullPath, acc);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.nft.json')) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function routeLabelFromNft(nftPath) {
  const rel = path.relative(apiTraceRoot, nftPath).replace(/\\/g, '/');
  return rel.replace(/\/route\.js\.nft\.json$/, '') || rel;
}

function isPublicAssetTrace(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  return (
    normalized.includes('/public/') ||
    normalized.startsWith('public/') ||
    normalized.startsWith('./public/') ||
    normalized.includes('/apps/marketing/public/')
  );
}

function measureNftTrace(nftPath) {
  const nftDir = path.dirname(nftPath);
  const nft = JSON.parse(fs.readFileSync(nftPath, 'utf8'));
  const files = Array.isArray(nft.files) ? nft.files : [];

  let totalBytes = 0;
  let publicBytes = 0;
  const publicPaths = [];
  const missingPaths = [];

  for (const relativePath of files) {
    const absolutePath = path.resolve(nftDir, relativePath);
    if (!fs.existsSync(absolutePath)) {
      missingPaths.push(relativePath);
      continue;
    }

    const stat = fs.statSync(absolutePath);
    if (!stat.isFile()) {
      continue;
    }

    totalBytes += stat.size;
    if (isPublicAssetTrace(relativePath)) {
      publicBytes += stat.size;
      publicPaths.push(relativePath);
    }
  }

  return {
    totalBytes,
    publicBytes,
    publicPaths,
    fileCount: files.length,
    missingPaths,
  };
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${bytes}B`;
}

const maxBytes = parseMaxBytes();

if (!fs.existsSync(apiTraceRoot)) {
  console.error(
    'Marketing API trace size guard failed: .next/server/app/api not found.\n' +
      'Run `npm run build` in apps/marketing first.',
  );
  process.exit(1);
}

const nftFiles = listApiNftFiles(apiTraceRoot);
if (nftFiles.length === 0) {
  console.error(
    'Marketing API trace size guard failed: no route.js.nft.json files under .next/server/app/api.',
  );
  process.exit(1);
}

const errors = [];
const summaries = [];

for (const nftPath of nftFiles.sort()) {
  const route = routeLabelFromNft(nftPath);
  const measurement = measureNftTrace(nftPath);

  summaries.push({
    route,
    ...measurement,
  });

  if (measurement.totalBytes > maxBytes) {
    errors.push(
      `${route}: traced size ${formatBytes(measurement.totalBytes)} exceeds ceiling ${formatBytes(maxBytes)}`,
    );
  }

  if (measurement.publicBytes > 0) {
    errors.push(
      `${route}: traced ${formatBytes(measurement.publicBytes)} from public/ assets (${measurement.publicPaths.length} paths)`,
    );
  }

  if (measurement.missingPaths.length > 0) {
    errors.push(
      `${route}: ${measurement.missingPaths.length} traced file(s) missing on disk (stale .next?)`,
    );
  }
}

if (errors.length > 0) {
  console.error('Marketing API trace size guard failed:\n');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  console.error('\nTraced routes:');
  for (const summary of summaries) {
    console.error(
      `  - ${summary.route}: ${formatBytes(summary.totalBytes)} (${summary.fileCount} files)`,
    );
  }
  process.exit(1);
}

for (const summary of summaries) {
  console.log(
    `  ${summary.route}: ${formatBytes(summary.totalBytes)} (${summary.fileCount} files)`,
  );
}

console.log(
  `Marketing API trace size guard passed (${summaries.length} routes, max ${formatBytes(maxBytes)}).`,
);
