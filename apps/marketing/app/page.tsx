import { Header } from "@/components/tracebud/header";
import { Hero } from "@/components/tracebud/hero";
import { ChainFlow } from "@/components/tracebud/chain-flow";
import { ProcessTimeline } from "@/components/tracebud/process-timeline";
import { ProductDemo } from "@/components/tracebud/product-demo";
import { Verticals } from "@/components/tracebud/verticals";
import { NetworkSovereignty } from "@/components/tracebud/network-sovereignty";
import { Technology } from "@/components/tracebud/technology";
import { Comparison } from "@/components/tracebud/comparison";
import { CommodityEngine } from "@/components/tracebud/commodity-engine";
import { Interoperability } from "@/components/tracebud/interoperability";
import { EsgClimate } from "@/components/tracebud/esg-climate";
import { Impact } from "@/components/tracebud/impact";
import { Footer } from "@/components/tracebud/footer";
import { ExitIntentModal } from "@/components/exit-intent-modal";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <ChainFlow />
      <ProcessTimeline />
      <ProductDemo />
      <Verticals />
      <NetworkSovereignty />
      <Technology />
      <Comparison />
      <CommodityEngine />
      <Interoperability />
      <EsgClimate />
      <Impact />
      <Footer />
      <ExitIntentModal />
    </main>
  );
}
