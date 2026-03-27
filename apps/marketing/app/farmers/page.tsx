"use client";

import { motion } from "framer-motion";
import { WifiOff, Camera, FileCheck, Shield, Smartphone, MapPin, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/tracebud/header";
import { Footer } from "@/components/tracebud/footer";

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
    description: "Timestamped, geo-tagged photographs to override satellite false-positives during EU audits.",
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
    description: "Low-risk country producers submit a one-time simplified declaration for market access.",
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
              <Smartphone className="w-4 h-4" />
              <span>Offline-First Mobile App</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
              Your Farm.<br />Your Data.<br />Any Market.
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
              Map your plot offline, capture verification photos, and receive your EUDR compliance passport in minutes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-bold px-10 py-7 text-xl rounded-full shadow-2xl"
              >
                Download App
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/60 text-white hover:bg-white/10 bg-transparent px-10 py-7 text-xl rounded-full"
              >
                Watch Demo
              </Button>
            </div>
          </motion.div>
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
                Designed for every farmer
              </h2>
              <p className="text-xl text-foreground/70 mb-8 leading-relaxed">
                Our mobile app works without internet, speaks your language, and guides you step-by-step through the mapping process.
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
              <img
                src="/images/farmer-app-homepage.png"
                alt="Tracebud farmer app homepage - Maria Santos dashboard"
                className="w-72 md:w-80 h-auto"
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
              Built for the Field
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Every feature designed for the realities of smallholder agriculture.
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
              Get Compliant in 4 Steps
            </h2>
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
              "Before Tracebud, I had no proof my coffee was deforestation-free. Now I have a digital passport that opens doors to European buyers who pay premium prices."
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

      {/* CTA */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Ready to secure your market access?
            </h2>
            <p className="text-xl text-foreground/70 mb-10">
              EUDR Deadline: December 30, 2026. Start mapping today.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                className="bg-[var(--forest-canopy)] hover:bg-[var(--forest-light)] text-white font-bold px-12 py-7 text-xl rounded-full"
              >
                Download Free App
              </Button>
              <Link href="/exporters">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-[var(--forest-canopy)] text-[var(--forest-canopy)] hover:bg-[var(--forest-canopy)]/5 px-12 py-7 text-xl rounded-full"
                >
                  I'm an Exporter
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
