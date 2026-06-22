#!/usr/bin/env node
/**
 * Remove unused StyleSheet / theme imports after screen style extraction.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function listLintFiles() {
  const result = spawnSync('npm', ['run', 'lint'], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  return [...output.matchAll(/^(\/.*\.(?:tsx|ts))\n/gm)].map((m) => m[1]);
}

function isIdentifierUsed(source, name, importLine) {
  const body = source.replace(importLine, '');
  const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  return re.test(body);
}

function pruneNamedImportBlock(source, modulePattern, importLine) {
  const match = importLine.match(/^import\s+\{([^}]+)\}\s+from\s+(['"][^'"]+['"]);?\s*$/);
  if (!match) return source;
  const module = match[2];
  if (!modulePattern.test(module)) return source;

  const kept = match[1]
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const base = part.replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
      return isIdentifierUsed(source, base, importLine);
    });

  if (kept.length === 0) {
    return source.replace(`${importLine}\n`, '');
  }
  if (kept.join(', ') === match[1].split(',').map((p) => p.trim()).filter(Boolean).join(', ')) {
    return source;
  }
  const next = `import { ${kept.join(', ')} } from ${module};`;
  return source.replace(importLine, next);
}

function pruneImports(source) {
  const importLines = source.match(/^import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*$/gm) ?? [];
  let next = source;
  for (const line of importLines) {
    next = pruneNamedImportBlock(next, /react-native/, line);
    next = pruneNamedImportBlock(next, /@\/constants\/theme/, line);
    next = pruneNamedImportBlock(next, /@expo\/vector-icons/, line);
    next = pruneNamedImportBlock(next, /@\/features\/demo\/storeUiScale/, line);
  }
  return next;
}

function fixExploreVouchers(source) {
  if (!source.includes('const [vouchers, setVouchers]')) return source;
  return source.replace(
    'const [vouchers, setVouchers]',
    'const [, setVouchers]',
  );
}

function fixIndexHomeConstants(source) {
  return source
    .replace(/\nconst HOME_SCREEN_PAD[\s\S]*?const HOME_TILE_SUBTITLE_LINE_HEIGHT = scaleText\(18\);\n/, '\n')
    .replace(
      /import \{ Brand, Colors, Radius, Shadows \} from '@\/constants\/theme';/,
      "import { Colors } from '@/constants/theme';",
    )
    .replace(/import \{ scaleText \} from '@\/features\/demo\/storeUiScale';\n/, '');
}

function fixSettings(source) {
  return source
    .replace(/\n  const colors = Colors\[colorScheme \?\? 'light'\];\n/, '\n')
    .replace(/\n  const colorScheme = useColorScheme\(\);\n/, '\n');
}

function fixFile(filePath) {
  let source = fs.readFileSync(filePath, 'utf8');
  const original = source;

  if (filePath.endsWith('app/(tabs)/index.tsx')) {
    source = fixIndexHomeConstants(source);
  }
  if (filePath.endsWith('app/(tabs)/explore.tsx')) {
    source = fixExploreVouchers(source);
  }
  if (filePath.endsWith('app/(tabs)/settings.tsx')) {
    source = fixSettings(source);
  }

  source = pruneImports(source);
  source = source.replace(/\n{3,}/g, '\n\n');

  if (source !== original) {
    fs.writeFileSync(filePath, source);
    return true;
  }
  return false;
}

const files = listLintFiles();
let changed = 0;
for (const file of files) {
  if (fixFile(file)) changed += 1;
}
console.log(`Updated ${changed} file(s).`);
