import Link from "next/link";
import { ArrowRight, Building2, Factory, Leaf, Users } from "lucide-react";

import { Header } from "@/components/tracebud/header";
import { Footer } from "@/components/tracebud/footer";
import { Button } from "@/components/ui/button";

const options = [
  {
    title: "Farmer",
    description: "Map plots and prepare your compliance passport.",
    href: "/farmers#signup",
    icon: Leaf,
  },
  {
    title: "Cooperative",
    description: "Coordinate member data and readiness at scale.",
    href: "/farmers?account=cooperative#signup",
    icon: Users,
  },
  {
    title: "Exporter",
    description: "Automate due diligence and batch-level workflows.",
    href: "/exporters#signup",
    icon: Factory,
  },
  {
    title: "Importer",
    description: "Get upstream visibility and supplier risk signals.",
    href: "/importers#signup",
    icon: Building2,
  },
  {
    title: "Country / Registry",
    description: "Modernize registry infrastructure and interoperability.",
    href: "/countries#signup",
    icon: Building2,
  },
];

export default function GetStartedPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Get Started
            </h1>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Who are you? Choose your profile and we will bring you to the right form.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <Link
                  key={option.title}
                  href={option.href}
                  className="group border border-border rounded-2xl p-6 bg-muted/20 hover:bg-muted/40 hover:border-[var(--data-emerald)] transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)]/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[var(--data-emerald)]" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">{option.title}</h2>
                  <p className="text-foreground/70 mb-4">{option.description}</p>
                  <span className="inline-flex items-center gap-2 text-[var(--forest-canopy)] font-semibold">
                    Open form
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link href="/">
              <Button variant="outline" className="rounded-full">
                Back to homepage
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
