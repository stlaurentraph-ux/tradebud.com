import { Footer } from '@/components/tracebud/footer';
import { Header } from '@/components/tracebud/header';
import { DraftBanner } from '@/components/marketing/draft-banner';
import type { MarketingRouteId } from '@/lib/marketing-publication';

type MarketingPageLayoutProps = {
  children: React.ReactNode;
  routeId: MarketingRouteId;
};

export function MarketingPageLayout({ children, routeId }: MarketingPageLayoutProps) {
  return (
    <main className="min-h-screen bg-background">
      <DraftBanner routeId={routeId} />
      <Header />
      {children}
      <Footer />
    </main>
  );
}
