import Link from "next/link";
import { ArrowRight, Building2, Factory, Leaf, Users, Smartphone, ExternalLink } from "lucide-react";

import { Header } from "@/components/tracebud/header";
import { Footer } from "@/components/tracebud/footer";
import { Button } from "@/components/ui/button";
import { getCreateAccountUrl } from "@/lib/dashboard";

const APP_STORE_URL = "https://apps.apple.com/app/tracebud";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.tracebud";

const options = [
  {
    title: "Producer / Farmer",
    description: "Map plots and build your compliance passport with our mobile app.",
    icon: Leaf,
    isApp: true,
    color: "var(--data-emerald)",
  },
  {
    title: "Cooperative",
    description: "Coordinate member data and roll up evidence at scale.",
    href: getCreateAccountUrl("exporter"),
    icon: Users,
    isApp: false,
    color: "#F59E0B",
  },
  {
    title: "Exporter",
    description: "Automate due diligence and batch-level workflows.",
    href: getCreateAccountUrl("exporter"),
    icon: Factory,
    isApp: false,
    color: "var(--mountain-clay)",
  },
  {
    title: "Importer / Brand",
    description: "Get upstream visibility and supplier risk signals.",
    href: getCreateAccountUrl("importer"),
    icon: Building2,
    isApp: false,
    color: "var(--forest-canopy)",
  },
];

export default function GetStartedPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Start Your Free Trial
            </h1>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto mb-4">
              Choose your role to create your account instantly.
            </p>
            <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--data-emerald)] bg-[var(--data-emerald)]/10 px-4 py-2 rounded-full">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              30 days free. No credit card required.
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {options.map((option) => {
              const Icon = option.icon;
              
              if (option.isApp) {
                return (
                  <div
                    key={option.title}
                    className="border border-border rounded-2xl p-6 bg-muted/20"
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${option.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: option.color }} />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">{option.title}</h2>
                    <p className="text-foreground/70 mb-6">{option.description}</p>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-sm text-foreground/60 mb-2">
                        <Smartphone className="w-4 h-4" />
                        <span>Download the mobile app</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={APP_STORE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                          </svg>
                          App Store
                        </a>
                        <a
                          href={PLAY_STORE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5.31 0 .6.1.84.26l13.32 8.5c.5.32.5 1.16 0 1.48l-13.32 8.5A1.5 1.5 0 013 20.5z"/>
                          </svg>
                          Google Play
                        </a>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <a
                  key={option.title}
                  href={option.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group border border-border rounded-2xl p-6 bg-muted/20 hover:bg-muted/40 hover:border-[var(--data-emerald)] transition-colors"
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${option.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: option.color }} />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">{option.title}</h2>
                  <p className="text-foreground/70 mb-4">{option.description}</p>
                  <span className="inline-flex items-center gap-2 text-[var(--forest-canopy)] font-semibold">
                    Create account
                    <ExternalLink className="w-4 h-4" />
                  </span>
                </a>
              );
            })}
          </div>

          <div className="text-center space-y-4">
            <p className="text-foreground/60">
              Want a personalized walkthrough first?
            </p>
            <Link href="/demo">
              <Button variant="outline" className="rounded-full">
                Book a 15-min demo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
