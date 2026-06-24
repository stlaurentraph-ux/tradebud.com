declare module '@tracebud/import-v1-canonical' {
  export const TRACEBUD_IMPORT_V1_FORMAT: 'tracebud_import_v1';

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

  export function canonicalizeTracebudImportV1ForHash(
    pkg: TracebudImportV1PackageInput,
  ): Record<string, unknown>;

  export function getTracebudImportV1CanonicalMessage(pkg: TracebudImportV1PackageInput): string;

  export function parseTracebudImportV1PackageSignature(
    pkg: TracebudImportV1PackageInput,
  ): TracebudImportV1PackageSignature | null;

  export function assertTracebudImportV1PackageShape(parsed: unknown): TracebudImportV1PackageInput;
}
