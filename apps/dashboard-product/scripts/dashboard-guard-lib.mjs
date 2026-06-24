#!/usr/bin/env node
/**
 * Shared helpers for dashboard structural guards.
 */
import fs from 'node:fs';
import path from 'node:path';

export function readFile(root, rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

export function extractArray(source, exportName) {
  const match = source.match(new RegExp(`export const ${exportName} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

export function extractUnion(source, exportName) {
  const match = source.match(new RegExp(`export type ${exportName} =([\\s\\S]*?);`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

export function extractObjectStringValues(source, exportName) {
  const match = source.match(
    new RegExp(`export const ${exportName} = \\{([\\s\\S]*?)\\} as const`),
  );
  if (!match) return [];
  return [...match[1].matchAll(/:\s*'([^']+)'/g)].map((m) => m[1]);
}

export function extractQuotedPermissions(source) {
  return [...source.matchAll(/'([a-z_]+:[a-z_]+)'/g)].map((m) => m[1]);
}

export function listSourceFiles(root, dirs) {
  const out = [];
  for (const dir of dirs) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    const walk = (current) => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules') continue;
          walk(full);
          continue;
        }
        if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
          out.push(full);
        }
      }
    };
    walk(abs);
  }
  return out;
}
