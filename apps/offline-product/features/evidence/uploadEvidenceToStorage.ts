import { normalizeEvidenceContentType, isLocalEvidenceUri } from './evidenceContentType';
import { readLocalEvidenceBytes } from './readLocalEvidenceFile';

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

/** Re-sign an object already stored in the evidence bucket (idempotent sync). */
export async function signedUrlForEvidenceStoragePath(
  storagePath: string,
): Promise<EvidenceUploadResult> {
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    return { ok: false, reason: 'not_configured' };
  }

  const supabase = await getAuthenticatedSupabaseClient();
  const authUserId = await getAuthenticatedSupabaseUserId();
  if (!supabase || !authUserId) {
    return { ok: false, reason: 'not_signed_in', message: 'Sign in to upload evidence files.' };
  }

  const normalized = storagePath.trim().replace(/^\/+/, '');
  if (!normalized) {
    return { ok: false, reason: 'upload_failed', message: 'Missing storage path' };
  }

  try {
    const { data: signed, error: signError } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .createSignedUrl(normalized, SIGNED_URL_TTL_SECONDS);

    if (signError || !signed?.signedUrl) {
      return {
        ok: false,
        reason: 'upload_failed',
        message: signError?.message ?? 'Could not create signed URL for uploaded file',
      };
    }

    return { ok: true, remoteUrl: signed.signedUrl, storagePath: normalized };
  } catch (e) {
    return {
      ok: false,
      reason: 'upload_failed',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Upload a local evidence file to Supabase Storage (`plot-evidence` bucket).
 * Path: `{farmerId}/{plotId}/{kind}/{timestamp}-{filename}` — must match RLS (farmerId = auth.uid()).
 * Returns a signed URL for private bucket access.
 */
export async function uploadEvidenceFileToStorage(params: {
  localUri: string;
  mimeType: string | null;
  label: string | null;
  farmerId: string;
  plotId: string;
  kind: string;
  /** When set, reuses this storage object instead of uploading again. */
  existingStoragePath?: string | null;
  /** Stable key (e.g. local photo id) — same key upserts instead of creating duplicates. */
  stableFileKey?: string;
}): Promise<EvidenceUploadResult> {
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    return { ok: false, reason: 'not_configured' };
  }
  if (!isLocalEvidenceUri(params.localUri)) {
    return { ok: false, reason: 'not_local_file' };
  }

  if (params.existingStoragePath?.trim()) {
    return signedUrlForEvidenceStoragePath(params.existingStoragePath);
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
  const storagePath = params.stableFileKey?.trim()
    ? `${authUserId}/${params.plotId}/${params.kind}/${params.stableFileKey.trim()}`
    : `${authUserId}/${params.plotId}/${params.kind}/${Date.now()}-${safeName}`;
  const contentType = normalizeEvidenceContentType(params.mimeType, params.label, params.localUri);

  try {
    const { error } = await supabase.storage.from(EVIDENCE_BUCKET).upload(storagePath, body, {
      contentType,
      upsert: Boolean(params.stableFileKey?.trim()),
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
