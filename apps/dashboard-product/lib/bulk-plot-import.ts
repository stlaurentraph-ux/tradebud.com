import { DASHBOARD_EVENTS, trackDashboardEvent } from '@/lib/observability/analytics';
import type {
  TracebudImportV1Package,
  TracebudImportV1PackageVerification,
} from '@/lib/bulk-plot-import-package';

export type BulkPlotImportPreviewRow = {
  rowIndex: number;
  clientPlotId: string;
  producerLabel: string;
  status: 'READY' | 'VALIDATION_FAILED';
  geometryKind: 'point' | 'polygon' | null;
  declaredAreaHa: number | null;
  message?: string;
};

export type BulkPlotImportPreviewResponse = {
  totalRows: number;
  readyCount: number;
  failedCount: number;
  rows: BulkPlotImportPreviewRow[];
  summaryOnly?: boolean;
};

export type BulkPlotImportJobStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PARTIAL';

export type BulkPlotImportJobResponse = {
  id: string;
  status: BulkPlotImportJobStatus;
  importType: 'PLOTS';
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  failureCount: number;
  duplicateSkippedCount: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  errorSummary?: Record<string, unknown> | null;
};

export const BULK_PLOT_IMPORT_SYNC_MAX_ROWS = 500;

export type BulkPlotImportExecuteRow = {
  rowIndex: number;
  clientPlotId: string;
  producerLabel: string;
  status: 'IMPORTED' | 'DUPLICATE_SKIPPED' | 'VALIDATION_FAILED' | 'FAILED';
  plotId?: string;
  producerContactId?: string;
  message?: string;
};

export type BulkPlotImportExecuteResponse = {
  totalRows: number;
  importedCount: number;
  duplicateSkippedCount: number;
  failedCount: number;
  rows: BulkPlotImportExecuteRow[];
};

export type BulkPlotImportGeoJsonGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'Polygon'; coordinates: [number, number][][] };

export type BulkPlotImportInputRow = {
  rowIndex?: number;
  producerFullName?: string;
  producerEmail?: string;
  producerPhone?: string | null;
  producerCountry?: string | null;
  producerContactId?: string | null;
  plotName?: string | null;
  clientPlotId: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  declaredAreaHa?: string | number | null;
  cadastralKey?: string | null;
  countryCode?: string | null;
  geometry?: BulkPlotImportGeoJsonGeometry | null;
};

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : `Bulk plot import failed (${response.status}).`;
    throw new Error(message);
  }
  return payload as T;
}

export async function verifyBulkPlotImportPackage(
  importPackage: TracebudImportV1Package,
): Promise<TracebudImportV1PackageVerification> {
  const result = await requestJson<TracebudImportV1PackageVerification>('/api/imports/plots/packages/verify', {
    method: 'POST',
    body: JSON.stringify({ importPackage }),
  });
  trackDashboardEvent(
    result.signatureStatus === 'verified'
      ? DASHBOARD_EVENTS.BULK_PLOT_IMPORT_PACKAGE_SIGNATURE_VERIFIED
      : result.signatureStatus === 'failed'
        ? DASHBOARD_EVENTS.BULK_PLOT_IMPORT_PACKAGE_SIGNATURE_FAILED
        : DASHBOARD_EVENTS.BULK_PLOT_IMPORT_PACKAGE_UNSIGNED,
    {
      kid: result.kid ?? undefined,
      source_system: importPackage.source_system,
    },
  );
  return result;
}

export type BulkPlotImportSigningKey = {
  id: string;
  kid: string;
  algorithm: 'ed25519';
  label: string;
  publicKeyFingerprint: string;
  revokedAt: string | null;
  createdAt: string;
};

export type BulkPlotImportPolicy = {
  tenantId: string;
  requireSignedPackages: boolean;
  acceptIntegratorSignatures: boolean;
  updatedAt: string | null;
};

export type BulkPlotImportIntegratorKey = {
  id: string;
  integratorId: string;
  kid: string;
  algorithm: 'ed25519';
  label: string;
  allowedSourceSystems: string[];
  publicKeyFingerprint: string;
  revokedAt: string | null;
};

export async function getBulkPlotImportPolicy(): Promise<BulkPlotImportPolicy> {
  return requestJson<BulkPlotImportPolicy>('/api/imports/plots/policy', { method: 'GET' });
}

export async function updateBulkPlotImportPolicy(input: {
  requireSignedPackages?: boolean;
  acceptIntegratorSignatures?: boolean;
}): Promise<BulkPlotImportPolicy> {
  const result = await requestJson<BulkPlotImportPolicy>('/api/imports/plots/policy', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  trackDashboardEvent(DASHBOARD_EVENTS.BULK_PLOT_IMPORT_POLICY_UPDATED, {
    require_signed_packages: result.requireSignedPackages,
    accept_integrator_signatures: result.acceptIntegratorSignatures,
  });
  return result;
}

export async function listBulkPlotImportIntegratorKeys(): Promise<BulkPlotImportIntegratorKey[]> {
  return requestJson<BulkPlotImportIntegratorKey[]>('/api/imports/plots/integrator-keys', { method: 'GET' });
}

export async function listBulkPlotImportSigningKeys(): Promise<BulkPlotImportSigningKey[]> {
  return requestJson<BulkPlotImportSigningKey[]>('/api/imports/plots/signing-keys', { method: 'GET' });
}

export async function registerBulkPlotImportSigningKey(input: {
  kid: string;
  label: string;
  publicKeyPem: string;
}): Promise<BulkPlotImportSigningKey> {
  return requestJson<BulkPlotImportSigningKey>('/api/imports/plots/signing-keys', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function revokeBulkPlotImportSigningKey(keyId: string): Promise<BulkPlotImportSigningKey> {
  return requestJson<BulkPlotImportSigningKey>(`/api/imports/plots/signing-keys/${keyId}/revoke`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function previewBulkPlotImport(
  rows: BulkPlotImportInputRow[],
  options?: { summaryOnly?: boolean; importPackage?: TracebudImportV1Package | null },
): Promise<BulkPlotImportPreviewResponse> {
  trackDashboardEvent(DASHBOARD_EVENTS.BULK_PLOT_IMPORT_PREVIEW, {
    row_count: rows.length,
    summary_only: options?.summaryOnly === true,
  });
  return requestJson<BulkPlotImportPreviewResponse>('/api/imports/plots/preview', {
    method: 'POST',
    body: JSON.stringify({
      rows,
      summaryOnly: options?.summaryOnly === true,
      importPackage: options?.importPackage ?? undefined,
    }),
  });
}

export async function executeBulkPlotImport(
  rows: BulkPlotImportInputRow[],
  options?: { importPackage?: TracebudImportV1Package | null },
): Promise<BulkPlotImportExecuteResponse> {
  try {
    const result = await requestJson<BulkPlotImportExecuteResponse>('/api/imports/plots', {
      method: 'POST',
      body: JSON.stringify({
        rows,
        importPackage: options?.importPackage ?? undefined,
      }),
    });
    trackDashboardEvent(DASHBOARD_EVENTS.BULK_PLOT_IMPORT_SUCCESS, {
      row_count: result.totalRows,
      imported_count: result.importedCount,
      failed_count: result.failedCount,
    });
    return result;
  } catch (error) {
    trackDashboardEvent(DASHBOARD_EVENTS.BULK_PLOT_IMPORT_FAILURE, {
      row_count: rows.length,
      message: error instanceof Error ? error.message : 'unknown',
    });
    throw error;
  }
}

export async function queueBulkPlotImportJob(
  rows: BulkPlotImportInputRow[],
  options?: { importPackage?: TracebudImportV1Package | null },
): Promise<BulkPlotImportJobResponse> {
  trackDashboardEvent(DASHBOARD_EVENTS.BULK_PLOT_IMPORT_JOB_QUEUED, { row_count: rows.length });
  return requestJson<BulkPlotImportJobResponse>('/api/imports/plots/jobs', {
    method: 'POST',
    body: JSON.stringify({
      rows,
      importPackage: options?.importPackage ?? undefined,
    }),
  });
}

export async function getBulkPlotImportJob(jobId: string): Promise<BulkPlotImportJobResponse> {
  return requestJson<BulkPlotImportJobResponse>(`/api/imports/plots/jobs/${jobId}`, {
    method: 'GET',
  });
}

export function isBulkPlotImportJobTerminal(status: BulkPlotImportJobStatus): boolean {
  return status === 'COMPLETED' || status === 'FAILED' || status === 'PARTIAL';
}

export type BulkPlotImportEvidenceExecuteRow = {
  clientPlotId: string;
  documentRef: string;
  status: 'IMPORTED' | 'VALIDATION_FAILED' | 'FAILED';
  plotId?: string;
  message?: string;
};

export type BulkPlotImportEvidenceExecuteResponse = {
  totalItems: number;
  importedCount: number;
  failedCount: number;
  rows: BulkPlotImportEvidenceExecuteRow[];
};

export type BulkPlotImportEvidenceItemPayload = {
  clientPlotId: string;
  documentRef: string;
  evidenceKind: 'fpic_repository' | 'protected_area_permit' | 'labor_evidence' | 'tenure_evidence';
  mimeType: string;
  fileName: string;
  contentBase64: string;
  expectedSha256?: string | null;
};

export async function executeBulkPlotImportEvidence(
  items: BulkPlotImportEvidenceItemPayload[],
): Promise<BulkPlotImportEvidenceExecuteResponse> {
  try {
    const result = await requestJson<BulkPlotImportEvidenceExecuteResponse>('/api/imports/plots/evidence', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
    trackDashboardEvent(DASHBOARD_EVENTS.BULK_PLOT_IMPORT_EVIDENCE_SUCCESS, {
      item_count: result.totalItems,
      imported_count: result.importedCount,
      failed_count: result.failedCount,
    });
    return result;
  } catch (error) {
    trackDashboardEvent(DASHBOARD_EVENTS.BULK_PLOT_IMPORT_EVIDENCE_FAILURE, {
      item_count: items.length,
      message: error instanceof Error ? error.message : 'unknown',
    });
    throw error;
  }
}
