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

/**
 * Schemes we are willing to hand to the OS opener (`Linking.openURL`). Document evidence is
 * either a local sandbox file (`file://` / Android `content://`) or a remote signed storage URL
 * (`https://`). Everything else — `text:` synthetic signatures, cleartext `http:`, `javascript:`,
 * `data:`, or arbitrary custom app schemes — must be rejected so a maliciously crafted/restored
 * evidence URI cannot trigger an unexpected redirect or app handoff.
 */
const EXTERNALLY_OPENABLE_SCHEMES = new Set(['file:', 'content:', 'https:']);

/** Returns the lowercased URI scheme including the trailing colon (e.g. `https:`), or `null`. */
function getUriScheme(uri: string): string | null {
  if (typeof uri !== 'string' || uri.length === 0) return null;
  const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(uri);
  return schemeMatch ? `${schemeMatch[1].toLowerCase()}:` : null;
}

export function canOpenExternally(uri: string): boolean {
  if (typeof uri !== 'string') return false;
  if (uri.startsWith('text:')) return false;
  const scheme = getUriScheme(uri);
  return scheme !== null && EXTERNALLY_OPENABLE_SCHEMES.has(scheme);
}

/**
 * How a previewable document should be handed off to the OS.
 * - `browser`: remote `https:` URL → safe for `Linking.openURL`.
 * - `share`: local `file:`/`content:` document → MUST go through the share/FileProvider path.
 *   On Android 7+ calling `Linking.openURL('file://…')` throws `FileUriExposedException`, so the
 *   "Open document" button silently fails; `Sharing.shareAsync` resolves the file via FileProvider
 *   on Android and opens the share sheet / Quick Look on iOS.
 * - `null`: not openable (synthetic `text:` signatures, blocked schemes).
 */
export type DocumentOpenStrategy = 'browser' | 'share' | null;

export function resolveDocumentOpenStrategy(uri: string): DocumentOpenStrategy {
  if (!canOpenExternally(uri)) return null;
  return getUriScheme(uri) === 'https:' ? 'browser' : 'share';
}

export type DocumentPreviewItem = {
  uri: string;
  mimeType: string | null;
  label?: string | null;
  deleteTarget?:
    | { kind: 'land_title_photo'; id: number }
    | { kind: 'tenure_evidence'; id: number };
};
