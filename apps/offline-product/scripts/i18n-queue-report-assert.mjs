import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const reportPath = resolve(process.cwd(), 'queue-i18n-report.json');
const schemaPath = resolve(process.cwd(), '../../docs/openapi/queue-i18n-report.schema.json');

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
  if (allowedTypes.includes('array') && Array.isArray(value)) {
    return true;
  }
  if (allowedTypes.includes('object') && typeof value === 'object' && !Array.isArray(value)) {
    return true;
  }
  if (allowedTypes.includes('integer') && typeof value === 'number' && Number.isInteger(value)) {
    return true;
  }
  return allowedTypes.includes(typeof value);
}

function validateObject(payload, schema, path) {
  assert(payload && typeof payload === 'object' && !Array.isArray(payload), `${path} must be an object.`);

  const required = Array.isArray(schema.required) ? schema.required : [];
  const properties = schema.properties && typeof schema.properties === 'object' ? schema.properties : {};
  const allowAdditional = Boolean(schema.additionalProperties);

  for (const key of required) {
    assert(Object.prototype.hasOwnProperty.call(payload, key), `${path}.${key} is required.`);
  }

  for (const key of Object.keys(payload)) {
    const keyPath = `${path}.${key}`;
    const def = properties[key];
    if (!def) {
      assert(allowAdditional, `${keyPath} is not allowed.`);
      continue;
    }
    const allowedTypes = Array.isArray(def.type) ? def.type : [def.type].filter(Boolean);
    if (allowedTypes.length > 0) {
      assert(assertType(payload[key], allowedTypes), `${keyPath} has invalid type.`);
    }

    if (typeof payload[key] === 'string' && typeof def.minLength === 'number') {
      assert(payload[key].length >= def.minLength, `${keyPath} is shorter than minLength ${def.minLength}.`);
    }

    if (Array.isArray(payload[key]) && def.type === 'array') {
      const itemDef = def.items ?? {};
      for (let idx = 0; idx < payload[key].length; idx += 1) {
        const item = payload[key][idx];
        const itemPath = `${keyPath}[${idx}]`;
        if (itemDef.type) {
          assert(assertType(item, [itemDef.type]), `${itemPath} has invalid type.`);
        }
        if (typeof item === 'string' && typeof itemDef.minLength === 'number') {
          assert(item.length >= itemDef.minLength, `${itemPath} is shorter than minLength ${itemDef.minLength}.`);
        }
      }
    }

    if (payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key]) && def.type === 'object') {
      validateObject(payload[key], def, keyPath);
    }
  }
}

function main() {
  assert(existsSync(reportPath), `Missing report: ${reportPath}`);
  assert(existsSync(schemaPath), `Missing schema: ${schemaPath}`);

  const report = readJson(reportPath);
  const schema = readJson(schemaPath);

  validateObject(report, schema, 'report');

  if (report.baseline !== null) {
    validateObject(report.baseline, schema.properties.baseline, 'report.baseline');
  }

  assert(report.current.status === 'PASS', 'report.current.status must be PASS.');
  assert(report.current.locales.includes('en') && report.current.locales.includes('es'), 'report.current.locales must include en and es.');
  assert(report.schemaDigestAlgorithm === 'sha256', 'report.schemaDigestAlgorithm must be "sha256".');
  assert(
    typeof report.schemaDigestRef === 'string' && /^sha256:[a-f0-9]{64}$/.test(report.schemaDigestRef),
    'report.schemaDigestRef must be formatted as sha256:<64-char-hex>.',
  );
  assert(
    typeof report.schemaSha256 === 'string' && /^[a-f0-9]{64}$/.test(report.schemaSha256),
    'report.schemaSha256 must be a lowercase 64-character hex digest.',
  );
  const expectedSchemaSha256 = createHash('sha256').update(readFileSync(schemaPath)).digest('hex');
  assert(report.schemaDigestRef === `sha256:${expectedSchemaSha256}`, 'report.schemaDigestRef must match schema digest reference.');
  assert(report.schemaSha256 === expectedSchemaSha256, 'report.schemaSha256 must match queue i18n report schema file digest.');

  const comp = report.comparison ?? {};
  assert(
    comp.previousSchemaDigestRef === null || /^sha256:[a-f0-9]{64}$/.test(comp.previousSchemaDigestRef),
    'report.comparison.previousSchemaDigestRef must be null or a valid schemaDigestRef token.',
  );
  assert(
    (comp.previousSchemaDigestRef === null && comp.schemaDigestRefChanged === null) ||
      (comp.previousSchemaDigestRef !== null && typeof comp.schemaDigestRefChanged === 'boolean'),
    'report.comparison.schemaDigestRefChanged must be null iff previousSchemaDigestRef is null.',
  );

  process.stdout.write('PASS queue i18n combined report schema assertion\n');
}

try {
  main();
} catch (error) {
  process.stderr.write(`FAIL queue i18n combined report schema assertion: ${error.message}\n`);
  process.exitCode = 1;
}
