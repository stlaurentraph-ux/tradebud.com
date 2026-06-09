#!/usr/bin/env node
/**
 * Recompress marketing PNGs in place (never deletes files).
 * Run from apps/marketing: node scripts/optimize-public-pngs.mjs
 *
 * Pass 1: max width 2560, png level 9.
 * Pass 2: files still > 5MB get max width 1920.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const LARGE_FILE_BYTES = 5 * 1024 * 1024;

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

async function optimizePng(fp, maxWidth) {
  const before = fs.statSync(fp).size;
  const tmp = `${fp}.opt`;
  const image = sharp(fp);
  const meta = await image.metadata();

  let pipeline = image;
  if ((meta.width ?? 0) > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }

  await pipeline
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: !meta.hasAlpha,
      effort: 10,
    })
    .toFile(tmp);

  const after = fs.statSync(tmp).size;
  if (after < before) {
    fs.renameSync(tmp, fp);
    return { before, after };
  }

  fs.unlinkSync(tmp);
  return { before, after: before };
}

async function main() {
  const passes = [
    { maxWidth: 2560, label: 'pass 1 (max 2560px)' },
    { maxWidth: 1920, label: 'pass 2 (max 1920px, files > 5MB only)', minBytes: LARGE_FILE_BYTES },
  ];

  let totalSaved = 0;

  for (const pass of passes) {
    console.log(`\n${pass.label}`);
    const pngs = walkPngs(path.join(appDir, 'public'))
      .filter((png) => !pass.minBytes || png.size >= pass.minBytes)
      .sort((a, b) => b.size - a.size);

    for (const png of pngs) {
      const { before, after } = await optimizePng(png.fp, pass.maxWidth);
      if (after < before) {
        totalSaved += before - after;
        console.log(`${png.rel}: ${formatMb(before)} -> ${formatMb(after)}`);
      }
    }
  }

  const remaining = walkPngs(path.join(appDir, 'public'));
  const remainingBytes = remaining.reduce((sum, p) => sum + p.size, 0);
  console.log('');
  console.log(`Total saved: ${formatMb(totalSaved)}`);
  console.log(`PNG footprint: ${formatMb(remainingBytes)} (${remaining.length} files)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
