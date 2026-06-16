import { cookies } from 'next/headers';
import { DashboardHomeClient } from '@/components/dashboards/dashboard-home-client';
import { getSessionCookieName, isSessionTokenValid } from '@/lib/auth-cookie';
import { getTenantRoleFromAccessToken } from '@/lib/auth-claims';
import { resolveHarvestPackageScope } from '@/lib/harvest-package-scope';
import { loadDashboardSummary } from '@/lib/load-dashboard-summary';
import { loadLaunchState, type LaunchState } from '@/lib/load-launch-state';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(getSessionCookieName())?.value;
  const token = rawToken ? decodeURIComponent(rawToken) : null;
  let initialSummary = null;
  let initialLaunchState: LaunchState | null = null;

  if (isSessionTokenValid(token)) {
    const role = getTenantRoleFromAccessToken(token);
    const packageScope = resolveHarvestPackageScope(role);
    const authHeader = `Bearer ${token}`;
    const [summaryResult, launchResult] = await Promise.allSettled([
      loadDashboardSummary({ authHeader, packageScope }),
      loadLaunchState(authHeader),
    ]);
    if (summaryResult.status === 'fulfilled') {
      initialSummary = summaryResult.value;
    }
    if (launchResult.status === 'fulfilled') {
      initialLaunchState = launchResult.value;
    }
  }

  return (
    <DashboardHomeClient initialSummary={initialSummary} initialLaunchState={initialLaunchState} />
  );
}
