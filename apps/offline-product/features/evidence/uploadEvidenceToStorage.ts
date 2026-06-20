import { normalizeEvidenceContentType, isLocalEvidenceUri } from './evidenceContentType';
import { readLocalEvidenceBytes } from './readLocalEvidenceFile';
import { buildEvidenceStoragePath } from './buildEvidenceStoragePath';

import {
  getAuthenticatedSupabaseClient,
  getAuthenticatedSupabaseUserId,
} from '@/features/api/syncAuthSession';

export { isLocalEvidenceUri, normalizeEvidenceContentType } from './evidenceContentType';

const EVIDENCE_BUCKET = process.env.EXPO_PUBLIC_EVIDENCE_STORAGE_BUCKET ?? 'plot-evidence';

/** Signed URL lifetime sent to Tracebud audit metadata (1 year). */
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365;

export type EvidenceUploadResult =
  | { ok: true; remoteUrl: string; storagePath: string }
  | { ok: false; reason: 'not_configured' | 'not_signed_in' | 'not_local_file' | 'read_failed' | 'upload_failed'; message?: string };

/**
 * Upload a local evidence file to Supabase Storage (`plot-evidence` bucket).
 * Path: `{authUserId}/{plotId}/{kind}/{stableKey}-{label}` when stableKey is set;
 * legacy fallback uses timestamp. Must match RLS (first segment = auth.uid()).
 * Returns a signed URL for private bucket access.
 */
export async function uploadEvidenceFileToStorage(params: {
  localUri: string;
  mimeType: string | null;
  label: string | null;
  farmerId: string;
  plotId: string;
  kind: string;
  /** When set, reuses this remote path (idempotent re-sync / replace). */
  storagePath?: string | null;
  /** Stable local row id — used to derive storagePath when storagePath is omitted. */
  stableKey?: string | number | null;
}): Promise<EvidenceUploadResult> {
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    return { ok: false, reason: 'not_configured' };
  }
  if (!isLocalEvidenceUri(params.localUri)) {
    return { ok: false, reason: 'not_local_file' };
  }

  const supabase = await getAuthenticatedSupabaseClient();
  const authUserId = await getAuthenticatedSupabaseUserId();
  if (!supabase || !authUserId) {
    return { ok: false, reason: 'not_signed_in', message: 'Sign in to upload evidence files.' };
  }

  let body: ArrayBuffer;
  try {
    body = await readLocalEvidenceBytes(params.localUri);
  } catch (e) {
    return {
      ok: false,
      reason: 'read_failed',
      message: e instanceof Error ? e.message : String(e),
    };
  }

  const safeName = (params.label ?? 'evidence')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 80);
  const existingPath = params.storagePath?.trim();
  const storagePath =
    existingPath ??
    (params.stableKey != null
      ? buildEvidenceStoragePath({
          authUserId,
          plotId: params.plotId,
          kind: params.kind,
          stableKey: params.stableKey,
          label: params.label,
        })
      : `${authUserId}/${params.plotId}/${params.kind}/${Date.now()}-${safeName}`);
  const contentType = normalizeEvidenceContentType(params.mimeType, params.label, params.localUri);
  const upsert = Boolean(existingPath) || params.stableKey != null;

  try {
    const { error } = await supabase.storage.from(EVIDENCE_BUCKET).upload(storagePath, body, {
      contentType,
      upsert,
    });
    if (error) {
      return { ok: false, reason: 'upload_failed', message: error.message };
    }

    const { data: signed, error: signError } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

    if (signError || !signed?.signedUrl) {
      return {
        ok: false,
        reason: 'upload_failed',
        message: signError?.message ?? 'Could not create signed URL for uploaded file',
      };
    }

    return { ok: true, remoteUrl: signed.signedUrl, storagePath };
  } catch (e) {
    return {
      ok: false,
      reason: 'upload_failed',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
