import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const baselinePath = resolve(process.cwd(), 'queue-i18n-baseline-metadata.json');
const schemaPath = resolve(process.cwd(), '../../docs/openapi/queue-i18n-baseline-metadata.schema.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertType(value, allowedTypes) {
  if (value === null) return allowedTypes.includes('null');
  const t = typeof value;
  return allowedTypes.includes(t);
}

function main() {
  if (!existsSync(baselinePath)) {
    process.stdout.write('PASS queue i18n baseline schema assertion (no baseline file present)\n');
    return;
  }
  assert(existsSync(schemaPath), `Missing schema file: ${schemaPath}`);
  const payload = readJson(baselinePath);
  const schema = readJson(schemaPath);

  const required = Array.isArray(schema.required) ? schema.required : [];
  const properties = schema.properties && typeof schema.properties === 'object' ? schema.properties : {};
  const allowAdditional = Boolean(schema.additionalProperties);

  assert(payload && typeof payload === 'object' && !Array.isArray(payload), 'Baseline payload must be an object.');

  for (const key of required) {
    assert(Object.prototype.hasOwnProperty.call(payload, key), `Missing required key: ${key}`);
  }

  for (const key of Object.keys(payload)) {
    if (!Object.prototype.hasOwnProperty.call(properties, key)) {
      assert(allowAdditional, `Unexpected key in baseline payload: ${key}`);
      continue;
    }
    const def = properties[key];
    const allowedTypes = Array.isArray(def?.type) ? def.type : [def?.type].filter(Boolean);
    if (allowedTypes.length > 0) {
      assert(assertType(payload[key], allowedTypes), `Invalid type for key ${key}. Expected ${allowedTypes.join('|')}.`);
    }
    if (
      typeof payload[key] === 'string' &&
      typeof def?.minLength === 'number' &&
      payload[key].length < def.minLength
    ) {
      throw new Error(`Invalid minLength for key ${key}.`);
    }
  }

  process.stdout.write('PASS queue i18n baseline schema assertion\n');
}

try {
  main();
} catch (error) {
  process.stderr.write(`FAIL queue i18n baseline schema assertion: ${error.message}\n`);
  process.exitCode = 1;
}
