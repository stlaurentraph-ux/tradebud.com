#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';
import YAML from 'yaml';

const REPO_ROOT = process.cwd();
const DTO_PATH = path.join(
  REPO_ROOT,
  'tracebud-backend/src/harvest/dto/dds-package-evidence-document.dto.ts',
);
const OPENAPI_PATH = path.join(REPO_ROOT, 'docs/openapi/tracebud-v1-draft.yaml');

const DTO_CLASS_NAME = 'DdsPackageEvidenceDocumentDto';
const OPENAPI_SCHEMA_NAME = 'DdsPackageEvidenceDocument';
const PARITY_JSON_SCHEMA_VERSION = 1;

function createParityError(code, message, details = null) {
  const detailText =
    details && typeof details === 'object'
      ? `\n${JSON.stringify(details)}`
      : details
        ? `\n${String(details)}`
        : '';
  return new Error(`[${code}] ${message}${detailText}`);
}

function parseParityError(error) {
  const raw = error instanceof Error ? error.message : String(error);
  const match = raw.match(/^\[([A-Z0-9_]+)\]\s*([^\n]*)(?:\n([\s\S]+))?$/);
  if (!match) {
    return {
      code: 'EVIDENCE_DOC_PARITY_UNKNOWN',
      message: raw,
      details: null,
    };
  }
  const [, code, message, detailsRaw] = match;
  let details = null;
  if (detailsRaw) {
    try {
      details = JSON.parse(detailsRaw);
    } catch {
      details = detailsRaw;
    }
  }
  return { code, message, details };
}

function parseCliOptions(argv) {
  const options = { json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dto') {
      options.dtoPath = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--openapi') {
      options.openapiPath = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--json') {
      options.json = true;
      continue;
    }
  }
  return options;
}

function extractObjectLiteralByCallExpression(node) {
  if (!node || !ts.isCallExpression(node)) return null;
  const firstArg = node.arguments?.[0];
  return firstArg && ts.isObjectLiteralExpression(firstArg) ? firstArg : null;
}

function getObjectLiteralStringProperty(objectLiteral, propertyName) {
  const prop = objectLiteral.properties.find(
    (entry) =>
      ts.isPropertyAssignment(entry) &&
      ts.isIdentifier(entry.name) &&
      entry.name.text === propertyName,
  );
  if (!prop || !ts.isStringLiteralLike(prop.initializer)) {
    return null;
  }
  return prop.initializer.text;
}

function getObjectLiteralBooleanProperty(objectLiteral, propertyName) {
  const prop = objectLiteral.properties.find(
    (entry) =>
      ts.isPropertyAssignment(entry) &&
      ts.isIdentifier(entry.name) &&
      entry.name.text === propertyName,
  );
  if (!prop) return false;
  if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (prop.initializer.kind === ts.SyntaxKind.FalseKeyword) return false;
  return false;
}

function getObjectLiteralEnumReference(objectLiteral) {
  const prop = objectLiteral.properties.find(
    (entry) =>
      ts.isPropertyAssignment(entry) &&
      ts.isIdentifier(entry.name) &&
      entry.name.text === 'enum',
  );
  if (!prop) return null;
  if (ts.isIdentifier(prop.initializer)) {
    return prop.initializer.text;
  }
  return null;
}

function parseDtoContract(dtoText) {
  const sourceFile = ts.createSourceFile(DTO_PATH, dtoText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const enumValuesByName = {};
  let dtoClassNode = null;

  for (const statement of sourceFile.statements) {
    if (ts.isEnumDeclaration(statement)) {
      const enumName = statement.name.text;
      const values = statement.members
        .map((member) => member.initializer)
        .filter((init) => !!init && ts.isStringLiteralLike(init))
        .map((init) => init.text);
      if (values.length > 0) {
        enumValuesByName[enumName] = values;
      }
    }
    if (ts.isClassDeclaration(statement) && statement.name?.text === DTO_CLASS_NAME) {
      dtoClassNode = statement;
    }
  }

  if (!enumValuesByName.DdsPackageEvidenceDocumentType) {
    throw createParityError(
      'EVIDENCE_DOC_PARITY_DTO_ENUM_MISSING',
      'Missing enum values for DdsPackageEvidenceDocumentType',
    );
  }
  if (!enumValuesByName.DdsPackageEvidenceDocumentReviewStatus) {
    throw createParityError(
      'EVIDENCE_DOC_PARITY_DTO_ENUM_MISSING',
      'Missing enum values for DdsPackageEvidenceDocumentReviewStatus',
    );
  }
  if (!dtoClassNode) {
    throw createParityError('EVIDENCE_DOC_PARITY_DTO_CLASS_MISSING', `Missing DTO class: ${DTO_CLASS_NAME}`);
  }

  const fields = {};
  for (const member of dtoClassNode.members) {
    if (!ts.isPropertyDeclaration(member) || !ts.isIdentifier(member.name)) continue;
    const fieldName = member.name.text;
    const typeNodeText = member.type?.getText(sourceFile) ?? '';
    const decorators = ts.getDecorators(member) ?? [];
    const apiPropertyDecorator = decorators.find((decorator) => {
      if (!ts.isCallExpression(decorator.expression)) return false;
      const callExpression = decorator.expression;
      return ts.isIdentifier(callExpression.expression) && callExpression.expression.text === 'ApiProperty';
    });
    if (!apiPropertyDecorator) continue;

    const call = apiPropertyDecorator.expression;
    const options = extractObjectLiteralByCallExpression(call);
    if (!options) {
      throw createParityError(
        'EVIDENCE_DOC_PARITY_DTO_DECORATOR_OPTIONS_MISSING',
        `Missing ApiProperty options object for DTO field: ${fieldName}`,
      );
    }
    const enumRef = getObjectLiteralEnumReference(options);
    const enumValues = enumRef ? enumValuesByName[enumRef] ?? null : null;
    const nullable = getObjectLiteralBooleanProperty(options, 'nullable');
    const format = getObjectLiteralStringProperty(options, 'format');

    if (!typeNodeText.includes('string') && !enumValues) {
      throw createParityError(
        'EVIDENCE_DOC_PARITY_DTO_FIELD_TYPE_UNSUPPORTED',
        `Unsupported DTO field type for ${fieldName}: ${typeNodeText || 'unknown'}`,
      );
    }

    fields[fieldName] = {
      type: 'string',
      nullable,
      format: format ?? null,
      enumValues,
    };
  }

  if (Object.keys(fields).length === 0) {
    throw createParityError(
      'EVIDENCE_DOC_PARITY_DTO_FIELDS_MISSING',
      `No @ApiProperty-decorated fields found in ${DTO_CLASS_NAME}`,
    );
  }
  return {
    enumValuesByName,
    fields,
  };
}

function parseOpenApiContract(openapiText) {
  const document = YAML.parse(openapiText);
  const schema = document?.components?.schemas?.[OPENAPI_SCHEMA_NAME];
  if (!schema || typeof schema !== 'object') {
    throw createParityError(
      'EVIDENCE_DOC_PARITY_OPENAPI_SCHEMA_MISSING',
      `Missing OpenAPI schema: ${OPENAPI_SCHEMA_NAME}`,
    );
  }
  const required = Array.isArray(schema.required) ? schema.required : null;
  if (!required) {
    throw createParityError(
      'EVIDENCE_DOC_PARITY_OPENAPI_REQUIRED_MISSING',
      `Missing required[] list in OpenAPI schema: ${OPENAPI_SCHEMA_NAME}`,
    );
  }
  const properties = schema.properties;
  if (!properties || typeof properties !== 'object') {
    throw createParityError(
      'EVIDENCE_DOC_PARITY_OPENAPI_PROPERTIES_MISSING',
      `Missing properties object in OpenAPI schema: ${OPENAPI_SCHEMA_NAME}`,
    );
  }

  const openapiFields = {};
  for (const [fieldName, propertySchema] of Object.entries(properties)) {
    if (!propertySchema || typeof propertySchema !== 'object') {
      throw createParityError(
        'EVIDENCE_DOC_PARITY_OPENAPI_FIELD_INVALID',
        `Invalid OpenAPI schema field: ${fieldName}`,
      );
    }
    openapiFields[fieldName] = {
      type: typeof propertySchema.type === 'string' ? propertySchema.type : null,
      nullable: propertySchema.nullable === true,
      format: typeof propertySchema.format === 'string' ? propertySchema.format : null,
      enumValues: Array.isArray(propertySchema.enum) ? propertySchema.enum.map(String) : null,
    };
  }

  const pathItem = document?.paths?.['/v1/harvest/packages/{id}/evidence-documents'];
  const exampleValue =
    pathItem?.get?.responses?.['200']?.content?.['application/json']?.examples?.default?.value;
  if (!Array.isArray(exampleValue) || exampleValue.length === 0 || typeof exampleValue[0] !== 'object') {
    throw createParityError(
      'EVIDENCE_DOC_PARITY_OPENAPI_EXAMPLE_MISSING',
      'Missing evidence-document default response example row in OpenAPI path',
    );
  }
  const exampleRow = {};
  for (const [key, value] of Object.entries(exampleValue[0])) {
    if (value === null) {
      exampleRow[key] = 'null';
    } else {
      exampleRow[key] = String(value);
    }
  }

  return {
    required,
    fields: openapiFields,
    exampleRow,
  };
}

function compareSet(label, expected, actual) {
  const expectedKey = JSON.stringify([...expected].sort());
  const actualKey = JSON.stringify([...actual].sort());
  if (expectedKey !== actualKey) {
    throw createParityError(
      'EVIDENCE_DOC_PARITY_SET_MISMATCH',
      `${label} mismatch`,
      { expected, actual },
    );
  }
}

function assertEquals(label, expected, actual) {
  if (expected !== actual) {
    throw createParityError(
      'EVIDENCE_DOC_PARITY_FIELD_MISMATCH',
      `${label} mismatch`,
      { expected: String(expected), actual: String(actual) },
    );
  }
}

function compareFieldParity(fieldName, dtoField, openapiField) {
  assertEquals(`${fieldName}.type`, dtoField.type, openapiField.type);
  assertEquals(`${fieldName}.nullable`, dtoField.nullable, openapiField.nullable);
  assertEquals(`${fieldName}.format`, dtoField.format ?? null, openapiField.format ?? null);
  if (dtoField.enumValues || openapiField.enumValues) {
    compareSet(
      `${fieldName}.enum`,
      dtoField.enumValues ?? [],
      openapiField.enumValues ?? [],
    );
  }
}

function compareExampleParity(dtoFields, openapiExample) {
  compareSet(
    'OpenAPI evidence-doc example keys',
    Object.keys(dtoFields),
    Object.keys(openapiExample),
  );
  for (const [fieldName, dtoField] of Object.entries(dtoFields)) {
    const value = openapiExample[fieldName];
    if (value === undefined) {
      throw createParityError(
        'EVIDENCE_DOC_PARITY_EXAMPLE_FIELD_MISSING',
        `OpenAPI evidence-doc example missing field: ${fieldName}`,
      );
    }
    if (dtoField.enumValues && !dtoField.enumValues.includes(value)) {
      throw createParityError(
        'EVIDENCE_DOC_PARITY_EXAMPLE_ENUM_INVALID',
        `${fieldName} example value is outside DTO enum`,
        { value, allowed: dtoField.enumValues },
      );
    }
    if (!dtoField.nullable && String(value).toLowerCase() === 'null') {
      throw createParityError(
        'EVIDENCE_DOC_PARITY_EXAMPLE_NON_NULLABLE_NULL',
        `${fieldName} example value cannot be null`,
      );
    }
  }
}

async function main() {
  const cliOptions = parseCliOptions(process.argv.slice(2));
  const dtoPath = cliOptions.dtoPath
    ? path.resolve(REPO_ROOT, cliOptions.dtoPath)
    : DTO_PATH;
  const openapiPath = cliOptions.openapiPath
    ? path.resolve(REPO_ROOT, cliOptions.openapiPath)
    : OPENAPI_PATH;

  const [dtoText, openapiText] = await Promise.all([
    fs.readFile(dtoPath, 'utf8'),
    fs.readFile(openapiPath, 'utf8'),
  ]);

  const dtoContract = parseDtoContract(dtoText);
  const dtoTypeValues = dtoContract.enumValuesByName.DdsPackageEvidenceDocumentType;
  const dtoReviewValues = dtoContract.enumValuesByName.DdsPackageEvidenceDocumentReviewStatus;
  const dtoFields = dtoContract.fields;

  const openapiContract = parseOpenApiContract(openapiText);
  const openapiTypeValues = openapiContract.fields.type?.enumValues ?? [];
  const openapiReviewValues = openapiContract.fields.reviewStatus?.enumValues ?? [];
  const openapiRequired = openapiContract.required;
  const openapiExample = openapiContract.exampleRow;

  compareSet('DdsPackageEvidenceDocument.type', dtoTypeValues, openapiTypeValues);
  compareSet('DdsPackageEvidenceDocument.reviewStatus', dtoReviewValues, openapiReviewValues);
  compareSet('DdsPackageEvidenceDocument.required fields', Object.keys(dtoFields), openapiRequired);

  for (const [fieldName, dtoField] of Object.entries(dtoFields)) {
    const openapiField = openapiContract.fields[fieldName];
    if (!openapiField) {
      throw createParityError(
        'EVIDENCE_DOC_PARITY_OPENAPI_FIELD_MISSING',
        `Missing OpenAPI schema field: ${fieldName}`,
      );
    }
    compareFieldParity(fieldName, dtoField, openapiField);
  }

  compareExampleParity(dtoFields, openapiExample);

  const payload = {
    status: 'PASS',
    schemaVersion: PARITY_JSON_SCHEMA_VERSION,
    checks: {
      typeEnumValues: dtoTypeValues,
      reviewStatusEnumValues: dtoReviewValues,
      requiredFields: Object.keys(dtoFields),
      fieldChecks: ['type', 'format', 'nullable', 'enum'],
      exampleParity: ['keys', 'enum_validity', 'non_nullable_non_null'],
    },
  };

  if (cliOptions.json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  process.stdout.write(
    `PASS evidence-doc contract parity\n` +
      `- type enum values: ${dtoTypeValues.join(', ')}\n` +
      `- reviewStatus enum values: ${dtoReviewValues.join(', ')}\n` +
      `- required field set parity: ${Object.keys(dtoFields).join(', ')}\n` +
      `- field parity checks: type, format, nullable, enum\n` +
      `- OpenAPI example row parity: keys + enum validity\n`,
  );
}

main().catch((error) => {
  const cliOptions = parseCliOptions(process.argv.slice(2));
  const parityError = parseParityError(error);
  if (cliOptions.json) {
    process.stderr.write(
      `${JSON.stringify(
        {
          status: 'FAIL',
          schemaVersion: PARITY_JSON_SCHEMA_VERSION,
          code: parityError.code,
          message: parityError.message,
          details: parityError.details,
        },
        null,
        2,
      )}\n`,
    );
    process.exitCode = 1;
    return;
  }
  process.stderr.write(`FAIL evidence-doc contract parity: [${parityError.code}] ${parityError.message}\n`);
  process.exitCode = 1;
});
