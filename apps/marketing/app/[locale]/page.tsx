import { Header } from "@/components/tracebud/header";
import { Hero } from "@/components/tracebud/hero";
import { HomeProblemSection } from "@/components/tracebud/home-problem-section";
import { HomeHowItWorks } from "@/components/tracebud/home-how-it-works";
import { LatestInsights } from "@/components/tracebud/home-v2/latest-insights";
import { Products } from "@/components/tracebud/products";
import { Pricing } from "@/components/tracebud/pricing";
import { ValueProp } from "@/components/tracebud/value-prop";
import { FAQ } from "@/components/tracebud/faq";
import { Footer } from "@/components/tracebud/footer";
import { ExitIntentModal } from "@/components/exit-intent-modal";

type HomeProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <Header />
      <Hero />
      <HomeProblemSection />
      <HomeHowItWorks />
      <Products />
      <Pricing />
      <ValueProp />
      <LatestInsights locale={locale} />
      <FAQ />
      <Footer />
      <ExitIntentModal />
    </main>
  );
}
