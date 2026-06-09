import { isRouteFlagPublished, type MarketingRouteId } from '@/lib/marketing-publication';

type DraftBannerProps = {
  routeId: MarketingRouteId;
};

export function DraftBanner({ routeId }: DraftBannerProps) {
  if (isRouteFlagPublished(routeId)) {
    return null;
  }

  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950"
    >
      <strong className="font-semibold">Draft page</strong>
      <span className="mx-2 text-amber-800">·</span>
      <span>Not public yet — visible in local dev or with a preview link.</span>
    </div>
  );
}
