import { Footer } from '@/components/tracebud/footer';
import { SiteNav } from '@/components/site-nav';
import { DraftBanner } from '@/components/marketing/draft-banner';
import type { MarketingRouteId } from '@/lib/marketing-publication';

type MarketingPageLayoutProps = {
  children: React.ReactNode;
  routeId: MarketingRouteId;
};

export function MarketingPageLayout({ children, routeId }: MarketingPageLayoutProps) {
  return (
    <main className="min-h-screen bg-background">
      {/* Fixed top chrome: draft banner (if present) stacked above the nav bar */}
      <div className="fixed left-0 right-0 top-0 z-50">
        <DraftBanner routeId={routeId} />
        <SiteNav />
      </div>
      {children}
      <Footer />
    </main>
  );
}
