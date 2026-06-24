'use strict';

const TRACEBUD_IMPORT_V1_FORMAT = 'tracebud_import_v1';

function sortObjectKeys(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sortObjectKeys(entry));
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = sortObjectKeys(value[key]);
        return accumulator;
      }, {});
  }
  return value;
}

function canonicalizeTracebudImportV1ForHash(pkg) {
  const payload = { ...pkg };
  delete payload.content_hash_sha256;
  delete payload.signature;
  return sortObjectKeys(payload);
}

function getTracebudImportV1CanonicalMessage(pkg) {
  return JSON.stringify(canonicalizeTracebudImportV1ForHash(pkg));
}

function parseTracebudImportV1PackageSignature(pkg) {
  const signature = pkg.signature;
  if (!signature) return null;
  if (typeof signature === 'string') {
    throw new Error(
      'signature must be an object with algorithm, kid, and value. Legacy string signatures are not supported.',
    );
  }
  if (typeof signature !== 'object' || signature === null) {
    throw new Error('signature must be an object with algorithm, kid, and value.');
  }
  const algorithm = String(signature.algorithm ?? '')
    .trim()
    .toLowerCase();
  const kid = String(signature.kid ?? '').trim();
  const value = String(signature.value ?? '').trim();
  if (algorithm !== 'ed25519') {
    throw new Error('Only ed25519 package signatures are supported.');
  }
  if (!kid || !value) {
    throw new Error('signature.kid and signature.value are required.');
  }
  return { algorithm: 'ed25519', kid, value };
}

function assertTracebudImportV1PackageShape(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Import package must be a JSON object.');
  }
  const root = parsed;
  if (root.format_version !== TRACEBUD_IMPORT_V1_FORMAT) {
    throw new Error(`format_version must be "${TRACEBUD_IMPORT_V1_FORMAT}".`);
  }
  if (!String(root.source_system ?? '').trim()) {
    throw new Error('source_system is required.');
  }
  if (!String(root.exported_at ?? '').trim()) {
    throw new Error('exported_at is required.');
  }
  if (!Array.isArray(root.producers) || !Array.isArray(root.plots)) {
    throw new Error('producers and plots must be arrays.');
  }
  return root;
}

module.exports = {
  TRACEBUD_IMPORT_V1_FORMAT,
  canonicalizeTracebudImportV1ForHash,
  getTracebudImportV1CanonicalMessage,
  parseTracebudImportV1PackageSignature,
  assertTracebudImportV1PackageShape,
};
