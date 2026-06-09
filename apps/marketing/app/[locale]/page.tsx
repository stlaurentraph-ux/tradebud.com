import { Header } from "@/components/tracebud/header";
import { Hero } from "@/components/tracebud/hero";
<<<<<<< HEAD
import { Problem } from "@/components/tracebud/problem";
=======
import { HomeProblemSection } from "@/components/tracebud/home-problem-section";
import { HomeHowItWorks } from "@/components/tracebud/home-how-it-works";
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
import { Products } from "@/components/tracebud/products";
import { Inclusiveness } from "@/components/tracebud/inclusiveness";
import { WhoItIsFor } from "@/components/tracebud/who-it-is-for";
import { Pricing } from "@/components/tracebud/pricing";
import { ValueProp } from "@/components/tracebud/value-prop";
import { FAQ } from "@/components/tracebud/faq";
import { Footer } from "@/components/tracebud/footer";
import { ExitIntentModal } from "@/components/exit-intent-modal";

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <Header />
      <Hero />
<<<<<<< HEAD
      <Problem />
=======
      <HomeProblemSection />
      <HomeHowItWorks />
>>>>>>> 9ee0440373a9b3b88b4c628aecea1e7fbed04893
      <Products />
      <Inclusiveness />
      <WhoItIsFor />
      <Pricing />
      <ValueProp />
      <FAQ />
      <Footer />
      <ExitIntentModal />
    </main>
  );
}
