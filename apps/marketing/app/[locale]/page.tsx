import { Header } from "@/components/tracebud/header";
import { Hero } from "@/components/tracebud/hero";
import { VerticalsTabs } from "@/components/tracebud/verticals-tabs";
import { WorkflowDemo } from "@/components/tracebud/workflow-demo";
import { Comparison } from "@/components/tracebud/comparison";
import { FAQ } from "@/components/tracebud/faq";
import { Footer } from "@/components/tracebud/footer";
import { ExitIntentModal } from "@/components/exit-intent-modal";
import { FloatingMobileCTA } from "@/components/floating-mobile-cta";

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <Header />
      <Hero />
      <VerticalsTabs />
      <WorkflowDemo />
      <Comparison />
      <FAQ />
      <Footer />
      <ExitIntentModal />
      <FloatingMobileCTA />
    </main>
  );
}
