import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';
import {
  auditRowsToTimelineEvents,
  campaignsToTimelineEvents,
  mergeTimelineEvents,
  organisationsToTimelineEvents,
  packagesToTimelineEvents,
} from '@/lib/dashboard-activity';

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
  title?: string;
  status?: string;
  updated_at?: string;
  created_at?: string;
};

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const keyed = value as {
      data?: unknown;
      items?: unknown;
      campaigns?: unknown;
      packages?: unknown;
    };
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
    throw new Error('TRACEBUD_BACKEND_URL is required for dashboard activity.');
  }
  const response = await fetch(`${backendApiUrl(backendBase, path)}`, {
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
    const [packagesRaw, campaignsRaw, organisationsRaw, auditRaw] = await Promise.allSettled([
      fetchJson('/v1/harvest/packages', authHeader),
      fetchJson('/v1/requests/campaigns', authHeader),
      fetchJson('/v1/admin/organizations', authHeader),
      fetchJson('/v1/audit?limit=40', authHeader),
    ]);

    const packages =
      packagesRaw.status === 'fulfilled' ? normalizeArray<HarvestPackage>(packagesRaw.value).slice(0, 12) : [];
    const campaigns =
      campaignsRaw.status === 'fulfilled' ? normalizeArray<Campaign>(campaignsRaw.value).slice(0, 12) : [];
    const organisations =
      organisationsRaw.status === 'fulfilled'
        ? normalizeArray<Record<string, unknown>>(organisationsRaw.value).slice(0, 8)
        : [];
    const auditRows =
      auditRaw.status === 'fulfilled'
        ? normalizeArray<{
            id: string | number;
            timestamp: string;
            event_type: string;
            payload?: Record<string, unknown>;
          }>(auditRaw.value).slice(0, 20)
        : [];

    const events = mergeTimelineEvents(
      packagesToTimelineEvents(packages),
      campaignsToTimelineEvents(campaigns),
      organisationsToTimelineEvents(
        organisations.map((org) => ({
          id: typeof org.id === 'string' ? org.id : undefined,
          name: typeof org.name === 'string' ? org.name : undefined,
          country: typeof org.country === 'string' ? org.country : undefined,
          onboardingCompleteness: Number(org.onboardingCompleteness ?? 0),
          created_at: typeof org.created_at === 'string' ? org.created_at : undefined,
          updated_at: typeof org.updated_at === 'string' ? org.updated_at : undefined,
        })),
      ),
      auditRowsToTimelineEvents(auditRows),
    ).slice(0, 12);

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load dashboard activity.' },
      { status: 500 },
    );
  }
}
