import { Header } from "@/components/tracebud/header";
import { Hero } from "@/components/tracebud/hero";
import { ChainFlow } from "@/components/tracebud/chain-flow";
import { ProductDemo } from "@/components/tracebud/product-demo";
import { VerticalsTabs } from "@/components/tracebud/verticals-tabs";
import { Comparison } from "@/components/tracebud/comparison";
import { Impact } from "@/components/tracebud/impact";
import { Footer } from "@/components/tracebud/footer";
import { ExitIntentModal } from "@/components/exit-intent-modal";

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen">
      <Header />
      <Hero />
      <ChainFlow />
      <VerticalsTabs />
      <ProductDemo />
      <Comparison />
      <Impact />
      <Footer />
      <ExitIntentModal />
    </main>
  );
}
