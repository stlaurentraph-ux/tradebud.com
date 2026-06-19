/** Text-only FPIC signature rows stored as synthetic URIs. */
export function decodeFpicSignatureUri(uri: string): string | null {
  if (!uri.startsWith('text:fpic_signature:')) return null;
  const encoded = uri.slice('text:fpic_signature:'.length).split(':')[0];
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

export function isImageDocumentUri(uri: string, mimeType: string | null): boolean {
  if (decodeFpicSignatureUri(uri)) return false;
  if (mimeType?.startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(uri);
}

export function canOpenExternally(uri: string): boolean {
  return !uri.startsWith('text:');
}

export type DocumentPreviewItem = {
  uri: string;
  mimeType: string | null;
  label?: string | null;
  deleteTarget?:
    | { kind: 'land_title_photo'; id: number }
    | { kind: 'tenure_evidence'; id: number };
};
