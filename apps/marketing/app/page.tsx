import { Header } from "@/components/tracebud/header";
import { Hero } from "@/components/tracebud/hero";
import { ChainFlow } from "@/components/tracebud/chain-flow";
import { WorkflowDemo } from "@/components/tracebud/workflow-demo";
import { VerticalsTabs } from "@/components/tracebud/verticals-tabs";
import { Comparison } from "@/components/tracebud/comparison";
import { FAQ } from "@/components/tracebud/faq";
import { Impact } from "@/components/tracebud/impact";
import { Footer } from "@/components/tracebud/footer";
import { ExitIntentModal } from "@/components/exit-intent-modal";

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen">
      <Header />
      <Hero />
      <ChainFlow />
      <WorkflowDemo />
      <VerticalsTabs />
      <Comparison />
      <FAQ />
      <Impact />
      <Footer />
      <ExitIntentModal />
    </main>
  );
}
