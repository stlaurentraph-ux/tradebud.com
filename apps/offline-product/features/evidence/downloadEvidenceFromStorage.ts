import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

import { fetchPlotEvidenceSignedUrl } from '@/features/api/postPlot';
import {
  getAuthenticatedSupabaseClient,
} from '@/features/api/syncAuthSession';
import { normalizeEvidenceStoragePath } from '@/features/evidence/normalizeEvidenceStoragePath';

const EVIDENCE_BUCKET = process.env.EXPO_PUBLIC_EVIDENCE_STORAGE_BUCKET ?? 'plot-evidence';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365;

export type SignEvidenceStorageUrlOptions = {
  /** Server plot id — enables backend service-role signing when Supabase RLS blocks direct read. */
  serverPlotId?: string;
};

/** Sign a storage object for read access (used when durable download is unavailable). */
export async function signEvidenceStorageUrl(
  storagePath: string,
  options?: SignEvidenceStorageUrlOptions,
): Promise<string | null> {
  const trimmed = normalizeEvidenceStoragePath(storagePath);
  if (!trimmed) return null;

  if (process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await getAuthenticatedSupabaseClient();
    if (supabase) {
      try {
        const { data: signed, error: signError } = await supabase.storage
          .from(EVIDENCE_BUCKET)
          .createSignedUrl(trimmed, SIGNED_URL_TTL_SECONDS);
        if (!signError && signed?.signedUrl) {
          return signed.signedUrl;
        }
      } catch {
        // Fall through to backend signing when configured.
      }
    }
  }

  const serverPlotId = options?.serverPlotId?.trim();
  if (serverPlotId) {
    return fetchPlotEvidenceSignedUrl(serverPlotId, trimmed);
  }

  return null;
}

export type EvidenceDownloadResult =
  | { ok: true; localUri: string; remoteUrl: string; storagePath: string }
  | {
      ok: false;
      reason: 'not_configured' | 'not_signed_in' | 'download_failed';
      message?: string;
    };

function extensionForMime(mimeType: string | null, storagePath: string): string {
  const hint = `${mimeType ?? ''} ${storagePath}`.toLowerCase();
  if (hint.includes('.pdf') || hint.includes('pdf')) return 'pdf';
  if (hint.includes('.heic') || hint.includes('heic')) return 'heic';
  if (hint.includes('.heif') || hint.includes('heif')) return 'heif';
  if (hint.includes('.png') || hint.includes('png')) return 'png';
  if (hint.includes('.webp') || hint.includes('webp')) return 'webp';
  return 'jpg';
}

/** Download a Supabase storage object into durable app evidence storage. */
export async function downloadEvidenceFileFromStorage(params: {
  storagePath: string;
  localPlotId: string;
  kind: string;
  mimeType?: string | null;
  label?: string | null;
  serverPlotId?: string;
}): Promise<EvidenceDownloadResult> {
  const storagePath = normalizeEvidenceStoragePath(params.storagePath);
  if (!storagePath) {
    return { ok: false, reason: 'download_failed', message: 'Missing storage path' };
  }
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    const backendSigned = await signEvidenceStorageUrl(storagePath, {
      serverPlotId: params.serverPlotId,
    });
    if (!backendSigned) {
      return { ok: false, reason: 'not_configured' };
    }
    if (Platform.OS === 'web') {
      return {
        ok: true,
        localUri: backendSigned,
        remoteUrl: backendSigned,
        storagePath,
      };
    }
    const root = (FileSystem as { documentDirectory?: string | null }).documentDirectory ?? '';
    if (!root) {
      return {
        ok: true,
        localUri: backendSigned,
        remoteUrl: backendSigned,
        storagePath,
      };
    }
    const ext = extensionForMime(params.mimeType ?? null, storagePath);
    const dir = `${root}evidence/${params.localPlotId}/${params.kind}/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => undefined);
    const dest = `${dir}restore-${Date.now()}.${ext}`;
    const download = await FileSystem.downloadAsync(backendSigned, dest);
    if (download.status < 200 || download.status >= 300) {
      return {
        ok: false,
        reason: 'download_failed',
        message: `Download failed (${download.status})`,
      };
    }
    return {
      ok: true,
      localUri: download.uri,
      remoteUrl: backendSigned,
      storagePath,
    };
  }

  const supabase = await getAuthenticatedSupabaseClient();
  if (!supabase) {
    return { ok: false, reason: 'not_signed_in' };
  }

  try {
    const signedUrl = await signEvidenceStorageUrl(storagePath, {
      serverPlotId: params.serverPlotId,
    });
    if (!signedUrl) {
      return {
        ok: false,
        reason: 'download_failed',
        message: 'Could not sign storage URL',
      };
    }

    if (Platform.OS === 'web') {
      return {
        ok: true,
        localUri: signedUrl,
        remoteUrl: signedUrl,
        storagePath,
      };
    }

    const root = (FileSystem as { documentDirectory?: string | null }).documentDirectory ?? '';
    if (!root) {
      return {
        ok: true,
        localUri: signedUrl,
        remoteUrl: signedUrl,
        storagePath,
      };
    }

    const ext = extensionForMime(params.mimeType ?? null, storagePath);
    const dir = `${root}evidence/${params.localPlotId}/${params.kind}/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => undefined);
    const dest = `${dir}restore-${Date.now()}.${ext}`;
    const download = await FileSystem.downloadAsync(signedUrl, dest);
    if (download.status < 200 || download.status >= 300) {
      return {
        ok: false,
        reason: 'download_failed',
        message: `Download failed (${download.status})`,
      };
    }

    return {
      ok: true,
      localUri: download.uri,
      remoteUrl: signedUrl,
      storagePath,
    };
  } catch (error) {
    return {
      ok: false,
      reason: 'download_failed',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
