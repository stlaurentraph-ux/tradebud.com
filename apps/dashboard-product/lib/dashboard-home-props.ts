import type { DashboardHomeResources } from '@/lib/dashboard-home-data';

export function homeCampaignProps(home?: DashboardHomeResources) {
  if (!home || home.campaigns === undefined) return {};
  return {
    prefetchedCampaigns: home.campaigns,
    prefetchedLoading: home.campaignsLoading,
  };
}

export function homeActivityProps(home?: DashboardHomeResources) {
  if (!home) return {};
  return {
    prefetchedEvents: home.activityEvents,
    prefetchedLoaded: home.activityLoaded,
  };
}

export function homePackageProps(home?: DashboardHomeResources) {
  if (!home) return {};
  return {
    prefetchedPackages: home.packages,
    prefetchedLoading: home.packagesLoading,
    prefetchedError: home.packagesError,
  };
}
