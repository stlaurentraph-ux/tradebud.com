#!/usr/bin/env node
/**
 * Remove unused marketing PNGs and losslessly recompress referenced assets.
 * Run from apps/marketing: node scripts/optimize-public-pngs.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const KEEP = new Set([
  'public/images/aerial-farm-jungle.png',
  'public/images/farmer-app-homepage.png',
  'public/images/tracebud-logo.png',
  'public/images/tracebud-logo-email.png',
  'public/og-image.png',
  'public/tracebud-logo-v6.png',
  'public/favicon-16x16-v6.png',
  'public/favicon-32x32-v6.png',
]);

function walkPngs(dir, prefix = '') {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    if (fs.statSync(fp).isDirectory()) {
      out.push(...walkPngs(fp, rel));
    } else if (name.endsWith('.png')) {
      out.push({ rel: `public/${rel}`, fp, size: fs.statSync(fp).size });
    }
  }
  return out;
}

function formatMb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function optimizePng(relPath) {
  const fp = path.join(appDir, relPath);
  const before = fs.statSync(fp).size;
  const tmp = `${fp}.opt`;
  const image = sharp(fp);
  const meta = await image.metadata();

  let pipeline = image.png({
    compressionLevel: 9,
    adaptiveFiltering: true,
    palette: meta.hasAlpha ? false : true,
  });

  if ((meta.width ?? 0) > 1920) {
    pipeline = pipeline.resize({ width: 1920, withoutEnlargement: true });
  }

  await pipeline.toFile(tmp);
  const after = fs.statSync(tmp).size;
  if (after < before) {
    fs.renameSync(tmp, fp);
  } else {
    fs.unlinkSync(tmp);
  }
  return { before, after: Math.min(before, after) };
}

async function main() {
  const pngs = walkPngs(path.join(appDir, 'public'));
  let removedBytes = 0;
  let removedCount = 0;

  for (const png of pngs) {
    if (KEEP.has(png.rel)) continue;
    fs.unlinkSync(png.fp);
    removedBytes += png.size;
    removedCount += 1;
    console.log(`removed ${png.rel} (${formatMb(png.size)})`);
  }

  let savedBytes = 0;
  for (const rel of [...KEEP].sort()) {
    const fp = path.join(appDir, rel);
    if (!fs.existsSync(fp)) {
      console.warn(`skip missing ${rel}`);
      continue;
    }
    const { before, after } = await optimizePng(rel);
    savedBytes += before - after;
    console.log(`optimized ${rel}: ${formatMb(before)} -> ${formatMb(after)}`);
  }

  const remaining = walkPngs(path.join(appDir, 'public'));
  const remainingBytes = remaining.reduce((sum, p) => sum + p.size, 0);
  console.log('');
  console.log(`Removed ${removedCount} unused PNGs (${formatMb(removedBytes)})`);
  console.log(`Recompressed kept PNGs (saved ${formatMb(savedBytes)})`);
  console.log(`Remaining PNG footprint: ${formatMb(remainingBytes)} (${remaining.length} files)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
