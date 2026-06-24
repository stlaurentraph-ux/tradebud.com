import { createHash } from 'crypto';

export const TRACEBUD_IMPORT_V1_FORMAT = 'tracebud_import_v1';

export type TracebudImportV1PackageSignature = {
  algorithm: 'ed25519';
  kid: string;
  value: string;
};

export type TracebudImportV1PackageInput = {
  format_version: string;
  source_system: string;
  exported_at: string;
  content_hash_sha256?: string;
  signature?: TracebudImportV1PackageSignature | string | null;
  producers: unknown[];
  plots: unknown[];
  evidence_references?: unknown[];
  [key: string]: unknown;
};

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortObjectKeys(entry));
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {});
  }
  return value;
}

export function canonicalizeTracebudImportV1ForHash(
  pkg: TracebudImportV1PackageInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...pkg };
  delete payload.content_hash_sha256;
  delete payload.signature;
  return sortObjectKeys(payload) as Record<string, unknown>;
}

export function getTracebudImportV1CanonicalMessage(pkg: TracebudImportV1PackageInput): string {
  return JSON.stringify(canonicalizeTracebudImportV1ForHash(pkg));
}

export function computeTracebudImportV1ContentHash(pkg: TracebudImportV1PackageInput): string {
  return createHash('sha256').update(getTracebudImportV1CanonicalMessage(pkg), 'utf8').digest('hex');
}

export function assertTracebudImportV1PackageShape(parsed: unknown): TracebudImportV1PackageInput {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Import package must be a JSON object.');
  }
  const root = parsed as Partial<TracebudImportV1PackageInput>;
  if (root.format_version !== TRACEBUD_IMPORT_V1_FORMAT) {
    throw new Error(`format_version must be "${TRACEBUD_IMPORT_V1_FORMAT}".`);
  }
  if (!root.source_system?.trim()) {
    throw new Error('source_system is required.');
  }
  if (!root.exported_at?.trim()) {
    throw new Error('exported_at is required.');
  }
  if (!Array.isArray(root.producers) || !Array.isArray(root.plots)) {
    throw new Error('producers and plots must be arrays.');
  }
  return root as TracebudImportV1PackageInput;
}

export function parseTracebudImportV1PackageSignature(
  pkg: TracebudImportV1PackageInput,
): TracebudImportV1PackageSignature | null {
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
  const algorithm = signature.algorithm?.trim().toLowerCase();
  const kid = signature.kid?.trim();
  const value = signature.value?.trim();
  if (algorithm !== 'ed25519') {
    throw new Error('Only ed25519 package signatures are supported.');
  }
  if (!kid || !value) {
    throw new Error('signature.kid and signature.value are required.');
  }
  return { algorithm: 'ed25519', kid, value };
}
