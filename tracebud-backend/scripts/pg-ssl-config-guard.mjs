#!/usr/bin/env node
/**
 * Audit H4 — production pg TLS must verify server certs (not rejectUnauthorized: false).
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relPath) {
  return readFileSync(path.join(backendRoot, relPath), 'utf8');
}

const dbModule = read('src/db/db.module.ts');
if (!dbModule.includes('resolvePgSslConfig')) {
  console.error('pg-ssl-config-guard: db.module.ts must use resolvePgSslConfig()');
  process.exit(1);
}
if (dbModule.includes('rejectUnauthorized: false')) {
  console.error('pg-ssl-config-guard: db.module.ts must not hard-code rejectUnauthorized: false');
  process.exit(1);
}

const sslConfig = read('src/db/pg-ssl-config.ts');
if (!sslConfig.includes('rejectUnauthorized: verify')) {
  console.error('pg-ssl-config-guard: pg-ssl-config.ts must verify TLS in production');
  process.exit(1);
}

const caPath = path.join(backendRoot, 'certs/rds-global-bundle.pem');
if (!existsSync(caPath)) {
  console.error('pg-ssl-config-guard: missing certs/rds-global-bundle.pem');
  process.exit(1);
}

console.log('pg-ssl-config-guard: OK');
