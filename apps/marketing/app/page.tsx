import { Header } from "@/components/tracebud/header";
import { Hero } from "@/components/tracebud/hero";
import { TrustSignals } from "@/components/tracebud/trust-signals";
import { ProcessTimeline } from "@/components/tracebud/process-timeline";
import { Verticals } from "@/components/tracebud/verticals";
import { NetworkSovereignty } from "@/components/tracebud/network-sovereignty";
import { Technology } from "@/components/tracebud/technology";
import { Comparison } from "@/components/tracebud/comparison";
import { CommodityEngine } from "@/components/tracebud/commodity-engine";
import { Interoperability } from "@/components/tracebud/interoperability";
import { EsgClimate } from "@/components/tracebud/esg-climate";
import { Impact } from "@/components/tracebud/impact";
import { Footer } from "@/components/tracebud/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <TrustSignals />
      <ProcessTimeline />
      <Verticals />
      <NetworkSovereignty />
      <Technology />
      <Comparison />
      <CommodityEngine />
      <Interoperability />
      <EsgClimate />
      <Impact />
      <Footer />
    </main>
  );
}
