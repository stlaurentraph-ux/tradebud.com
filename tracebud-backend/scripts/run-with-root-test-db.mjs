import { spawn } from 'node:child_process';
import { resolveTestDatabaseUrl } from './db-url-from-env.mjs';

function run() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Missing command to run.');
    process.exit(1);
  }

  let testDbUrl = process.env.TEST_DATABASE_URL?.trim();
  if (!testDbUrl) {
    try {
      testDbUrl = resolveTestDatabaseUrl();
    } catch (error) {
      console.error(
        error instanceof Error
          ? error.message
          : 'TEST_DATABASE_URL is required for integration tests.',
      );
      console.error('Tip: npm run db:sync:test-env  then  npm run test:integration');
      process.exit(1);
    }
  }

  const child = spawn(args[0], args.slice(1), {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      TEST_DATABASE_URL: testDbUrl,
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
