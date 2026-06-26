#!/usr/bin/env node
/**
 * Audit H5 — global ValidationPipe + typed public-route DTOs.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relPath) {
  return readFileSync(path.join(backendRoot, relPath), 'utf8');
}

const mainTs = read('src/main.ts');
if (!mainTs.includes('useGlobalPipes')) {
  console.error('validation-pipe-guard: main.ts must register a global ValidationPipe');
  process.exit(1);
}
for (const needle of ['whitelist: true', 'forbidNonWhitelisted: true', 'transform: true']) {
  if (!mainTs.includes(needle)) {
    console.error(`validation-pipe-guard: main.ts ValidationPipe must set ${needle}`);
    process.exit(1);
  }
}

const publicController = read('src/requests/requests.public.controller.ts');
if (!publicController.includes('RecordPublicDecisionIntentDto')) {
  console.error('validation-pipe-guard: public requests controller must use RecordPublicDecisionIntentDto');
  process.exit(1);
}

const dto = read('src/requests/dto/record-public-decision-intent.dto.ts');
for (const decorator of ['@IsEmail()', '@IsIn([', '@IsNotEmpty()']) {
  if (!dto.includes(decorator)) {
    console.error(`validation-pipe-guard: RecordPublicDecisionIntentDto missing ${decorator}`);
    process.exit(1);
  }
}

console.log('validation-pipe-guard: OK');
