import { NextResponse } from 'next/server';

type HarvestPackage = {
  id: string;
  code?: string;
  status?: string;
  updated_at?: string;
  created_at?: string;
  compliance_status?: string;
};

type Campaign = {
  id: string;
  status?: string;
  updated_at?: string;
  created_at?: string;
};

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const keyed = value as { data?: unknown; items?: unknown; campaigns?: unknown; packages?: unknown };
    if (Array.isArray(keyed.data)) return keyed.data as T[];
    if (Array.isArray(keyed.items)) return keyed.items as T[];
    if (Array.isArray(keyed.campaigns)) return keyed.campaigns as T[];
    if (Array.isArray(keyed.packages)) return keyed.packages as T[];
  }
  return [];
}

async function fetchJson(path: string, authHeader: string | null): Promise<unknown> {
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    throw new Error('TRACEBUD_BACKEND_URL is required for cooperative audit log.');
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
    const [packagesRaw, campaignsRaw] = await Promise.all([
      fetchJson('/v1/harvest/packages', authHeader),
      fetchJson('/v1/requests/campaigns', authHeader),
    ]);

    const packages = normalizeArray<HarvestPackage>(packagesRaw).slice(0, 30);
    const campaigns = normalizeArray<Campaign>(campaignsRaw).slice(0, 30);

    const events = [
      ...packages.map((pkg) => ({
        id: `pkg-${pkg.id}`,
        timestamp: pkg.updated_at ?? pkg.created_at ?? new Date().toISOString(),
        user_email: 'system@tracebud.local',
        action: 'updated',
        entity_type: 'package',
        entity_id: pkg.id,
        entity_name: pkg.code ?? pkg.id,
        ip_address: 'backend',
        changes: pkg.status
          ? {
              status: { old: 'unknown', new: pkg.status },
              compliance_status: { old: 'unknown', new: pkg.compliance_status ?? 'unknown' },
            }
          : undefined,
      })),
      ...campaigns.map((campaign) => ({
        id: `cmp-${campaign.id}`,
        timestamp: campaign.updated_at ?? campaign.created_at ?? new Date().toISOString(),
        user_email: 'system@tracebud.local',
        action: 'updated',
        entity_type: 'compliance',
        entity_id: campaign.id,
        entity_name: `Campaign ${campaign.id}`,
        ip_address: 'backend',
        changes: campaign.status
          ? {
              status: { old: 'unknown', new: campaign.status },
            }
          : undefined,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ entries: events.slice(0, 60) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load cooperative audit log.' },
      { status: 500 },
    );
  }
}
