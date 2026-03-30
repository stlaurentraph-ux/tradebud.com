import { Header } from "@/components/tracebud/header";
import { Footer } from "@/components/tracebud/footer";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="pt-32 pb-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Pricing</h1>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              This page is intentionally prepared as a dedicated canvas for v0 design generation.
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
            <p className="text-foreground/70">
              v0 placeholder: replace this section with the final pricing layout and components.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
