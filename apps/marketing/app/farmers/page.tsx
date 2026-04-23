"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { WifiOff, Camera, FileCheck, Shield, Smartphone, CheckCircle, Users, User, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/tracebud/header";
import { Footer } from "@/components/tracebud/footer";

const FIELD_APP_DEMO = "https://fieldapp-demo.tracebud.com";
const COOP_DASHBOARD_DEMO = "https://cooperative-demo.tracebud.com";
const DASHBOARD_URL = "https://app.tracebud.com";
const APP_STORE_URL = "https://apps.apple.com/app/tracebud";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.tracebud";

const features = [
  {
    icon: WifiOff,
    title: "Offline-First Mapping",
    description: "GPS polygon capture works without internet. Waypoint averaging filters multipath errors under tropical canopy.",
    image: "/images/feature-offline-mapping.jpg",
  },
  {
    icon: Camera,
    title: "Photo Vault",
    description:
      "Timestamped, geo-tagged directional photos (e.g. cardinal views) to challenge satellite false-positives during EU audits.",
    image: "/images/feature-photo-vault.jpg",
  },
  {
    icon: FileCheck,
    title: "Digital Receipts",
    description: "QR-based Proof of Compliance that you can port to any buyer. Your data, your ownership.",
    image: "/images/feature-digital-receipts.jpg",
  },
  {
    icon: Shield,
    title: "Simplified Declaration",
    description:
      "Micro/small operators in qualifying paths can file a one-time simplified declaration using a postal address and/or a single six-decimal GPS anchor—alongside plot mapping when required.",
    image: "/images/feature-declaration.jpg",
  },
];

const steps = [
  { step: "1", title: "Download App", description: "Get the offline-capable app on your smartphone", image: "/images/step-download.jpg" },
  { step: "2", title: "Map Your Plot", description: "Walk your polygon boundary with GPS averaging", image: "/images/step-map-plot.jpg" },
  { step: "3", title: "Take Photos", description: "Capture evidence for verification", image: "/images/step-photos.jpg" },
  { step: "4", title: "Get Certified", description: "Receive your compliance passport", image: "/images/step-certified.jpg" },
];

export default function FarmersPage() {
  useEffect(() => {
    document.title = "Farmers & cooperatives | Tracebud - Field to market compliance";
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero with Full-Bleed Image */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0">
          <Image
            src="/images/farmer-hero.jpg"
            alt="Aerial view of coffee farmland alongside tropical forest at golden hour"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-[var(--data-emerald)] text-[var(--forest-canopy)] px-5 py-2.5 rounded-full text-sm font-bold mb-8">
              <User className="w-4 h-4" />
              <Users className="w-4 h-4" />
              <span>Farmers &amp; cooperatives</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
              From the field<br />to every market.
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-6 leading-relaxed">
              Members map plots offline on the phone; cooperatives roll up evidence and batches for exporters and EUDR—one Tracebud stack, whether you farm alone or together.
            </p>
            <p className="text-sm md:text-base text-white/75 mb-10">
              Free for farmers. Start mapping your plots in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Button
                asChild
                size="lg"
                className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-6 md:px-10 py-5 md:py-7 text-base md:text-xl rounded-full shadow-2xl w-full sm:w-auto"
              >
                <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                  Download for iOS
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-white/60 text-white hover:bg-white/10 bg-transparent px-6 md:px-10 py-5 md:py-7 text-base md:text-xl rounded-full w-full sm:w-auto"
              >
                <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                  Download for Android
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-white/60 text-white hover:bg-white/10 bg-transparent px-6 md:px-10 py-5 md:py-7 text-base md:text-xl rounded-full w-full sm:w-auto"
              >
                <a href={FIELD_APP_DEMO} target="_blank" rel="noopener noreferrer">
                  Try demo first
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Two paths: farmers + cooperatives */}
      <section className="py-16 md:py-20 px-6 bg-[var(--forest-canopy)] text-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12 md:mb-14"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">One platform, two ways in</h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Individual growers and cooperative teams use the same compliance graph—different screens for different jobs.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <motion.div
              className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm p-8 md:p-10 flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)] flex items-center justify-center mb-5">
                <Smartphone className="w-6 h-6 text-[var(--forest-canopy)]" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Individual farmers</h3>
              <p className="text-white/80 leading-relaxed mb-6 flex-1">
                Walk your plot with GPS, store data offline, add photos for audits, and keep a portable compliance passport you can show any buyer.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-[var(--forest-canopy)] rounded-lg text-sm font-bold hover:bg-white/90 transition-colors"
                >
                  App Store
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-[var(--forest-canopy)] rounded-lg text-sm font-bold hover:bg-white/90 transition-colors"
                >
                  Google Play
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
            <motion.div
              className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm p-8 md:p-10 flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--data-emerald)] flex items-center justify-center mb-5">
                <Users className="w-6 h-6 text-[var(--forest-canopy)]" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Cooperatives</h3>
              <p className="text-white/80 leading-relaxed mb-6 flex-1">
                See every member plot, review submissions, seal cooperative batches, and hand traceable coffee or cocoa to exporters with DDS-ready evidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`${DASHBOARD_URL}/signup?role=cooperative`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-[var(--forest-canopy)] rounded-lg text-sm font-bold hover:bg-white/90 transition-colors"
                >
                  Create account
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={COOP_DASHBOARD_DEMO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-bold text-[var(--data-emerald)] hover:underline text-sm"
                >
                  Try demo first
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* App Screenshot Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                The app your members already carry
              </h2>
              <p className="text-xl text-foreground/70 mb-8 leading-relaxed">
                The same offline-first experience works for a single smallholder or hundreds of cooperative members—simple enough for the field, rigorous enough for EU due diligence.
              </p>
              <ul className="space-y-4">
                {["Works 100% offline", "Available in 12+ languages", "No technical training required", "Instant polygon verification"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-lg text-foreground">
                    <CheckCircle className="w-6 h-6 text-[var(--data-emerald)] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex justify-center w-full"
            >
              {/* App Mockup Image */}
              <Image
                src="/images/farmer-app-homepage.png"
                alt="Tracebud farmer app homepage - Maria Santos dashboard"
                width={400}
                height={800}
                className="w-72 md:w-80 h-auto"
                sizes="(max-width: 768px) 18rem, 20rem"
              />
            </motion.div>
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
              Built for the field—and the back office
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Features that hold up under canopy, low bandwidth, and cooperative-scale rollouts.
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
                  <div className="relative h-56 overflow-hidden">
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

      {/* How It Works with Images */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Get compliant in four steps
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Typical path for a member farmer; your cooperative can monitor progress for every plot from the dashboard.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                className="group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-[var(--forest-canopy)]/40 group-hover:bg-[var(--forest-canopy)]/20 transition-colors" />
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-[var(--data-emerald)] text-[var(--forest-canopy)] text-lg font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{item.title}</h3>
                <p className="text-foreground/70 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?q=80&w=2070&auto=format&fit=crop"
            alt="Coffee farmer smiling in plantation"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[var(--forest-canopy)]/80" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-2xl md:text-3xl text-white font-medium leading-relaxed mb-8 italic">
              {
                '"Before Tracebud, I had no proof my coffee was deforestation-free. Now I have a digital passport that opens doors to European buyers who pay premium prices."'
              }
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--data-emerald)]">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_ovl863ovl863ovl8.png-c53xqJEY3Dl9bxyOVl3m0cSYyKnxof.jpeg"
                  alt="Maria Santos"
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              <div className="text-left">
                <div className="text-white font-bold">Maria Santos</div>
                <div className="text-white/70">Coffee Farmer, Honduras</div>
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
              Start mapping your plots today
            </h2>
            <p className="text-base md:text-xl text-foreground/70 max-w-2xl mx-auto mb-8">
              Free for individual farmers. Cooperatives get a 30-day free trial with full access.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                asChild
                size="lg"
                className="bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-bold px-8 py-6 text-lg rounded-full"
              >
                <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                  Download for iOS
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-bold px-8 py-6 text-lg rounded-full"
              >
                <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                  Download for Android
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={`${DASHBOARD_URL}/signup?role=cooperative`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--forest-canopy)] font-semibold hover:underline inline-flex items-center gap-2"
              >
                Create cooperative account
                <ArrowRight className="w-4 h-4" />
              </a>
              <span className="hidden sm:inline text-foreground/30">|</span>
              <Link
                href="/demo"
                className="text-foreground/60 hover:text-foreground transition-colors inline-flex items-center gap-2"
              >
                Book a personalized demo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Secondary CTA */}
          <div className="text-center mt-12 pt-8 border-t border-border">
            <p className="text-foreground/60 text-sm mb-3">Are you an exporter or importer?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/exporters">
                <Button variant="outline" className="border-[var(--forest-canopy)] text-[var(--forest-canopy)] rounded-full text-sm px-6">
                  Exporter Dashboard
                </Button>
              </Link>
              <Link href="/importers">
                <Button variant="outline" className="border-[var(--forest-canopy)] text-[var(--forest-canopy)] rounded-full text-sm px-6">
                  Importer Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
