import { createHash } from 'crypto';
import {
  TRACEBUD_IMPORT_V1_FORMAT,
  assertTracebudImportV1PackageShape,
  canonicalizeTracebudImportV1ForHash,
  getTracebudImportV1CanonicalMessage,
  parseTracebudImportV1PackageSignature,
  type TracebudImportV1PackageInput,
  type TracebudImportV1PackageSignature,
} from '@tracebud/import-v1-canonical';

export {
  TRACEBUD_IMPORT_V1_FORMAT,
  assertTracebudImportV1PackageShape,
  canonicalizeTracebudImportV1ForHash,
  getTracebudImportV1CanonicalMessage,
  parseTracebudImportV1PackageSignature,
  type TracebudImportV1PackageInput,
  type TracebudImportV1PackageSignature,
};

export function computeTracebudImportV1ContentHash(pkg: TracebudImportV1PackageInput): string {
  return createHash('sha256').update(getTracebudImportV1CanonicalMessage(pkg), 'utf8').digest('hex');
}
