/** Infer upload content-type from mime, filename, or local URI (iOS often omits mime for HEIC). */
export function normalizeEvidenceContentType(
  mimeType: string | null,
  label: string | null,
  localUri: string,
): string {
  const hint = `${mimeType ?? ''} ${label ?? ''} ${localUri}`.toLowerCase();
  if (hint.includes('pdf')) return 'application/pdf';
  if (hint.includes('.heic') || hint.includes('image/heic')) return 'image/heic';
  if (hint.includes('.heif') || hint.includes('image/heif')) return 'image/heif';
  if (hint.includes('.png') || hint.includes('image/png')) return 'image/png';
  if (hint.includes('.webp') || hint.includes('image/webp')) return 'image/webp';
  if (hint.includes('.gif') || hint.includes('image/gif')) return 'image/gif';
  if (mimeType && mimeType.length > 0) return mimeType;
  return 'image/jpeg';
}

export function isLocalEvidenceUri(uri: string): boolean {
  if (uri.startsWith('text:')) return false;
  if (uri.startsWith('http://') || uri.startsWith('https://')) return false;
  return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');
}
