export function getDashboardAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchEvidenceSignedUrl(storagePath: string): Promise<string> {
  const params = new URLSearchParams({ storagePath });
  const response = await fetch(`/api/evidence/signed-url?${params.toString()}`, {
    cache: 'no-store',
    headers: getDashboardAuthHeaders(),
  });
  const body = (await response.json().catch(() => ({}))) as {
    signed_url?: string;
    error?: string;
  };
  if (!response.ok || !body.signed_url) {
    throw new Error(body.error ?? 'Could not open evidence file.');
  }
  return body.signed_url;
}

export async function openEvidenceFile(storagePath: string): Promise<void> {
  const signedUrl = await fetchEvidenceSignedUrl(storagePath);
  window.open(signedUrl, '_blank', 'noopener,noreferrer');
}

export async function downloadEvidenceFile(storagePath: string, filename?: string): Promise<void> {
  const signedUrl = await fetchEvidenceSignedUrl(storagePath);
  const anchor = document.createElement('a');
  anchor.href = signedUrl;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  if (filename) {
    anchor.download = filename;
  }
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function evidenceKindLabel(kind: string | null | undefined): string {
  switch (kind) {
    case 'fpic_repository':
      return 'FPIC';
    case 'tenure_evidence':
      return 'Land tenure';
    case 'protected_area_permit':
      return 'Protected area permit';
    case 'labor_evidence':
      return 'Labor evidence';
    default:
      return kind?.replace(/_/g, ' ') ?? 'Evidence';
  }
}
