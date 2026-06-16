import { NextResponse } from 'next/server';
import { loadDashboardSummary } from '@/lib/load-dashboard-summary';
import type { HarvestPackageScope } from '@/lib/harvest-package-scope';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Authorization required.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const packageScope: HarvestPackageScope =
    searchParams.get('package_scope') === 'shared' ? 'shared' : 'tenant';

  try {
    const summary = await loadDashboardSummary({ authHeader, packageScope });
    return NextResponse.json({
      metrics: summary.metrics,
      packages: summary.packages,
      campaigns: summary.campaigns,
      sponsor: summary.sponsor,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load dashboard summary.' },
      { status: 500 },
    );
  }
}
