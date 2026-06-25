import { unzipSync } from 'fflate';
import type { TracebudImportV1EvidenceReference } from '@/lib/bulk-plot-import-package';

export type BulkPlotImportEvidenceKind =
  | 'fpic_repository'
  | 'protected_area_permit'
  | 'labor_evidence'
  | 'tenure_evidence';

export type MatchedBulkPlotImportEvidenceFile = {
  reference: TracebudImportV1EvidenceReference;
  zipPath: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
};

const DOCUMENT_TYPE_TO_KIND: Record<string, BulkPlotImportEvidenceKind> = {
  land_title: 'tenure_evidence',
  tenure: 'tenure_evidence',
  tenure_evidence: 'tenure_evidence',
  fpic: 'fpic_repository',
  consent: 'fpic_repository',
  consent_form: 'fpic_repository',
  protected_area_permit: 'protected_area_permit',
  permit: 'protected_area_permit',
  import_permit: 'protected_area_permit',
  labor: 'labor_evidence',
  labor_evidence: 'labor_evidence',
};

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  webp: 'image/webp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function mapDocumentTypeToEvidenceKind(documentType: string | null | undefined): BulkPlotImportEvidenceKind {
  const normalized = documentType?.trim().toLowerCase() ?? '';
  return DOCUMENT_TYPE_TO_KIND[normalized] ?? 'tenure_evidence';
}

export function inferMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream';
}

export function readZipFileEntries(bytes: Uint8Array): Map<string, Uint8Array> {
  const entries = new Map<string, Uint8Array>();
  const unzipped = unzipSync(bytes);
  for (const [path, data] of Object.entries(unzipped)) {
    if (path.endsWith('/')) continue;
    entries.set(path, data);
    const baseName = path.split('/').pop() ?? path;
    if (!entries.has(baseName)) {
      entries.set(baseName, data);
    }
  }
  return entries;
}

function basenameWithoutExtension(fileName: string): string {
  const base = fileName.split('/').pop() ?? fileName;
  const dotIndex = base.lastIndexOf('.');
  return dotIndex > 0 ? base.slice(0, dotIndex) : base;
}

function findZipEntryForReference(
  reference: TracebudImportV1EvidenceReference,
  zipEntries: Map<string, Uint8Array>,
): { zipPath: string; bytes: Uint8Array } | null {
  const candidates = new Set<string>();
  const documentRef = reference.document_ref.trim();
  if (reference.file_name?.trim()) {
    candidates.add(reference.file_name.trim());
  }
  candidates.add(documentRef);
  for (const extension of ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp', 'tif', 'tiff']) {
    candidates.add(`${documentRef}.${extension}`);
  }

  for (const candidate of candidates) {
    const direct = zipEntries.get(candidate);
    if (direct) {
      return { zipPath: candidate, bytes: direct };
    }
  }

  for (const [zipPath, bytes] of zipEntries.entries()) {
    if (basenameWithoutExtension(zipPath) === documentRef) {
      return { zipPath, bytes };
    }
  }

  return null;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function matchEvidenceReferencesToZipFiles(params: {
  references: TracebudImportV1EvidenceReference[];
  zipBytes: Uint8Array;
}): Promise<{ matched: MatchedBulkPlotImportEvidenceFile[]; missing: TracebudImportV1EvidenceReference[] }> {
  const zipEntries = readZipFileEntries(params.zipBytes);
  const matched: MatchedBulkPlotImportEvidenceFile[] = [];
  const missing: TracebudImportV1EvidenceReference[] = [];

  for (const reference of params.references) {
    if (!reference.client_plot_id?.trim()) {
      throw new Error(`Evidence reference ${reference.document_ref} is missing client_plot_id.`);
    }

    const zipMatch = findZipEntryForReference(reference, zipEntries);
    if (!zipMatch) {
      missing.push(reference);
      continue;
    }

    const fileName = zipMatch.zipPath.split('/').pop() ?? zipMatch.zipPath;
    if (reference.file_hash_sha256?.trim()) {
      const actual = await sha256Hex(zipMatch.bytes);
      if (actual.toLowerCase() !== reference.file_hash_sha256.trim().toLowerCase()) {
        throw new Error(
          `Evidence file ${reference.document_ref} hash mismatch. Expected ${reference.file_hash_sha256}, got ${actual}.`,
        );
      }
    }

    matched.push({
      reference,
      zipPath: zipMatch.zipPath,
      fileName,
      mimeType: inferMimeTypeFromFileName(fileName),
      bytes: zipMatch.bytes,
    });
  }

  return { matched, missing };
}

export function matchedEvidenceToImportItems(matched: MatchedBulkPlotImportEvidenceFile[]) {
  return matched.map((entry) => ({
    clientPlotId: entry.reference.client_plot_id.trim(),
    documentRef: entry.reference.document_ref.trim(),
    evidenceKind: mapDocumentTypeToEvidenceKind(entry.reference.document_type),
    mimeType: entry.mimeType,
    fileName: entry.fileName,
    contentBase64: bytesToBase64(entry.bytes),
    expectedSha256: entry.reference.file_hash_sha256 ?? null,
  }));
}

export async function buildEvidenceImportItemsFromZip(params: {
  references: TracebudImportV1EvidenceReference[];
  zipBytes: Uint8Array;
}) {
  const { matched, missing } = await matchEvidenceReferencesToZipFiles(params);
  return {
    items: matchedEvidenceToImportItems(matched),
    missingDocumentRefs: missing.map((reference) => reference.document_ref),
  };
}
