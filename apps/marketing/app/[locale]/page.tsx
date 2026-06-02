import { Header } from "@/components/tracebud/header";
import { Hero } from "@/components/tracebud/hero";
import { Products } from "@/components/tracebud/products";
import { BuiltForRealities } from "@/components/tracebud/built-for-realities";
import { WhoItIsFor } from "@/components/tracebud/who-it-is-for";
import { Pricing } from "@/components/tracebud/pricing";
import { ValueProp } from "@/components/tracebud/value-prop";
import { FAQ } from "@/components/tracebud/faq";
import { Footer } from "@/components/tracebud/footer";
import { ExitIntentModal } from "@/components/exit-intent-modal";
import { FloatingMobileCTA } from "@/components/floating-mobile-cta";

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Products />
      <WhoItIsFor />
      <Pricing />
      <ValueProp />
      <FAQ />
      <Footer />
      <ExitIntentModal />
      <FloatingMobileCTA />
    </main>
  );
}
