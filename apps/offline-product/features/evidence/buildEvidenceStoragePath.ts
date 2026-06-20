/** Stable Supabase Storage path for plot evidence (matches RLS: first segment = auth.uid()). */
export function buildEvidenceStoragePath(params: {
  authUserId: string;
  plotId: string;
  kind: string;
  stableKey: string | number;
  label?: string | null;
}): string {
  const authUserId = params.authUserId.trim();
  const plotId = params.plotId.trim();
  const kind = params.kind.trim();
  if (!authUserId || !plotId || !kind) {
    throw new Error('authUserId, plotId, and kind are required for evidence storage paths.');
  }
  const safeName = (params.label ?? 'evidence')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 40);
  return `${authUserId}/${plotId}/${kind}/${params.stableKey}-${safeName}`;
}
