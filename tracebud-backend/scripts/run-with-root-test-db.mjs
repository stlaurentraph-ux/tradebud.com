import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadTestDbUrlFromRootEnv() {
  const envPath = resolve(process.cwd(), '..', '.env.local');
  const content = readFileSync(envPath, 'utf8');
  const line = content
    .split(/\r?\n/)
    .find((entry) => entry.startsWith('TEST_DATABASE_URL='));
  if (!line) return null;
  const rawValue = line.slice('TEST_DATABASE_URL='.length).trim();
  if (!rawValue) return null;
  return stripQuotes(rawValue);
}

function run() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Missing command to run.');
    process.exit(1);
  }

  let testDbUrl = process.env.TEST_DATABASE_URL;
  if (!testDbUrl) {
    try {
      testDbUrl = loadTestDbUrlFromRootEnv() ?? undefined;
    } catch {
      testDbUrl = undefined;
    }
  }

  const child = spawn(args[0], args.slice(1), {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      ...(testDbUrl ? { TEST_DATABASE_URL: testDbUrl } : {}),
    },
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

run();
