"use client";

import { motion } from "framer-motion";
import { Server, Globe, Shield, Database, Link2, Users, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/tracebud/header";
import { Footer } from "@/components/tracebud/footer";

const DASHBOARD_URL = "https://app.tracebud.com";
const COUNTRY_DEMO = "https://country-demo.tracebud.com";

const features = [
  {
    icon: Server,
    title: "Registry Synchronization",
    description: "REST endpoints to sync with national registries for cadastral boundaries and producer verification.",
    image: "/images/gis-geolocation.jpg",
  },
  {
    icon: Database,
    title: "Data Sovereignty",
    description: "Your data stays under your control. We provide infrastructure, not ownership. DPI-native architecture.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
  },
  {
    icon: Link2,
    title: "Interoperability",
    description: "Open standards (WGS84, GeoJSON, GS1 EPCIS) ensure compatibility with existing national systems.",
    image: "https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?q=80&w=800&auto=format&fit=crop",
  },
  {
    icon: Shield,
    title: "Public Interest Data",
    description: "Strengthen national oversight with aggregated, anonymized data for policy decisions.",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop",
  },
];

const partnerCountries = [
  { name: "Honduras", registries: ["IHCAFE", "ICF"], status: "live", farmers: "28,000+", image: "https://images.unsplash.com/photo-1502657877623-f66bf489d236?q=80&w=400&auto=format&fit=crop" },
  { name: "Ivory Coast", registries: ["Conseil Cafe-Cacao"], status: "live", farmers: "45,000+", image: "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?q=80&w=400&auto=format&fit=crop" },
  { name: "Uganda", registries: ["UCDA"], status: "pilot", farmers: "12,000+", image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=400&auto=format&fit=crop" },
  { name: "Indonesia", registries: ["ITPC"], status: "pilot", farmers: "8,000+", image: "https://images.unsplash.com/photo-1555899434-94d1368aa7af?q=80&w=400&auto=format&fit=crop" },
];

export default function CountriesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0">
          <Image
            src="/images/country-hero.jpg"
            alt="Dramatic aerial view of forested mountain peak representing national sovereignty and landscape stewardship"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--forest-canopy)]/90 via-[var(--forest-canopy)]/70 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-[var(--data-emerald)] text-[var(--forest-canopy)] px-5 py-2.5 rounded-full text-sm font-bold mb-8">
              <Globe className="w-4 h-4" />
              <span>Government & Registry Partners</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
              DPI-Native<br />Infrastructure
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
              Strengthen national registries and public interest data while maintaining full sovereignty. We power infrastructure, we don&apos;t replace it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Button
                asChild
                size="lg"
                className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-6 md:px-10 py-5 md:py-7 text-base md:text-xl rounded-full shadow-2xl w-full sm:w-auto"
              >
                <a
                  href={`${DASHBOARD_URL}/create-account?role=registry`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Create registry account
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-white/60 text-white hover:bg-white/10 bg-transparent px-6 md:px-10 py-5 md:py-7 text-base md:text-xl rounded-full w-full sm:w-auto"
              >
                <a href={COUNTRY_DEMO} target="_blank" rel="noopener noreferrer">
                  Try demo first
                </a>
              </Button>
            </div>
            <p className="text-white/60 text-sm mt-4">
              30 days free. No credit card required.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Current Partners */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Current Partner Countries
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Working with national registries across coffee and cocoa producing regions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerCountries.map((country, index) => (
              <motion.div
                key={country.name}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-border"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={country.image}
                    alt={country.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{country.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      country.status === "live" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                    }`}>
                      {country.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-sm text-foreground/60 mb-2">Integrated Registries</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {country.registries.map((registry) => (
                      <span key={registry} className="text-xs bg-muted px-2 py-1 rounded-full text-foreground">
                        {registry}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-[var(--data-emerald)]" />
                    <span className="text-foreground/70">{country.farmers} farmers</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features with Images */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Digital Public Infrastructure
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Open architecture designed to strengthen, not replace, national systems.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)] flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-foreground/70 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integration Architecture */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                How Integration Works
              </h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-lg mb-2">API Connection</h4>
                    <p className="text-foreground/70">REST endpoints sync with your existing registry to pull cadastral boundaries and producer data.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-lg mb-2">Data Enrichment</h4>
                    <p className="text-foreground/70">Farmers use our app to add polygon boundaries, photos, and compliance documentation.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-lg mb-2">Bidirectional Sync</h4>
                    <p className="text-foreground/70">Aggregated, anonymized data flows back to strengthen national oversight and policy decisions.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[var(--forest-canopy)] rounded-3xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-8">Technical Standards</h3>
              <div className="space-y-4">
                <div className="bg-white/10 rounded-xl p-5">
                  <div className="text-white/60 text-sm mb-1">Coordinate System</div>
                  <div className="text-white font-mono text-lg">WGS84 (EPSG:4326)</div>
                </div>
                <div className="bg-white/10 rounded-xl p-5">
                  <div className="text-white/60 text-sm mb-1">Data Format</div>
                  <div className="text-white font-mono text-lg">GeoJSON, GS1 EPCIS</div>
                </div>
                <div className="bg-white/10 rounded-xl p-5">
                  <div className="text-white/60 text-sm mb-1">Precision</div>
                  <div className="text-white font-mono text-lg">6 decimal places minimum</div>
                </div>
                <div className="bg-white/10 rounded-xl p-5">
                  <div className="text-white/60 text-sm mb-1">API Protocol</div>
                  <div className="text-white font-mono text-lg">REST + SOAP/XML (TRACES NT)</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="relative py-32">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=2070&auto=format&fit=crop"
            alt="Agricultural landscape with farmers"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[var(--forest-canopy)]/80" />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-2xl md:text-3xl text-white font-medium leading-relaxed mb-8 italic">
              &ldquo;Tracebud helps us modernize our producer registry without replacing systems we&apos;ve invested
              years in building. True digital public infrastructure.&rdquo;
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--data-emerald)]">
                <Image
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop"
                  alt="Dr. Roberto Mejia"
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              <div className="text-left">
                <div className="text-white font-bold">Dr. Roberto Mejia</div>
                <div className="text-white/70">Director, IHCAFE Honduras</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Start modernizing your registry
            </h2>
            <p className="text-base md:text-xl text-foreground/70 max-w-2xl mx-auto mb-8">
              30-day free trial with full access. Set up your country dashboard in minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                asChild
                size="lg"
                className="bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-bold px-10 py-6 text-lg rounded-full"
              >
                <a href={`${DASHBOARD_URL}/create-account?role=registry`} target="_blank" rel="noopener noreferrer">
                  Create registry account
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[var(--forest-canopy)] text-[var(--forest-canopy)] font-bold px-10 py-6 text-lg rounded-full"
              >
                <a href={COUNTRY_DEMO} target="_blank" rel="noopener noreferrer">
                  Try demo first
                </a>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/demo"
                className="text-foreground/60 hover:text-foreground transition-colors inline-flex items-center gap-2"
              >
                Need a personalized demo for your ministry?
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
