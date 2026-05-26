"use client";

import { motion } from "framer-motion";
import { ArrowRight, Layers, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { WaitlistDialog, useWaitlistDialog } from "@/components/waitlist-dialog";

export function Hero() {
  const waitlist = useWaitlistDialog();

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/farmer-hero.jpg"
            alt="Farmer in coffee field"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--forest-canopy)]/95 via-[var(--forest-canopy)]/80 to-[var(--forest-canopy)]/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 text-balance">
                Traceability that works for everyone in the chain.
              </h1>
              
              <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8 max-w-xl">
                Tracebud makes EUDR compliance simple, self-serve, and affordable — so farmers, cooperatives, exporters, and buyers can collect, share, and reuse origin data without chasing paperwork.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-6 text-base rounded-full"
                  asChild
                >
                  <a href="#how-it-works">See how it works</a>
                </Button>
                <Button
                  size="lg"
                  onClick={() => waitlist.setOpen(true)}
                  className="bg-[var(--data-emerald)] hover:bg-emerald-400 text-[var(--forest-canopy)] font-semibold px-8 py-6 text-base rounded-full"
                >
                  Talk to us
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>

              <p className="text-sm text-white/60">
                Free for producers. Built for low-connectivity, low-friction field realities. No consultants required.
              </p>
            </motion.div>

            {/* Right: App Screenshot - clean, no background */}
            <motion.div
              className="relative flex justify-center lg:justify-end"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative w-[280px] md:w-[320px]">
                <Image
                  src="/images/farmer-app-homepage.png"
                  alt="Tracebud Farmer App interface"
                  width={320}
                  height={693}
                  className="w-full h-auto"
                />

                {/* Floating badges */}
                <div className="absolute -left-8 top-1/4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-semibold text-gray-800">Works Offline</span>
                  </div>
                </div>

                <div className="absolute -right-4 bottom-1/3 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="text-2xl font-bold text-[var(--forest-canopy)]">20 min</div>
                  <div className="text-xs text-gray-500">to map a farm</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Tracebud Section */}
      <section className="relative overflow-hidden bg-white py-24 md:py-32">
        {/* Full-bleed image on right half */}
        <div className="absolute inset-y-0 right-0 w-1/2 hidden lg:block">
          <Image
            src="/images/inclusion-visual.jpg"
            alt="Smallholder farmer using Tracebud on a smartphone"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="lg:max-w-[55%]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--forest-canopy)] mb-8 text-balance leading-tight">
                Compliance should not be complicated to be credible.
              </h2>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-12">
                Most supply chains do not fail because people do not care. They fail because the process is too manual, too expensive, and too fragmented. Tracebud removes the back-and-forth so every actor can participate, even when the network is large, spread out, or under-resourced.
              </p>
            </motion.div>

            <div className="space-y-5">
              {[
                {
                  icon: Layers,
                  title: "Simple",
                  description: "One platform. One workflow. One source of truth.",
                },
                {
                  icon: Zap,
                  title: "Automated",
                  description: "Requests move through the network automatically, so proof reaches the source faster.",
                },
                {
                  icon: Users,
                  title: "Inclusive",
                  description: "Farmers can participate directly, even with limited digital access, shared devices, or spotty signal.",
                },
              ].map((pillar, index) => (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex gap-5 items-start"
                >
                  <div className="w-11 h-11 rounded-xl bg-[var(--forest-canopy)] flex items-center justify-center flex-shrink-0">
                    <pillar.icon className="w-5 h-5 text-[var(--data-emerald)]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--forest-canopy)] mb-0.5">{pillar.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{pillar.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile image fallback */}
        <div className="lg:hidden mt-12 mx-6 relative aspect-[4/3] rounded-2xl overflow-hidden">
          <Image
            src="/images/inclusion-visual.jpg"
            alt="Smallholder farmer using Tracebud on a smartphone"
            fill
            className="object-cover"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative overflow-hidden bg-[var(--forest-canopy)] py-24 md:py-32">
        {/* Background image with strong overlay */}
        <div className="absolute inset-0">
          <Image
            src="/images/supply-chain-flow.jpg"
            alt="Aerial view of coffee plantation"
            fill
            className="object-cover opacity-20"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              From first request to reusable proof.
            </h2>
            <p className="text-white/60 text-lg">Four steps. No complexity.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
            {[
              {
                number: "01",
                title: "Add your network",
                description: "One contact or five hundred. Upload a CSV or add them manually.",
              },
              {
                number: "02",
                title: "Send one request",
                description: "Let it flow through the chain automatically. No chasing.",
              },
              {
                number: "03",
                title: "Collect origin data",
                description: "Capture it once, then reuse it across shipments and buyers.",
              },
              {
                number: "04",
                title: "Stay aligned",
                description: "Keep everyone on the same page with a shared, digital workflow.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.number}
                className="bg-[var(--forest-canopy)] p-8 flex flex-col gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="text-[var(--data-emerald)] text-xs font-bold tracking-widest uppercase">{item.number}</div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-white/60 leading-relaxed text-sm">{item.description}</p>
                </div>
                <div className="mt-auto pt-4 border-t border-white/10">
                  <div className="w-6 h-0.5 bg-[var(--data-emerald)]" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <WaitlistDialog open={waitlist.open} onOpenChange={waitlist.onOpenChange} />
    </>
  );
}
