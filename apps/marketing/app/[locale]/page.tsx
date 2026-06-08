import { Header } from "@/components/tracebud/header";
import { Hero } from "@/components/tracebud/hero";
import { HomeProblemSection } from "@/components/tracebud/home-problem-section";
import { HomeHowItWorks } from "@/components/tracebud/home-how-it-works";
import { Products } from "@/components/tracebud/products";
import { ValueProp } from "@/components/tracebud/value-prop";
import { FAQ } from "@/components/tracebud/faq";
import { Footer } from "@/components/tracebud/footer";
import { ExitIntentModal } from "@/components/exit-intent-modal";

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <Header />
      <Hero />
      <HomeProblemSection />
      <HomeHowItWorks />
      <Products />
      <ValueProp />
      <FAQ />
      <Footer />
      <ExitIntentModal />
    </main>
  );
}
