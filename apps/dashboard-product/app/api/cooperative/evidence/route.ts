import { NextResponse } from 'next/server';

type HarvestPackage = {
  id: string;
  code?: string;
  updated_at?: string;
};

type EvidenceDocument = {
  id?: string;
  name?: string;
  title?: string;
  status?: string;
  updated_at?: string;
  created_at?: string;
};

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const keyed = value as { data?: unknown; items?: unknown; documents?: unknown; packages?: unknown };
    if (Array.isArray(keyed.data)) return keyed.data as T[];
    if (Array.isArray(keyed.items)) return keyed.items as T[];
    if (Array.isArray(keyed.documents)) return keyed.documents as T[];
    if (Array.isArray(keyed.packages)) return keyed.packages as T[];
  }
  return [];
}

async function fetchJson(path: string, authHeader: string | null): Promise<unknown> {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    throw new Error('TRACEBUD_BACKEND_URL is required for cooperative evidence.');
  }
  const response = await fetch(`${backendBase}${path}`, {
    method: 'GET',
    headers: authHeader ? { Authorization: authHeader } : undefined,
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Backend request failed (${response.status}) for ${path}`);
  }
  return response.json().catch(() => []);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  try {
    const packagesRaw = await fetchJson('/v1/harvest/packages', authHeader);
    const packages = normalizeArray<HarvestPackage>(packagesRaw).slice(0, 20);

    const evidenceResponses = await Promise.allSettled(
      packages.map((pkg) =>
        fetchJson(`/v1/harvest/packages/${encodeURIComponent(pkg.id)}/evidence-documents`, authHeader),
      ),
    );

    const docs: EvidenceDocument[] = evidenceResponses.flatMap((result) =>
      result.status === 'fulfilled' ? normalizeArray<EvidenceDocument>(result.value) : [],
    );

    const verified = docs.filter((doc) => (doc.status ?? '').toUpperCase().includes('VERIFIED')).length;
    const pending = docs.filter((doc) => (doc.status ?? '').toUpperCase().includes('PENDING')).length;
    const expired = docs.filter((doc) => (doc.status ?? '').toUpperCase().includes('EXPIRED')).length;
    const renewalDue = docs.filter((doc) => (doc.status ?? '').toUpperCase().includes('RENEWAL')).length;

    return NextResponse.json({
      summary: {
        total: docs.length,
        verified,
        pending,
        expired,
        renewal_due: renewalDue,
      },
      documents: docs.slice(0, 25),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load cooperative evidence.' },
      { status: 500 },
    );
  }
}
