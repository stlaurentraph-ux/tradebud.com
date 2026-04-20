import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const runMarkdownReferenceCheck = ({
  markdownPath,
  packageJsonPath,
  enforceCommands = true,
  enforcePaths = true,
}) => {
  const markdownContent = readFileSync(markdownPath, 'utf8');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts ?? {};

  const commandMatches = [
    ...markdownContent.matchAll(/npm run ([a-zA-Z0-9:_-]+)/g),
  ];
  const commandNames = [...new Set(commandMatches.map((match) => match[1]))];

  const pathMatches = [
    ...markdownContent.matchAll(
      /`([A-Za-z0-9._@-]+(?:\/[A-Za-z0-9._@-]+)+)`/g,
    ),
  ];
  const referencedPaths = [...new Set(pathMatches.map((match) => match[1]))];

  const errors = [];
  const missingCommands = [];
  const missingPaths = [];

  if (enforceCommands) {
    if (commandNames.length === 0) {
      errors.push(`No "npm run <command>" entries found in ${markdownPath}.`);
    } else {
      missingCommands.push(...commandNames.filter((command) => !(command in scripts)));
      if (missingCommands.length > 0) {
        errors.push(
          `Missing scripts in ${packageJsonPath}: ${missingCommands.join(', ')}`,
        );
      }
    }
  }

  if (enforcePaths) {
    missingPaths.push(...referencedPaths.filter((path) => !existsSync(path)));
    if (missingPaths.length > 0) {
      errors.push(`Missing referenced paths: ${missingPaths.join(', ')}`);
    }
  }

  return {
    schemaVersion: 1,
    markdownPath,
    packageJsonPath,
    enforceCommands,
    enforcePaths,
    commandCount: commandNames.length,
    pathCount: referencedPaths.length,
    missingCommands,
    missingPaths,
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    errors,
  };
};

const printUsage = () => {
  console.error(
    'Usage: node scripts/openapi-governance/markdown-reference-check.mjs --markdown <path> [--package-json <path>] [--no-commands] [--no-paths] [--report <path>]',
  );
};

const parseArgs = (argv) => {
  const options = {
    markdownPath: '',
    packageJsonPath: 'package.json',
    enforceCommands: true,
    enforcePaths: true,
    reportPath: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--markdown') {
      options.markdownPath = argv[index + 1] ?? '';
      index += 1;
    } else if (arg === '--package-json') {
      options.packageJsonPath = argv[index + 1] ?? 'package.json';
      index += 1;
    } else if (arg === '--no-commands') {
      options.enforceCommands = false;
    } else if (arg === '--no-paths') {
      options.enforcePaths = false;
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

  if (!options.markdownPath) {
    printUsage();
    process.exit(1);
  }

  const result = runMarkdownReferenceCheck(options);
  if (options.reportPath) {
    writeFileSync(options.reportPath, JSON.stringify(result, null, 2));
  }

  if (result.errors.length > 0) {
    console.error(`Markdown reference check failed for ${options.markdownPath}:`);
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Markdown reference checks passed (${result.commandCount} commands, ${result.pathCount} paths).`,
  );
}
