import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_MARKDOWN_PATH = 'product-os/04-quality/release-qa-evidence.md';

const extractRegistryRows = (markdown) => {
  const sectionMatch = markdown.match(
    /## Snapshot-Backed Feature Registry([\s\S]*?)(?:\n## |\n### |\n$)/,
  );
  if (!sectionMatch) {
    return { rows: [], errors: ['Missing "Snapshot-Backed Feature Registry" section.'] };
  }

  const lines = sectionMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const tableLines = lines.filter((line) => line.startsWith('|') && line.endsWith('|'));
  if (tableLines.length < 3) {
    return { rows: [], errors: ['Snapshot registry table must include header and at least one feature row.'] };
  }

  const rows = tableLines
    .slice(2)
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 4);

  if (rows.length === 0) {
    return { rows: [], errors: ['Snapshot registry table contains no feature rows.'] };
  }

  return { rows, errors: [] };
};

export const runSnapshotRegistryCheck = (markdownPath) => {
  const markdown = readFileSync(markdownPath, 'utf8');
  const { rows, errors } = extractRegistryRows(markdown);
  const rowErrors = [...errors];

  rows.forEach((cells, index) => {
    const [feature, snapshotCommand, behaviorCommand, templateLinked] = cells;
    const rowLabel = `row ${index + 1}`;
    if (!/^`FEAT-\d+`$/.test(feature)) {
      rowErrors.push(`Snapshot registry ${rowLabel}: feature must use backticked FEAT id (example: \`FEAT-003\`).`);
    }
    if (!/^`npm test -- ".+"`$/.test(snapshotCommand)) {
      rowErrors.push(`Snapshot registry ${rowLabel}: snapshot command must be a backticked npm test command.`);
    }
    if (!/^`npm test -- ".+"`$/.test(behaviorCommand)) {
      rowErrors.push(`Snapshot registry ${rowLabel}: companion behavior command must be a backticked npm test command.`);
    }
    if (!/^`(Yes|No)`$/.test(templateLinked)) {
      rowErrors.push(`Snapshot registry ${rowLabel}: template-linked column must be \`Yes\` or \`No\`.`);
    }
  });

  return {
    schemaVersion: 1,
    markdownPath,
    rowCount: rows.length,
    status: rowErrors.length === 0 ? 'PASS' : 'FAIL',
    errors: rowErrors,
  };
};

const printUsage = () => {
  console.error(
    'Usage: node scripts/openapi-governance/snapshot-registry-check.mjs [--markdown <path>] [--report <path>]',
  );
};

const parseArgs = (argv) => {
  const options = {
    markdownPath: DEFAULT_MARKDOWN_PATH,
    reportPath: '',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--markdown') {
      options.markdownPath = argv[index + 1] ?? DEFAULT_MARKDOWN_PATH;
      index += 1;
    } else if (arg === '--report') {
      options.reportPath = argv[index + 1] ?? '';
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
};

const isEntrypoint = process.argv[1]
  ? import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href
  : false;

if (isEntrypoint) {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    printUsage();
    process.exit(1);
  }

  const result = runSnapshotRegistryCheck(options.markdownPath);
  if (options.reportPath) {
    writeFileSync(options.reportPath, `${JSON.stringify(result, null, 2)}\n`);
  }

  if (result.status !== 'PASS') {
    console.error(`Snapshot registry check failed for ${options.markdownPath}:`);
    result.errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`Snapshot registry check passed (${result.rowCount} row(s)).`);
}
