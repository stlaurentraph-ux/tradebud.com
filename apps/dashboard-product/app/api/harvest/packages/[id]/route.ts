import { NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api-url';
import { mapBackendPackagesResponse } from '@/lib/harvest-package-mapper';

function findPackageInList(
  packages: ReturnType<typeof mapBackendPackagesResponse>,
  lookupId: string,
) {
  const normalized = lookupId.trim();
  return (
    packages.find((pkg) => pkg.id === normalized) ??
    packages.find((pkg) => pkg.code === normalized) ??
    null
  );
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get('authorization');
  const { id } = await context.params;

  try {
    const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
    if (!backendBase) {
      return NextResponse.json(
        { error: 'TRACEBUD_BACKEND_URL is required for package detail reads.' },
        { status: 503 },
      );
    }

    const backendResponse = await fetch(
      backendApiUrl(backendBase, `/v1/harvest/packages/${encodeURIComponent(id)}`),
      {
      method: 'GET',
      cache: 'no-store',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const payload = await backendResponse
      .json()
      .catch(() => ({ error: 'Backend package detail request failed.' }));

    if (backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }

    if (backendResponse.status === 404) {
      const listResponse = await fetch(backendApiUrl(backendBase, '/v1/harvest/packages'), {
        method: 'GET',
        cache: 'no-store',
        headers: authHeader ? { Authorization: authHeader } : undefined,
      });
      if (listResponse.ok) {
        const listPayload = await listResponse.json().catch(() => ({}));
        const packages = mapBackendPackagesResponse(listPayload, 'tenant_unknown');
        const match = findPackageInList(packages, id);
        if (match) {
          return NextResponse.json(
            {
              package: {
                id: match.id,
                label: match.code,
                status: match.status.toLowerCase(),
                created_at: match.created_at,
                plot_count: match.plots.length,
                compliant_plot_count: match.plots.filter((plot) => plot.verified).length,
                sender_org: match.supplier_name,
                total_kg: match.total_weight_kg ?? null,
              },
              vouchers: [],
            },
            { status: 200 },
          );
        }
      }
    }

    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch package detail.' },
      { status: 500 },
    );
  }
}
